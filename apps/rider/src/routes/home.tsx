import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trips, useSessionStore } from '@uber_fe/shared';
import type { FareEstimate } from '@uber_fe/shared';
import { Map, BottomSheet, RideOptionCard, Button, SearchingAnimation } from '@uber_fe/ui';
import type { LatLng } from '@uber_fe/ui';
import { MenuIcon } from '@uber_fe/ui';

type HomeState =
  | 'IDLE'
  | 'SELECTING_PICKUP'
  | 'SELECTING_DROP'
  | 'ESTIMATING'
  | 'CONFIRMING'
  | 'REQUESTING';

type RideType = 'ubergo' | 'uberx' | 'uberxl';
type PaymentMethod = 'card' | 'cash';

const RIDE_CONFIG: Record<RideType, { label: string; description: string; icon: string; capacity: number; multiplier: number; eta: number }> = {
  ubergo: { label: 'UberGo',  description: 'Affordable, everyday',    icon: '🚗', capacity: 4, multiplier: 1.0, eta: 3 },
  uberx:  { label: 'UberX',   description: 'A bit more room',         icon: '🚙', capacity: 4, multiplier: 1.2, eta: 5 },
  uberxl: { label: 'UberXL',  description: 'For groups up to 6',      icon: '🚐', capacity: 6, multiplier: 1.5, eta: 8 },
};

const BANGALORE_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

function getInitials(email: string): string {
  return email ? email[0].toUpperCase() : 'U';
}

