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
import { riderRegister } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import axios from 'axios'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Enter phone in E.164 format e.g. +919177426101'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function RiderRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await riderRegister(data)
      toast.success('OTP sent to your email')
      router.push(`/rider/verify?email=${encodeURIComponent(data.email)}`)
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Registration failed'
        : 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black to-zinc-900 px-4 py-8">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-950 text-white">
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">🚗</div>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription className="text-zinc-400">Join RideGo as a rider</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
              <Input id="name" placeholder="Sai Krishna" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('email')} />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-zinc-300">Phone</Label>
              <Input id="phone" type="tel" placeholder="+919177426101" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input id="password" type="password" placeholder="••••••" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('password')} />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold" disabled={loading}>
              {loading ? <LoadingSpinner size={18} /> : 'Send OTP'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link href="/rider/login" className="text-yellow-400 hover:underline">Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
