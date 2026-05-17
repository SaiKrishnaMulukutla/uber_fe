import { AuthGuard } from '@/components/shared/AuthGuard'

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="rider">{children}</AuthGuard>
}
