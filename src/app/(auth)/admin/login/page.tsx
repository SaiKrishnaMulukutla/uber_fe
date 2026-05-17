'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { riderLogin } from '@/lib/api'

function decodeJwtRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role ?? null
  } catch {
    return null
  }
}

export default function AdminLoginPage() {
  const router = useRouter()
  const { setAdminAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Enter email and password'); return }
    setLoading(true)
    try {
      const res = await riderLogin(email, password)
      const { access_token, refresh_token } = res.data

      const role = decodeJwtRole(access_token)
      if (role !== 'admin') {
        toast.error('Access denied — not an admin account')
        return
      }

      // Persist refresh token in httpOnly cookie
      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token, role: 'admin' }),
      })

      setAdminAuth(access_token)
      router.push('/admin/dashboard')
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Login failed' : 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">🛡️</div>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="text-sm text-zinc-400">RideGo control panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Email</Label>
            <Input
              type="email"
              placeholder="admin@ridego.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-300">Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
          >
            {loading ? <LoadingSpinner size={18} /> : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
