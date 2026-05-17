import { AuthGuard } from '@/components/shared/AuthGuard'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="driver">{children}</AuthGuard>
}
