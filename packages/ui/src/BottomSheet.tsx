import React from 'react';

interface BottomSheetProps {
  children: React.ReactNode;
  className?: string;
  showHandle?: boolean;
}

export function BottomSheet({ children, className = '', showHandle = true }: BottomSheetProps) {
  return (
    <div
      className={`
        fixed inset-x-0 bottom-16 z-20
        bg-white rounded-t-3xl
        shadow-[0_-4px_24px_rgba(0,0,0,0.12)]
        transition-all duration-300 ease-out
        ${className}
      `}
    >
      {showHandle && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
      )}
      {children}
    </div>
  );
}
