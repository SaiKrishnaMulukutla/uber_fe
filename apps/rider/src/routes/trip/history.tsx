import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trips } from '@uber_fe/shared';
import type { Trip } from '@uber_fe/shared';
import { TripStatusBadge, Spinner } from '@uber_fe/ui';

export default function TripHistory() {
  const [data, setData] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trips.history().then((r) => setData(r.trips)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-lg">Trip history</h2>
      {data.length === 0 && <p className="text-sm text-gray-500">No trips yet.</p>}
      {data.map((trip) => (
        <Link key={trip.id} to={`/trip/summary/${trip.id}`} className="bg-white border rounded-xl p-4 flex justify-between items-center hover:bg-gray-50">
          <div>
            <p className="text-sm font-medium">{new Date(trip.created_at).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500 capitalize">{trip.payment_method}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <TripStatusBadge status={trip.status} />
            {trip.fare != null && <span className="text-sm font-semibold">₹{trip.fare.toFixed(2)}</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}