export default function Home() {
  const navigate = useNavigate();
  const email = useSessionStore((s) => s.email) ?? '';

  const [state, setState] = useState<HomeState>('IDLE');
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [drop, setDrop] = useState<LatLng | null>(null);
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [selectedRide, setSelectedRide] = useState<RideType>('ubergo');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [error, setError] = useState('');

  const handleMapClick = useCallback(
    async (latlng: LatLng) => {
      if (state === 'SELECTING_PICKUP') {
        setPickup(latlng);
        setState('SELECTING_DROP');
        setEstimate(null);
      } else if (state === 'SELECTING_DROP') {
        setDrop(latlng);
        setState('ESTIMATING');
        setError('');
        try {
          const est = await trips.estimate({
            pickupLat: pickup!.lat,
            pickupLng: pickup!.lng,
            dropLat: latlng.lat,
            dropLng: latlng.lng,
          });
          setEstimate(est);
          setState('CONFIRMING');
        } catch {
          setError('Could not estimate fare. Tap "Try again".');
          setState('CONFIRMING');
        }
      }
    },
    [state, pickup]
  );

  const handleRetryEstimate = async () => {
    if (!pickup || !drop) return;
    setError('');
    setState('ESTIMATING');
    try {
      const est = await trips.estimate({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropLat: drop.lat,
        dropLng: drop.lng,
      });
      setEstimate(est);
      setState('CONFIRMING');
    } catch {
      setError('Could not estimate fare. Tap "Try again".');
      setState('CONFIRMING');
    }
  };

  const handleRequest = async () => {
    if (!pickup || !drop) return;
    setError('');
    setState('REQUESTING');
    try {
      const res = await trips.request({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropLat: drop.lat,
        dropLng: drop.lng,
        payment_method: paymentMethod,
      });
      navigate(`/trip/tracking/${res.trip_id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed';
      if (msg.includes('503') || msg.toLowerCase().includes('no driver')) {
        setError('No drivers available right now. Try again in a moment.');
      } else {
        setError('Could not book ride. Please try again.');
      }
      setState('CONFIRMING');
    }
  };

  const reset = () => {
    setPickup(null);
    setDrop(null);
    setEstimate(null);
    setError('');
    setState('IDLE');
  };

  const mapClickEnabled = state === 'SELECTING_PICKUP' || state === 'SELECTING_DROP';
  const mapCenter = pickup ?? BANGALORE_CENTER;

  const fare = estimate
    ? estimate.estimated_fare * RIDE_CONFIG[selectedRide].multiplier
    : 0;

  return (
    <div className="absolute inset-0">
      {/* Full-screen map */}
      <Map
        center={mapCenter}
        pickup={pickup}
        drop={drop}
        onPickClick={mapClickEnabled ? handleMapClick : undefined}
        className="h-full w-full"
      />

      {/* Floating top bar */}
      <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between">
        <button className="h-10 w-10 bg-white rounded-full shadow-md flex items-center justify-center">
          <MenuIcon className="h-5 w-5 text-gray-700" />
        </button>
        <span className="bg-white px-4 py-2 rounded-full shadow-md font-black tracking-widest text-sm">
          uber
        </span>
        <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-sm">{getInitials(email)}</span>
        </div>
      </div>

      {/* Map instruction overlays */}
      {state === 'SELECTING_PICKUP' && (
        <div className="absolute top-1/3 inset-x-0 flex justify-center z-20 pointer-events-none">
          <span className="bg-black text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
            Tap the map to set pickup
          </span>
        </div>
      )}
      {state === 'SELECTING_DROP' && (
        <div className="absolute top-1/3 inset-x-0 flex justify-center z-20 pointer-events-none">
          <span className="bg-black text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
            Now tap your destination
          </span>
        </div>
      )}

      {/* Searching animation */}
      {state === 'REQUESTING' && (
        <div className="absolute inset-0 flex items-center justify-center z-15 pointer-events-none">
          <SearchingAnimation />
        </div>
      )}

      {/* Bottom sheets */}

      {/* IDLE */}
      {state === 'IDLE' && (
        <BottomSheet className="pb-4">
          <div className="px-4 pb-2">
            <button
              onClick={() => setState('SELECTING_PICKUP')}
              className="w-full h-14 bg-black text-white rounded-full flex items-center gap-3 px-5 text-left font-medium text-base active:scale-[0.98] transition-transform"
            >
              <span className="text-gray-300">🔍</span>
              <span>Where to?</span>
            </button>
          </div>
        </BottomSheet>
      )}

      {/* SELECTING_PICKUP */}
      {state === 'SELECTING_PICKUP' && (
        <BottomSheet className="pb-4">
          <div className="px-4 pb-2 flex flex-col gap-3">
            <p className="text-sm text-gray-500 text-center">Tap the map to pin your pickup location</p>
            <Button variant="ghost" fullWidth onClick={reset}>
              Cancel
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* SELECTING_DROP */}
      {state === 'SELECTING_DROP' && (
        <BottomSheet className="pb-4">
          <div className="px-4 pb-2 flex flex-col gap-3">
            <div className="flex items-center gap-3 py-2 px-3 bg-green-50 rounded-xl">
              <span className="h-2.5 w-2.5 bg-green-500 rounded-full flex-shrink-0" />
              <span className="text-sm text-gray-700 flex-1">
                Pickup set · {pickup?.lat.toFixed(4)}, {pickup?.lng.toFixed(4)}
              </span>
              <button
                onClick={() => { setPickup(null); setState('SELECTING_PICKUP'); }}
                className="text-xs text-blue-600 font-medium flex-shrink-0"
              >
                Change
              </button>
            </div>
            <p className="text-sm text-gray-500 text-center">Tap the map to set your destination</p>
            <Button variant="ghost" fullWidth onClick={reset}>
              Cancel
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* ESTIMATING */}
      {state === 'ESTIMATING' && (
        <BottomSheet className="pb-4">
          <div className="px-4 pb-2 flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-black rounded-full dot-1" />
              <div className="w-2 h-2 bg-black rounded-full dot-2" />
              <div className="w-2 h-2 bg-black rounded-full dot-3" />
            </div>
            <p className="text-sm text-gray-500">Estimating fare…</p>
          </div>
        </BottomSheet>
      )}

      {/* CONFIRMING */}
      {state === 'CONFIRMING' && (
        <BottomSheet className="pb-4 max-h-[75vh] overflow-y-auto">
          <div className="px-4 pb-4 flex flex-col gap-3">
            {/* Route summary */}
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
              <span className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="truncate">
                {pickup?.lat.toFixed(3)}, {pickup?.lng.toFixed(3)}
              </span>
              <span>→</span>
              <span className="truncate">
                {drop?.lat.toFixed(3)}, {drop?.lng.toFixed(3)}
              </span>
              <button onClick={reset} className="ml-auto text-blue-600 font-medium whitespace-nowrap">
                Edit
              </button>
            </div>

            {error && (
              <div className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
                <p className="text-xs text-red-600">{error}</p>
                <button onClick={handleRetryEstimate} className="text-xs text-red-700 font-semibold ml-2">
                  Retry
                </button>
              </div>
            )}

            {/* Ride option cards */}
            <div className="flex flex-col gap-2">
              {(Object.entries(RIDE_CONFIG) as [RideType, typeof RIDE_CONFIG[RideType]][]).map(
                ([id, config], index) => (
                  <div
                    key={id}
                    style={{ animationDelay: `${index * 80}ms` }}
                    className="animate-slide-up"
                  >
                    <RideOptionCard
                      id={id}
                      label={config.label}
                      description={config.description}
                      icon={config.icon}
                      capacity={config.capacity}
                      fare={estimate ? estimate.estimated_fare * config.multiplier : 0}
                      eta={config.eta}
                      selected={selectedRide === id}
                      onClick={() => setSelectedRide(id)}
                    />
                  </div>
                )
              )}
            </div>

            {/* Payment method */}
            <div className="flex gap-2">
              {(['card', 'cash'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 h-10 rounded-full text-sm font-medium transition-all ${
                    paymentMethod === m
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {m === 'card' ? '💳 Card' : '💵 Cash'}
                </button>
              ))}
            </div>

            {/* Fare summary */}
            {estimate && (
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-gray-500">
                  {estimate.estimated_distance.toFixed(1)} km · ~{Math.round(estimate.estimated_duration_min)} min
                </span>
                <span className="font-bold text-gray-900">
                  ₹{Math.round(fare)}
                </span>
              </div>
            )}

            {/* CTA */}
            <Button
              size="lg"
              fullWidth
              onClick={handleRequest}
              disabled={!estimate}
            >
              Request {RIDE_CONFIG[selectedRide].label}
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* REQUESTING */}
      {state === 'REQUESTING' && (
        <BottomSheet className="pb-4">
          <div className="px-4 pb-2 flex flex-col items-center gap-3 py-4">
            <p className="font-semibold text-gray-900">Looking for a driver…</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-gray-400 rounded-full dot-1" />
              <div className="w-2 h-2 bg-gray-400 rounded-full dot-2" />
              <div className="w-2 h-2 bg-gray-400 rounded-full dot-3" />
            </div>
            <Button variant="ghost" onClick={reset} className="text-sm text-red-500 hover:bg-red-50">
              Cancel
            </Button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
