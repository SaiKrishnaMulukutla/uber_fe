import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trips, useSessionStore, useTripStore, useLocationStream } from '@uber_fe/shared';
import type { Trip } from '@uber_fe/shared';
import { Button, Map, TripStatusBadge, Spinner } from '@uber_fe/ui';

const POLL_INTERVAL = 5000;

export default function Tracking() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const { driverLocation, updateDriverLocation, setStatus } = useTripStore();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      const t = await trips.get(tripId);
      setTrip(t);
      setStatus(t.status);
      if (t.status === 'COMPLETED') navigate(`/trip/summary/${tripId}`);
      if (t.status === 'CANCELLED') navigate('/');
    } catch {
      setError('Failed to load trip');
    }
  }, [tripId, navigate, setStatus]);

  useEffect(() => {
    fetchTrip();
    const interval = setInterval(fetchTrip, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTrip]);

  useLocationStream({
    tripId: tripId ?? null,
    token: accessToken,
    enabled: trip?.status === 'STARTED' || trip?.status === 'DRIVER_ASSIGNED',
    onLocation: (msg) => updateDriverLocation({ lat: msg.lat, lng: msg.lng }),
  });

  const handleCancel = async () => {
    if (!tripId) return;
    try {
      setCancelling(true);
      await trips.cancel(tripId);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  if (!trip) return <div className="flex justify-center p-8"><Spinner /></div>;

  const center = { lat: trip.pickup_lat, lng: trip.pickup_lng };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Your ride</h2>
        <TripStatusBadge status={trip.status} />
      </div>

      <div className="h-72 rounded-xl overflow-hidden border">
        <Map
          center={driverLocation ?? center}
          pickup={{ lat: trip.pickup_lat, lng: trip.pickup_lng }}
          drop={{ lat: trip.drop_lat, lng: trip.drop_lng }}
          driverLocation={driverLocation}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(trip.status === 'REQUESTED' || trip.status === 'DRIVER_ASSIGNED') && (
        <Button variant="danger" onClick={handleCancel} loading={cancelling} className="w-full">
          Cancel ride
        </Button>
      )}
    </div>
  );
}
