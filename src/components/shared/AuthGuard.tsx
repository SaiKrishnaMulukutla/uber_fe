'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from './LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole: 'rider' | 'driver' | 'admin'
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { accessToken, role } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!accessToken) {
      router.replace(`/${requiredRole}/login`)
      return
    }
    if (role !== requiredRole) {
      router.replace(`/${requiredRole}/login`)
    }
  }, [accessToken, role, requiredRole, router])

  if (!accessToken || role !== requiredRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  return <>{children}</>
}
