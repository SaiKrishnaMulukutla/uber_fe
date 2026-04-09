import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@uber_fe/shared';

interface AppShellProps {
  appName: string;
  navLinks: { to: string; label: string }[];
}

export function AppShell({ appName, navLinks }: AppShellProps) {
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);

  const handleLogout = () => {
    clearSession();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">{appName}</span>
        <nav className="flex items-center gap-4">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm text-gray-600 hover:text-black">
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-black">
            Logout
          </button>
        </nav>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
