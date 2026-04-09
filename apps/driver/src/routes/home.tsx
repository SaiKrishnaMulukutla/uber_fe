import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { drivers, useSessionStore } from '@uber_fe/shared';
import type { Driver, DriverStatus } from '@uber_fe/shared';
import { Button, Spinner } from '@uber_fe/ui';

export default function Home() {
  const navigate = useNavigate();
  const userId = useSessionStore((s) => s.userId);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) drivers.getProfile(userId).then(setDriver).finally(() => setLoading(false));
  }, [userId]);

  const toggle = async () => {
    if (!userId || !driver) return;
    const next: DriverStatus = driver.status === 'offline' ? 'available' : 'offline';
    try {
      setToggling(true);
      setError('');
      const updated = await drivers.updateStatus(userId, next);
      setDriver(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (!driver) return <p className="text-sm text-red-600">Failed to load profile.</p>;

  const isOnline = driver.status !== 'offline';

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border rounded-xl p-6">
        <p className="text-lg font-semibold">{driver.name}</p>
        <p className="text-sm text-gray-500">{driver.vehicle_type} · {driver.license_plate}</p>
        <div className="flex items-center gap-1 mt-2 text-sm">
          <span className="text-yellow-400 text-lg">★</span>
          <span className="font-medium">{driver.rating.toFixed(1)}</span>
          <span className="text-gray-400">({driver.rating_count})</span>
        </div>
      </div>

      <div className={`rounded-xl p-4 text-center font-medium ${isOnline ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>
        {driver.status === 'busy' ? 'On a trip' : isOnline ? 'Online — waiting for rides' : 'Offline'}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {driver.status !== 'busy' && (
        <Button
          variant={isOnline ? 'secondary' : 'primary'}
          onClick={toggle}
          loading={toggling}
          className="w-full"
        >
          {isOnline ? 'Go offline' : 'Go online'}
        </Button>
      )}

      {driver.status === 'busy' && (
        <Button onClick={() => navigate('/trip/active/current')} className="w-full">
          View active trip
        </Button>
      )}
    </div>
  );
}
