import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Brand area */}
      <div className="flex-shrink-0 flex items-center justify-center px-8 pt-16 pb-8">
        <div className="text-center">
          <p className="text-5xl font-black tracking-widest text-white">uber</p>
          {subtitle && (
            <p className="text-gray-400 text-sm mt-2">{subtitle}</p>
          )}
        </div>
      </div>

      {/* White card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10 overflow-y-auto animate-slide-up">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}
