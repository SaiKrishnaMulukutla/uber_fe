import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trips } from '@uber_fe/shared';
import type { Trip } from '@uber_fe/shared';
import { Map, TripProgressSteps, BottomSheet } from '@uber_fe/ui';

const POLL_INTERVAL = 5000;

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return <span className="font-mono text-sm font-medium text-gray-700">{mm}:{ss}</span>;
}

export default function ActiveTrip() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Location publishing helpers
  const startLocationPublish = useCallback(() => {
    if (!tripId || watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        trips.pushLocation(tripId, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }).catch(() => {});
      },
      () => { /* silent */ },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }, [tripId]);

  const stopLocationPublish = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      const t = await trips.get(tripId);
      setTrip(t);
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') {
        stopLocationPublish();
        navigate('/', { replace: true });
      }
    } catch {
      setLoadError(true);
    }
  }, [tripId, navigate, stopLocationPublish]);

  // Init: fetch trip + start polling
  useEffect(() => {
    fetchTrip();
    pollIntervalRef.current = setInterval(fetchTrip, POLL_INTERVAL);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      stopLocationPublish();
    };
  }, [fetchTrip, stopLocationPublish]);

  // Toggle location publishing based on trip status
  useEffect(() => {
    if (trip?.status === 'STARTED') {
      startLocationPublish();
    } else {
      stopLocationPublish();
    }
  }, [trip?.status, startLocationPublish, stopLocationPublish]);

  const handleStart = async () => {
    if (!tripId) return;
    try {
      setActing(true);
      setActionError('');
      const updated = await trips.start(tripId);
      setTrip(updated);
    } catch (e) {
      const status = e instanceof Error && 'status' in e ? (e as { status: number }).status : 0;
      if (status === 409) {
        await fetchTrip(); // trip already started — refetch
      } else {
        setActionError(e instanceof Error ? e.message : 'Failed to start trip');
      }
    } finally {
      setActing(false);
    }
  };

  const handleEnd = async () => {
    if (!tripId) return;
    try {
      setActing(true);
      setActionError('');
      setShowEndConfirm(false);
      await trips.end(tripId);
      stopLocationPublish();
      navigate('/', { replace: true });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to end trip');
    } finally {
      setActing(false);
    }
  };

  // Loading state
  if (!trip && !loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (loadError && !trip) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-black px-6">
        <p className="text-white font-semibold text-lg">Failed to load trip</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="h-12 px-8 bg-white text-black rounded-full font-semibold text-sm"
        >
          Go home
        </button>
      </div>
    );
  }

  if (!trip) return null;

  const mapCenter =
    trip.status === 'STARTED'
      ? { lat: trip.drop_lat, lng: trip.drop_lng }
      : { lat: trip.pickup_lat, lng: trip.pickup_lng };

  const progressStep =
    trip.status === 'DRIVER_ASSIGNED' ? 'driver_found' :
    trip.status === 'STARTED' ? 'en_route' :
    'arrived';

  return (
    <div className="relative h-full overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-10">
        <Map
          center={mapCenter}
          zoom={14}
          pickup={{ lat: trip.pickup_lat, lng: trip.pickup_lng }}
          drop={{ lat: trip.drop_lat, lng: trip.drop_lng }}
        />
      </div>

      {/* Floating status badge */}
      <div className="absolute top-4 inset-x-4 z-30 flex justify-center">
        <div className={`px-5 py-2 rounded-full text-sm font-bold shadow-md ${
          trip.status === 'STARTED'
            ? 'bg-green-500 text-white'
            : 'bg-black text-white'
        }`}>
          {trip.status === 'DRIVER_ASSIGNED' ? '📍 Head to pickup' : '🚗 Trip in progress'}
        </div>
      </div>

      {/* Bottom sheet */}
      <BottomSheet>
        <div className="px-5 pb-4">
          {/* Progress steps */}
          <div className="mb-4">
            <TripProgressSteps currentStep={progressStep} />
          </div>

          {/* Rider info row */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-3">
            <div>
              <p className="text-xs text-gray-400 font-medium">Rider</p>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                {trip.rider_email}
              </p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
              trip.payment_method === 'cash'
                ? 'bg-green-50 text-green-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
              {trip.payment_method === 'cash' ? '💵 Cash' : trip.payment_method === 'wallet' ? '👛 Wallet' : '💳 Card'}
            </span>
          </div>

          {/* DRIVER_ASSIGNED: navigate to pickup */}
          {trip.status === 'DRIVER_ASSIGNED' && (
            <div className="mb-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                <p className="text-xs text-gray-400 font-medium mb-1">Navigate to pickup</p>
                <p className="text-sm font-medium text-gray-900">
                  {trip.pickup_lat.toFixed(4)}, {trip.pickup_lng.toFixed(4)}
                </p>
              </div>
              {actionError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-3">
                  {actionError}
                </p>
              )}
              <button
                onClick={handleStart}
                disabled={acting}
                className="w-full h-14 bg-black text-white rounded-full font-bold text-base disabled:opacity-40 active:scale-95 transition-all"
              >
                {acting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Starting…
                  </span>
                ) : 'Start trip'}
              </button>
            </div>
          )}

          {/* STARTED: timer + end trip */}
          {trip.status === 'STARTED' && (
            <div className="mb-4">
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Destination</p>
                  <p className="text-sm font-medium text-gray-900">
                    {trip.drop_lat.toFixed(4)}, {trip.drop_lng.toFixed(4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Elapsed</p>
                  {trip.started_at ? (
                    <ElapsedTimer startedAt={trip.started_at} />
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
              </div>
              {actionError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-3">
                  {actionError}
                </p>
              )}
              <button
                onClick={() => setShowEndConfirm(true)}
                disabled={acting}
                className="w-full h-14 bg-red-500 text-white rounded-full font-bold text-base disabled:opacity-40 active:scale-95 transition-all"
              >
                {acting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ending…
                  </span>
                ) : 'End trip'}
              </button>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* End trip confirmation modal */}
      {showEndConfirm && (
        <div className="absolute inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowEndConfirm(false)} />
          <div className="relative bg-white rounded-t-3xl w-full px-6 pt-6 pb-10 animate-slide-up">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">End this trip?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Rider: {trip.rider_email}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 h-14 bg-gray-100 text-gray-700 rounded-full font-semibold text-sm active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleEnd}
                disabled={acting}
                className="flex-1 h-14 bg-red-500 text-white rounded-full font-bold text-base disabled:opacity-40 active:scale-95 transition-transform"
              >
                End trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
