import type { TripStatus } from '@uber_fe/shared';

const config: Record<TripStatus, { label: string; className: string }> = {
  REQUESTED: { label: 'Finding driver...', className: 'bg-yellow-100 text-yellow-800' },
  DRIVER_ASSIGNED: { label: 'Driver assigned', className: 'bg-blue-100 text-blue-800' },
  STARTED: { label: 'On the way', className: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Completed', className: 'bg-gray-100 text-gray-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
