import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trips, drivers, useSessionStore, useTripStore, useLocationStream } from '@uber_fe/shared';
import type { Trip, Driver } from '@uber_fe/shared';
import { Map, BottomSheet, DriverInfoCard, TripProgressSteps, SearchingAnimation, Button, Spinner } from '@uber_fe/ui';
import type { TripStep } from '@uber_fe/ui';

const POLL_INTERVAL = 5000;

function statusToStep(status: Trip['status']): TripStep {
  if (status === 'REQUESTED') return 'requested';
  if (status === 'DRIVER_ASSIGNED') return 'driver_found';
  if (status === 'STARTED') return 'en_route';
  return 'arrived';
}

export default function Tracking() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const { driverLocation, updateDriverLocation, setStatus } = useTripStore();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loadError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wsStatus, setWsStatus] = useState<'ok' | 'lost'>('ok');
  const shownToastRef = useRef(false);
  const [showToast, setShowToast] = useState(false);
  const pollFailures = useRef(0);
  const [showConnBanner, setShowConnBanner] = useState(false);

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      const t = await trips.get(tripId);
      setTrip(t);
      setStatus(t.status);
      pollFailures.current = 0;
      setShowConnBanner(false);

      if (t.status === 'COMPLETED') navigate(`/trip/summary/${tripId}`, { replace: true });
      if (t.status === 'CANCELLED') navigate('/', { replace: true });

      // Fetch driver profile when DRIVER_ASSIGNED
      if ((t.status === 'DRIVER_ASSIGNED' || t.status === 'STARTED') && t.driver_id && !driver) {
        drivers.getProfile(t.driver_id).then(setDriver).catch(() => {});
      }

      // Show "Driver found!" toast once
      if (t.status === 'DRIVER_ASSIGNED' && !shownToastRef.current) {
        shownToastRef.current = true;
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      }
    } catch {
      pollFailures.current += 1;
      if (pollFailures.current >= 3) setShowConnBanner(true);
    }
  }, [tripId, navigate, setStatus, driver]);

  useEffect(() => {
    fetchTrip();
    const interval = setInterval(fetchTrip, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTrip]);

  // Elapsed timer when STARTED
  useEffect(() => {
    if (trip?.status !== 'STARTED' || !trip.started_at) return;
    const start = new Date(trip.started_at).getTime();
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [trip?.status, trip?.started_at]);

  useLocationStream({
    tripId: tripId ?? null,
    token: accessToken,
    enabled: trip?.status === 'STARTED' || trip?.status === 'DRIVER_ASSIGNED',
    onLocation: (msg) => {
      updateDriverLocation({ lat: msg.lat, lng: msg.lng });
      setWsStatus('ok');
    },
  });

  // Detect WS lost (no location update for >15s while STARTED)
  const lastLocationTime = useRef(Date.now());
  useEffect(() => {
    if (driverLocation) lastLocationTime.current = Date.now();
  }, [driverLocation]);
  useEffect(() => {
    if (trip?.status !== 'STARTED') { setWsStatus('ok'); return; }
    const id = setInterval(() => {
      if (Date.now() - lastLocationTime.current > 15000) setWsStatus('lost');
      else setWsStatus('ok');
    }, 5000);
    return () => clearInterval(id);
  }, [trip?.status]);

  const handleCancel = async () => {
    if (!tripId) return;
    try {
      setCancelling(true);
      await trips.cancel(tripId);
      navigate('/');
    } catch {
      /* allow retry */
    } finally {
      setCancelling(false);
    }
  };

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Loading state
  if (!trip && !loadError) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  if (loadError || !trip) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white font-semibold">Failed to load trip</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Go home</Button>
      </div>
    );
  }

  const mapCenter = driverLocation ?? { lat: trip.pickup_lat, lng: trip.pickup_lng };

  return (
    <div className="absolute inset-0">
      {/* Full-screen map */}
      <Map
        center={mapCenter}
        pickup={{ lat: trip.pickup_lat, lng: trip.pickup_lng }}
        drop={{ lat: trip.drop_lat, lng: trip.drop_lng }}
        driverLocation={driverLocation}
        className="h-full w-full"
      />

      {/* Searching animation for REQUESTED */}
      {trip.status === 'REQUESTED' && (
        <div className="absolute inset-0 flex items-center justify-center z-15 pointer-events-none">
          <SearchingAnimation />
        </div>
      )}

      {/* Connection lost banner */}
      {wsStatus === 'lost' && (
        <div className="absolute top-4 inset-x-4 z-30">
          <div className="bg-yellow-500 text-white text-xs font-medium px-4 py-2 rounded-full text-center shadow-lg">
            Connection lost — reconnecting…
          </div>
        </div>
      )}

      {/* Connection error banner */}
      {showConnBanner && (
        <div className="absolute top-4 inset-x-4 z-30">
          <div className="bg-red-500 text-white text-xs font-medium px-4 py-2 rounded-full text-center shadow-lg">
            Check your connection
          </div>
        </div>
      )}

      {/* Driver found toast */}
      {showToast && (
        <div className="absolute top-4 inset-x-4 z-40 animate-slide-down">
          <div className="bg-green-500 text-white font-semibold text-sm px-5 py-3 rounded-2xl text-center shadow-xl">
            🎉 Driver found!
          </div>
        </div>
      )}

      {/* Bottom sheets by status */}

      {/* REQUESTED */}
      {trip.status === 'REQUESTED' && (
        <BottomSheet>
          <div className="px-4 pb-6 pt-2 flex flex-col gap-4">
            <TripProgressSteps currentStep={statusToStep(trip.status)} />
            <div className="text-center">
              <p className="font-semibold text-gray-900 text-base">Searching for a driver…</p>
              <p className="text-sm text-gray-500 mt-1">This usually takes 1–3 minutes</p>
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-sm text-red-500 font-medium text-center disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {cancelling ? <Spinner size="sm" /> : null}
              Cancel ride
            </button>
          </div>
        </BottomSheet>
      )}

      {/* DRIVER_ASSIGNED */}
      {trip.status === 'DRIVER_ASSIGNED' && (
        <BottomSheet>
          <div className="px-4 pb-6 pt-2 flex flex-col gap-4">
            <TripProgressSteps currentStep={statusToStep(trip.status)} />
            {driver ? (
              <DriverInfoCard
                name={driver.name}
                rating={driver.rating}
                vehicleType={driver.vehicle_type}
                licensePlate={driver.license_plate}
                eta={4}
              />
            ) : (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm text-red-500 font-medium text-center w-full disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {cancelling ? <Spinner size="sm" /> : null}
                Cancel ride
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* STARTED */}
      {trip.status === 'STARTED' && (
        <BottomSheet className="pb-4">
          <div className="px-4 pb-2 flex flex-col gap-3">
            <TripProgressSteps currentStep={statusToStep(trip.status)} />
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Trip in progress
                </span>
                <p className="text-xs text-gray-400 mt-1.5">
                  → {trip.drop_lat.toFixed(4)}, {trip.drop_lng.toFixed(4)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold font-mono text-gray-900 text-lg">{formatElapsed(elapsedSeconds)}</p>
                <p className="text-xs text-gray-400">elapsed</p>
              </div>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
