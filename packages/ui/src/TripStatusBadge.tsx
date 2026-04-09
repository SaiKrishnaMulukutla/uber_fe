import type { TripStatus } from '@uber_fe/shared';

const config: Record<TripStatus, { label: string; className: string }> = {
  REQUESTED:       { label: 'Searching',      className: 'bg-amber-50 text-amber-700' },
  DRIVER_ASSIGNED: { label: 'Driver found',   className: 'bg-blue-50 text-blue-700' },
  STARTED:         { label: 'In progress',    className: 'bg-green-50 text-green-700' },
  COMPLETED:       { label: 'Completed',      className: 'bg-black text-white' },
  CANCELLED:       { label: 'Cancelled',      className: 'bg-red-50 text-red-600' },
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
