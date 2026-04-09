import { Link } from 'react-router-dom';
import { BellIcon } from './icons';

interface NotificationBellProps {
  unreadCount: number;
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  return (
    <Link to="/notifications" className="relative inline-flex items-center p-1">
      <BellIcon className="h-6 w-6 text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 animate-pulse" />
      )}
    </Link>
  );
}
