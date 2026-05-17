'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { driverLogin } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import axios from 'axios'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function DriverLoginPage() {
  const router = useRouter()
  const { setDriverAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await driverLogin(data.email, data.password)
      const { access_token, refresh_token, driver } = res.data
      setDriverAuth(access_token, driver!)
      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token, role: 'driver' }),
      })
      router.replace('/driver/home')
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Login failed'
        : 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black to-zinc-900 px-4">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-950 text-white">
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">🚕</div>
          <CardTitle className="text-2xl">Driver login</CardTitle>
          <CardDescription className="text-zinc-400">Login to your RideGo driver account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input id="email" type="email" placeholder="driver@example.com" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('email')} />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input id="password" type="password" placeholder="••••••" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('password')} />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold" disabled={loading}>
              {loading ? <LoadingSpinner size={18} /> : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-zinc-400">
            Don&apos;t have an account?{' '}
            <Link href="/driver/register" className="text-yellow-400 hover:underline">Register</Link>
          </div>
          <div className="mt-6 border-t border-zinc-800 pt-4 text-center text-sm text-zinc-500">
            Are you a rider?{' '}
            <Link href="/rider/login" className="text-yellow-400 hover:underline">Rider login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
