import { useEffect, useState, useCallback } from 'react';
import { notifications as notifApi } from '@uber_fe/shared';
import type { Notification } from '@uber_fe/shared';
import { Button } from '@uber_fe/ui';

type NotificationType = Notification['type'];

const TYPE_ICONS: Record<NotificationType, { icon: string; bg: string }> = {
  trip_completed:    { icon: '✅', bg: 'bg-green-50' },
  trip_cancelled:    { icon: '❌', bg: 'bg-red-50' },
  payment_confirmed: { icon: '💳', bg: 'bg-green-50' },
  rating_received:   { icon: '⭐', bg: 'bg-yellow-50' },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Notifications() {
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await notifApi.list(20, 0);
      setData(res.notifications);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Soft poll every 30s
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await notifApi.markRead(id);
      setData((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {/* ignore */}
  };

  const markAllRead = async () => {
    const unread = data.filter((n) => !n.read);
    if (!unread.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => notifApi.markRead(n.id)));
      setData((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {/* partial failure — ignore */}
    finally { setMarkingAll(false); }
  };

  const unreadCount = data.filter((n) => !n.read).length;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="text-xs font-semibold text-black disabled:opacity-50"
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      <div className="px-4 py-3 pb-6 flex flex-col gap-2">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{error}</p>
            <Button variant="secondary" onClick={load}>Retry</Button>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">🔔</span>
            <p className="text-lg font-bold text-gray-900">No notifications</p>
            <p className="text-gray-400 text-sm">You're all caught up</p>
          </div>
        )}

        {data.map((n) => {
          const typeConfig = TYPE_ICONS[n.type] ?? { icon: '📌', bg: 'bg-gray-50' };
          return (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`
                w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-2xl
                transition-colors duration-200
                ${!n.read
                  ? 'bg-white border-l-4 border-black shadow-sm'
                  : 'bg-white border border-gray-100'
                }
              `}
            >
              <div className={`flex-shrink-0 h-10 w-10 rounded-full ${typeConfig.bg} flex items-center justify-center text-lg`}>
                {typeConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm text-gray-900 leading-tight ${!n.read ? 'font-bold' : 'font-semibold'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400 flex-shrink-0">{formatRelative(n.created_at)}</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
