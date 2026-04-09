import { Navigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../stores/sessionStore';
import type { UserRole } from './session';

interface RequireAuthProps {
  role: UserRole;
  children: React.ReactNode;
}

export function RequireAuth({ role, children }: RequireAuthProps) {
  const location = useLocation();
  const { accessToken, role: sessionRole } = useSessionStore();

  if (!accessToken) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (sessionRole !== role) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
