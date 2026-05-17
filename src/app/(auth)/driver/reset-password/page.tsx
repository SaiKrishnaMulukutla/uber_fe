'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { driverResetPassword } from '@/lib/api'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 4) { toast.error('Enter the OTP'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await driverResetPassword(email, otp, password)
      toast.success('Password reset! Please log in.')
      router.push('/driver/login')
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Reset failed' : 'Reset failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mb-2 text-4xl">🔒</div>
        <h1 className="text-2xl font-bold text-white">Reset password</h1>
        {email && <p className="mt-1 text-sm text-zinc-400">OTP sent to {email}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300">OTP</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.slice(0, 6))}
            className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300">New password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300">Confirm password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
        >
          {loading ? <LoadingSpinner size={18} /> : 'Reset Password'}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm">
        <Link href="/driver/forgot-password" className="text-zinc-500 hover:text-zinc-300">
          Resend OTP
        </Link>
      </div>
    </div>
  )
}

export default function DriverResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black to-zinc-900 px-4">
      <Suspense fallback={<LoadingSpinner size={32} />}>
        <ResetForm />
      </Suspense>
    </div>
  )
}
