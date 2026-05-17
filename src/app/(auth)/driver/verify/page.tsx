'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { driverVerify } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import axios from 'axios'

const OTP_LENGTH = 6
const OTP_TTL = 300

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const { setDriverAuth } = useAuthStore()
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(OTP_TTL)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted.length === OTP_LENGTH) {
      setOtp(pasted.split(''))
      inputs.current[OTP_LENGTH - 1]?.focus()
    }
  }

  const onSubmit = async () => {
    const code = otp.join('')
    if (code.length < OTP_LENGTH) { toast.error('Enter all 6 digits'); return }
    setLoading(true)
    try {
      const res = await driverVerify(email, code)
      const { access_token, refresh_token, driver } = res.data
      setDriverAuth(access_token, driver!)
      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token, role: 'driver' }),
      })
      toast.success('Welcome to RideGo!')
      router.replace('/driver/home')
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Invalid OTP'
        : 'Invalid OTP'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black to-zinc-900 px-4">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-950 text-white">
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">📬</div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription className="text-zinc-400">
            We sent a 6-digit OTP to<br />
            <span className="text-white font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-lg border border-zinc-700 bg-zinc-900 text-center text-xl font-bold text-white focus:border-yellow-400 focus:outline-none"
              />
            ))}
          </div>
          <Button
            onClick={onSubmit}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size={18} /> : 'Verify'}
          </Button>
          <div className="text-center text-sm text-zinc-400">
            {countdown > 0 ? (
              <span>Resend in <span className="text-white">{formatTime(countdown)}</span></span>
            ) : (
              <button
                onClick={() => toast.info('Go back and register again to resend')}
                className="text-yellow-400 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DriverVerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
