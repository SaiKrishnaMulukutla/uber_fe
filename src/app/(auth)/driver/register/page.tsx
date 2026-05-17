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
import { driverRegister } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import axios from 'axios'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Enter phone in E.164 format e.g. +919182641174'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  vehicle_type: z.enum(['go', 'x', 'xl'] as const, { message: 'Select a vehicle type' }),
  license_plate: z.string().min(2, 'Enter license plate'),
})
type FormData = z.infer<typeof schema>

const VEHICLE_TYPES = [
  { value: 'go', label: 'Go', desc: 'Hatchback · ₹30 base' },
  { value: 'x', label: 'X', desc: 'Sedan · ₹50 base' },
  { value: 'xl', label: 'XL', desc: 'SUV · ₹80 base' },
]

export default function DriverRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('x')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_type: 'x' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await driverRegister(data)
      toast.success('OTP sent to your email')
      router.push(`/driver/verify?email=${encodeURIComponent(data.email)}`)
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
          <div className="mb-2 text-4xl">🚕</div>
          <CardTitle className="text-2xl">Become a driver</CardTitle>
          <CardDescription className="text-zinc-400">Join RideGo and start earning</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-zinc-300">Full Name</Label>
              <Input placeholder="Anjaneya Sharma" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Email</Label>
              <Input type="email" placeholder="driver@example.com" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('email')} />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Phone</Label>
              <Input type="tel" placeholder="+919182641174" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">Password</Label>
              <Input type="password" placeholder="••••••" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500" {...register('password')} />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Vehicle Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => { setSelectedType(v.value); setValue('vehicle_type', v.value as 'go' | 'x' | 'xl') }}
                    className={`rounded-lg border p-2 text-center text-xs transition-colors ${
                      selectedType === v.value
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <div className="font-bold text-base">{v.label}</div>
                    <div>{v.desc}</div>
                  </button>
                ))}
              </div>
              {errors.vehicle_type && <p className="text-xs text-red-400">{errors.vehicle_type.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300">License Plate</Label>
              <Input placeholder="AP-45-CK-2004" className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 uppercase" {...register('license_plate')} />
              {errors.license_plate && <p className="text-xs text-red-400">{errors.license_plate.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold" disabled={loading}>
              {loading ? <LoadingSpinner size={18} /> : 'Send OTP'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link href="/driver/login" className="text-yellow-400 hover:underline">Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
