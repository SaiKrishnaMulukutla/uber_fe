import { useEffect, useState } from 'react';
import { notifications as notifApi } from '@uber_fe/shared';
import type { Notification } from '@uber_fe/shared';
import { Spinner } from '@uber_fe/ui';

export default function Notifications() {
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndMark = async () => {
    const res = await notifApi.list();
    setData(res.notifications);
    res.notifications.filter((n) => !n.read).forEach((n) => notifApi.markRead(n.id));
  };

  useEffect(() => {
    fetchAndMark().finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-lg">Notifications</h2>
      {data.length === 0 && <p className="text-sm text-gray-500">No notifications.</p>}
      {data.map((n) => (
        <div key={n.id} className={`bg-white border rounded-xl p-4 ${!n.read ? 'border-black' : ''}`}>
          <p className="text-sm font-medium">{n.title}</p>
          <p className="text-xs text-gray-500 mt-1">{n.body}</p>
          <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
