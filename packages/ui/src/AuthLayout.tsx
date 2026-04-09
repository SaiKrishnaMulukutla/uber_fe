import { Outlet } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
}

export function AuthLayout({ title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <Outlet />
      </div>
    </div>
  );
}
