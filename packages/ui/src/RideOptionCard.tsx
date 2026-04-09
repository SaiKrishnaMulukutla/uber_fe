interface RideOptionCardProps {
  id: string;
  label: string;
  description: string;
  icon: string;
  capacity: number;
  fare: number;
  eta: number;
  selected: boolean;
  onClick: () => void;
}

export function RideOptionCard({
  label,
  description,
  icon,
  capacity,
  fare,
  eta,
  selected,
  onClick,
}: RideOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-2xl
        border-2 transition-all duration-150 active:scale-[0.98]
        text-left
        ${selected
          ? 'border-black bg-gray-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      {/* Icon */}
      <span className="text-3xl flex-shrink-0">{icon}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">{label}</span>
          <span className="text-gray-400 text-xs">·</span>
          <span className="text-gray-500 text-xs">{capacity} seats</span>
        </div>
        <p className="text-xs text-gray-400 truncate">{description}</p>
      </div>

      {/* Fare + ETA */}
      <div className="flex-shrink-0 text-right">
        <p className="font-bold text-gray-900 text-sm">
          {fare > 0 ? `₹${Math.round(fare)}` : '—'}
        </p>
        <p className="text-xs text-gray-400">~{eta} min</p>
      </div>
    </button>
  );
}
