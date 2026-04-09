import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trips } from '@uber_fe/shared';
import type { FareEstimate } from '@uber_fe/shared';
import { Button, Map } from '@uber_fe/ui';
import type { LatLng } from '@uber_fe/ui';

type PickMode = 'pickup' | 'drop' | null;

export default function Home() {
  const navigate = useNavigate();
  const [pickMode, setPickMode] = useState<PickMode>('pickup');
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [drop, setDrop] = useState<LatLng | null>(null);
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  const center: LatLng = { lat: 12.9716, lng: 77.5946 };

  const handleMapClick = (latlng: LatLng) => {
    if (pickMode === 'pickup') { setPickup(latlng); setPickMode('drop'); setEstimate(null); }
    else if (pickMode === 'drop') { setDrop(latlng); setPickMode(null); }
  };

  const handleEstimate = async () => {
    if (!pickup || !drop) return;
    try {
      setError('');
      setLoading(true);
      const est = await trips.estimate({ pickupLat: pickup.lat, pickupLng: pickup.lng, dropLat: drop.lat, dropLng: drop.lng });
      setEstimate(est);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!pickup || !drop) return;
    try {
      setError('');
      setRequesting(true);
      const res = await trips.request({ pickupLat: pickup.lat, pickupLng: pickup.lng, dropLat: drop.lat, dropLng: drop.lng });
      navigate(`/trip/tracking/${res.trip_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to request trip');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-gray-500 mb-1">
          {pickMode === 'pickup' ? 'Tap map to set pickup' : pickMode === 'drop' ? 'Tap map to set drop' : 'Pickup and drop set'}
        </p>
        <div className="flex gap-2 mb-2">
          <button onClick={() => { setPickMode('pickup'); setPickup(null); setEstimate(null); }} className="text-xs text-blue-600 underline">Reset pickup</button>
          <button onClick={() => { setPickMode('drop'); setDrop(null); setEstimate(null); }} className="text-xs text-blue-600 underline">Reset drop</button>
        </div>
      </div>

      <div className="h-72 rounded-xl overflow-hidden border">
        <Map center={center} pickup={pickup} drop={drop} onPickClick={handleMapClick} />
      </div>

      {estimate && (
        <div className="bg-gray-50 rounded-xl p-4 border">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated fare</span>
            <span className="font-semibold">₹{estimate.estimated_fare.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Distance</span>
            <span>{estimate.estimated_distance.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Duration</span>
            <span>~{Math.round(estimate.estimated_duration_min)} min</span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={handleEstimate} loading={loading} disabled={!pickup || !drop} className="flex-1">
          Estimate
        </Button>
        <Button onClick={handleRequest} loading={requesting} disabled={!pickup || !drop} className="flex-1">
          Request Ride
        </Button>
      </div>
    </div>
  );
}
