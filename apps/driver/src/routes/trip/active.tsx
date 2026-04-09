import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trips } from '@uber_fe/shared';
import type { Trip } from '@uber_fe/shared';
import { Button, Map, TripStatusBadge, Spinner } from '@uber_fe/ui';

const LOCATION_INTERVAL = 3000;
const POLL_INTERVAL = 5000;

export default function ActiveTrip() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      const t = await trips.get(tripId);
      setTrip(t);
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') {
        stopLocationPublish();
        navigate('/');
      }
    } catch { /* ignore */ }
  }, [tripId, navigate]);

  const startLocationPublish = () => {
    if (!tripId || locationIntervalRef.current) return;
    locationIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        trips.pushLocation(tripId, { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {});
      });
    }, LOCATION_INTERVAL);
  };

  const stopLocationPublish = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  useEffect(() => {
    fetchTrip();
    const poll = setInterval(fetchTrip, POLL_INTERVAL);
    return () => { clearInterval(poll); stopLocationPublish(); };
  }, [fetchTrip]);

  useEffect(() => {
    if (trip?.status === 'STARTED') startLocationPublish();
    else stopLocationPublish();
  }, [trip?.status]);

  const handleStart = async () => {
    if (!tripId) return;
    try { setActing(true); const t = await trips.start(tripId); setTrip(t); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setActing(false); }
  };

  const handleEnd = async () => {
    if (!tripId) return;
    try { setActing(true); await trips.end(tripId); stopLocationPublish(); navigate('/'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setActing(false); }
  };

  if (!trip) return <div className="flex justify-center p-8"><Spinner /></div>;

  const center = { lat: trip.pickup_lat, lng: trip.pickup_lng };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Active trip</h2>
        <TripStatusBadge status={trip.status} />
      </div>

      <div className="h-64 rounded-xl overflow-hidden border">
        <Map center={center} pickup={{ lat: trip.pickup_lat, lng: trip.pickup_lng }} drop={{ lat: trip.drop_lat, lng: trip.drop_lng }} />
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border text-sm">
        <p className="text-gray-600">Rider: <span className="font-medium">{trip.rider_email}</span></p>
        <p className="text-gray-600 mt-1">Payment: <span className="font-medium capitalize">{trip.payment_method}</span></p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {trip.status === 'DRIVER_ASSIGNED' && (
        <Button onClick={handleStart} loading={acting} className="w-full">Start trip</Button>
      )}
      {trip.status === 'STARTED' && (
        <Button variant="danger" onClick={handleEnd} loading={acting} className="w-full">End trip</Button>
      )}
    </div>
  );
}
