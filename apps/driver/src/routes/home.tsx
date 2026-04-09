import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { drivers, trips, useSessionStore } from '@uber_fe/shared';
import type { Driver, Trip } from '@uber_fe/shared';
import { Map } from '@uber_fe/ui';

const BANGALORE = { lat: 12.9716, lng: 77.5946 };

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type HomeState = 'loading' | 'OFFLINE' | 'AVAILABLE' | 'INCOMING' | 'BUSY';

export default function DriverHome() {
  const navigate = useNavigate();
  const userId = useSessionStore((s) => s.userId);

  const [driver, setDriver] = useState<Driver | null>(null);
  const [homeState, setHomeState] = useState<HomeState>('loading');
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState('');

  // Geolocation
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState('');
  const watchIdRef = useRef<number | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Incoming trip
  const [incomingTrip, setIncomingTrip] = useState<Trip | null>(null);
  const [dismissCountdown, setDismissCountdown] = useState(60);
  const shownTripIdsRef = useRef(new Set<string>());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Busy state active trip
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const loadDriver = useCallback(async (): Promise<Driver | null> => {
    if (!userId) return null;
    try {
      return await drivers.getProfile(userId);
    } catch {
      return null;
    }
  }, [userId]);

  // Init: load profile + set initial state
  useEffect(() => {
    loadDriver().then((d) => {
      if (!d) { setHomeState('OFFLINE'); return; }
      setDriver(d);
      if (d.status === 'offline') setHomeState('OFFLINE');
      else if (d.status === 'busy') setHomeState('BUSY');
      else setHomeState('AVAILABLE');
    });
  }, [loadDriver]);

  // Geolocation: start watching when online
  useEffect(() => {
    const online = homeState === 'AVAILABLE' || homeState === 'INCOMING' || homeState === 'BUSY';
    if (!online) return;

    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError('');
        setDriverLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setGeoError('Location permission required. Please enable in browser settings.');
        } else if (err.code === GeolocationPositionError.TIMEOUT) {
          // fallback silently — map still shows BANGALORE center
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [homeState]);

  // Location publishing: every 10s when online
  useEffect(() => {
    const online = homeState === 'AVAILABLE' || homeState === 'INCOMING' || homeState === 'BUSY';
    if (!online || !userId) return;

    locationIntervalRef.current = setInterval(() => {
      if (driverLoc) {
        drivers.updateLocation(userId, driverLoc).catch(() => {/* silent */});
      }
    }, 10000);

    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [homeState, userId, driverLoc]);

  // Poll for incoming trips every 5s when AVAILABLE
  useEffect(() => {
    if (homeState !== 'AVAILABLE' || !userId) return;

    const poll = async () => {
      try {
        const res = await trips.history(1, 0);
        if (!res.trips.length) return;
        const latest = res.trips[0];
        if (
          latest.status === 'DRIVER_ASSIGNED' &&
          latest.driver_id === userId &&
          !shownTripIdsRef.current.has(latest.id)
        ) {
          shownTripIdsRef.current.add(latest.id);
          setIncomingTrip(latest);
          setDismissCountdown(60);
          setHomeState('INCOMING');
        }
      } catch {/* ignore */}
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 5000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [homeState, userId]);

  // Auto-dismiss countdown when INCOMING
  useEffect(() => {
    if (homeState !== 'INCOMING') return;

    countdownIntervalRef.current = setInterval(() => {
      setDismissCountdown((prev) => {
        if (prev <= 1) {
          setHomeState('AVAILABLE');
          setIncomingTrip(null);
          clearInterval(countdownIntervalRef.current!);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [homeState]);

  // Fetch active trip when BUSY
  useEffect(() => {
    if (homeState !== 'BUSY') return;
    trips.history(5, 0).then((res) => {
      const active = res.trips.find(
        (t) => t.status === 'DRIVER_ASSIGNED' || t.status === 'STARTED'
      );
      if (active) setActiveTrip(active);
    }).catch(() => {});
  }, [homeState]);

  const handleGoOnline = async () => {
    if (!userId) return;
    if (geoError) {
      setToggleError('Enable location access first to go online');
      return;
    }
    try {
      setToggling(true);
      setToggleError('');
      const updated = await drivers.updateStatus(userId, 'available');
      setDriver(updated);
      setHomeState('AVAILABLE');
    } catch {
      setToggleError('Failed to go online. Try again.');
    } finally {
      setToggling(false);
    }
  };

  const handleGoOffline = async () => {
    if (!userId) return;
    try {
      setToggling(true);
      setToggleError('');
      const updated = await drivers.updateStatus(userId, 'offline');
      setDriver(updated);
      setHomeState('OFFLINE');
    } catch {
      setToggleError('Failed to go offline. Try again.');
    } finally {
      setToggling(false);
    }
  };

  const handleDismissIncoming = () => {
    setHomeState('AVAILABLE');
    setIncomingTrip(null);
  };

  if (homeState === 'loading') {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const mapCenter = driverLoc ?? BANGALORE;
  const isOnline = homeState !== 'OFFLINE';

  return (
    <div className="relative h-full overflow-hidden">
      {/* Full-screen map */}
      <div
        className="absolute inset-0 z-10 transition-all duration-500"
        style={!isOnline ? { filter: 'grayscale(0.5) brightness(0.95)' } : undefined}
      >
        <Map
          center={mapCenter}
          zoom={15}
          driverLocation={driverLoc}
        />
      </div>

      {/* Floating top driver card */}
      {driver && (
        <div className="absolute top-4 inset-x-4 z-30">
          <div className="bg-white rounded-2xl shadow-md px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{getInitials(driver.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{driver.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {driver.vehicle_type} · {driver.license_plate}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-sm font-semibold text-gray-900">{driver.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Geo error banner */}
      {geoError && (
        <div className="absolute top-24 inset-x-4 z-30 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700 font-medium">{geoError}</p>
        </div>
      )}

      {/* OFFLINE: bottom CTA */}
      {homeState === 'OFFLINE' && (
        <div className="absolute bottom-20 inset-x-0 px-6 z-20 flex flex-col items-center gap-3">
          {toggleError && (
            <p className="text-sm text-red-600 text-center">{toggleError}</p>
          )}
          <p className="text-sm font-medium text-gray-500">You're offline</p>
          <button
            onClick={handleGoOnline}
            disabled={toggling}
            className="w-full h-14 bg-black text-white rounded-full font-bold text-base disabled:opacity-40 active:scale-95 transition-all duration-150"
          >
            {toggling ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Going online…
              </span>
            ) : 'Go online'}
          </button>
        </div>
      )}

      {/* AVAILABLE: status pill + go offline */}
      {homeState === 'AVAILABLE' && (
        <div className="absolute bottom-20 inset-x-0 px-6 z-20 flex flex-col items-center gap-3">
          {toggleError && (
            <p className="text-sm text-red-600 text-center">{toggleError}</p>
          )}
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-green-700">You're online</span>
          </div>
          <button
            onClick={handleGoOffline}
            disabled={toggling}
            className="w-full h-12 bg-white/90 backdrop-blur border border-gray-200 text-gray-800 rounded-full font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all duration-150 shadow-sm"
          >
            {toggling ? 'Going offline…' : 'Go offline'}
          </button>
        </div>
      )}

      {/* BUSY: active trip card */}
      {homeState === 'BUSY' && (
        <div className="absolute bottom-20 inset-x-4 z-20">
          <div className="bg-white rounded-2xl shadow-md px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="h-2 w-2 bg-blue-500 rounded-full" />
                <p className="text-sm font-bold text-gray-900">Active trip</p>
              </div>
              <p className="text-xs text-gray-500">
                {activeTrip ? `Rider: ${activeTrip.rider_email}` : 'Loading trip details…'}
              </p>
            </div>
            <button
              onClick={() => {
                if (activeTrip) navigate(`/trip/active/${activeTrip.id}`);
              }}
              disabled={!activeTrip}
              className="h-10 px-5 bg-black text-white rounded-full text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
            >
              View →
            </button>
          </div>
        </div>
      )}

      {/* INCOMING trip modal */}
      {homeState === 'INCOMING' && incomingTrip && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={handleDismissIncoming} />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl px-6 pt-4 pb-10 animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">New ride request!</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
                {dismissCountdown}s
              </span>
            </div>

            {/* Route card */}
            <div className="bg-gray-50 rounded-2xl px-4 py-4 mb-4">
              <div className="flex items-start gap-3">
                {/* Line */}
                <div className="flex flex-col items-center pt-1 gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                  <div className="w-0.5 flex-1 min-h-[2rem] bg-gray-300" />
                  <div className="w-3 h-3 bg-black rounded-full flex-shrink-0" />
                </div>
                {/* Details */}
                <div className="flex-1 flex flex-col gap-3">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Pickup</p>
                    <p className="text-sm font-medium text-gray-900">
                      {incomingTrip.pickup_lat.toFixed(4)},&nbsp;{incomingTrip.pickup_lng.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Destination</p>
                    <p className="text-sm font-medium text-gray-900">
                      {incomingTrip.drop_lat.toFixed(4)},&nbsp;{incomingTrip.drop_lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                <span className="text-3xl self-center">🚗</span>
              </div>
            </div>

            {/* Payment badge */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-medium px-3 py-1.5 bg-gray-100 rounded-full text-gray-700">
                {incomingTrip.payment_method === 'cash' ? '💵 Cash' : incomingTrip.payment_method === 'wallet' ? '👛 Wallet' : '💳 Card'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDismissIncoming}
                className="flex-1 h-14 bg-gray-100 text-gray-700 rounded-full font-semibold text-sm active:scale-95 transition-transform"
              >
                Dismiss
              </button>
              <button
                onClick={() => navigate(`/trip/active/${incomingTrip.id}`)}
                className="flex-1 h-14 bg-black text-white rounded-full font-bold text-base active:scale-95 transition-transform"
              >
                Go to trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
