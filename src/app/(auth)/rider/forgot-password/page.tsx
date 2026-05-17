'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { riderForgotPassword } from '@/lib/api'

export default function RiderForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Enter your email'); return }
    setLoading(true)
    try {
      await riderForgotPassword(email)
      toast.success('OTP sent to your email')
      router.push(`/rider/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Request failed' : 'Request failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black to-zinc-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">🔑</div>
          <h1 className="text-2xl font-bold text-white">Forgot password</h1>
          <p className="mt-1 text-sm text-zinc-400">We&apos;ll send a reset OTP to your email</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
          >
            {loading ? <LoadingSpinner size={18} /> : 'Send OTP'}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm">
          <Link href="/rider/login" className="text-zinc-500 hover:text-zinc-300">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
