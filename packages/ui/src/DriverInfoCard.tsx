interface DriverInfoCardProps {
  name: string;
  rating: number;
  vehicleType: string;
  licensePlate: string;
  eta?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function DriverInfoCard({ name, rating, vehicleType, licensePlate, eta }: DriverInfoCardProps) {
  return (
    <div className="flex items-center gap-3 px-1">
      {/* Avatar */}
      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-gray-600">{getInitials(name)}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate max-w-[160px]">{name}</p>
        <p className="text-sm text-gray-500 truncate">
          {vehicleType} · {licensePlate}
        </p>
      </div>

      {/* Rating + ETA */}
      <div className="flex-shrink-0 text-right">
        <div className="flex items-center gap-1 justify-end">
          <span className="text-yellow-400 text-base">★</span>
          <span className="font-medium text-gray-900 text-sm">{rating.toFixed(1)}</span>
        </div>
        {eta !== undefined && (
          <span className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full mt-0.5">
            ~{eta} min
          </span>
        )}
      </div>
    </div>
  );
}
