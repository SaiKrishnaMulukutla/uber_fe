import { AuthGuard } from '@/components/shared/AuthGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="admin">{children}</AuthGuard>
}
