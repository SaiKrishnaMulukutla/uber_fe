import { Badge } from '@/components/ui/badge'
import { TripStatus } from '@/types'

const STATUS_CONFIG: Record<TripStatus, { label: string; className: string }> = {
  REQUESTED: { label: 'Finding driver...', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  DRIVER_ASSIGNED: { label: 'Driver assigned', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  STARTED: { label: 'In progress', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  COMPLETED: { label: 'Completed', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
