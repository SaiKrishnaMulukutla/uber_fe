interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-4xl',
};

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`
            ${sizes[size]} transition-all duration-100 leading-none
            ${readonly ? 'cursor-default' : 'hover:scale-125 active:scale-110 cursor-pointer'}
            ${star <= value ? 'text-yellow-400' : 'text-gray-200'}
          `}
        >
          ★
        </button>
      ))}
    </div>
  );
}
