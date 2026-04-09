import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { trips } from '@uber_fe/shared';
import type { Trip } from '@uber_fe/shared';
import { TripStatusBadge, Button } from '@uber_fe/ui';

const LIMIT = 10;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 animate-pulse">
      <div className="flex justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-48 mb-1" />
      <div className="h-3 bg-gray-100 rounded w-40" />
    </div>
  );
}

export default function TripHistory() {
  const navigate = useNavigate();
  const [data, setData] = useState<Trip[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    trips
      .history(LIMIT, 0)
      .then((r) => { setData(r.trips); setTotal(r.total); })
      .catch(() => setError('Failed to load trips.'))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await trips.history(LIMIT, data.length);
      setData((prev) => [...prev, ...r.trips]);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10">
        <h1 className="text-xl font-bold text-gray-900">Activity</h1>
      </div>

      <div className="px-4 py-4 pb-6 flex flex-col gap-3">
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="text-6xl">🚗</span>
            <p className="text-xl font-bold text-gray-900">No trips yet</p>
            <p className="text-gray-500 text-sm text-center">Request your first ride to get started</p>
            <Button size="md" onClick={() => navigate('/')}>Book a ride</Button>
          </div>
        )}

        {data.map((trip, i) => (
          <motion.button
            key={trip.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            onClick={() => {
              const isActive = trip.status === 'REQUESTED' || trip.status === 'DRIVER_ASSIGNED' || trip.status === 'STARTED';
              navigate(isActive ? `/trip/tracking/${trip.id}` : `/trip/summary/${trip.id}`);
            }}
            className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 text-left shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs text-gray-400">{formatDate(trip.requested_at)}</p>
              <TripStatusBadge status={trip.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <span className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
              <span className="truncate">
                {trip.pickup_lat.toFixed(3)}, {trip.pickup_lng.toFixed(3)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="h-2 w-2 bg-black rounded-full flex-shrink-0" />
              <span className="truncate flex-1">
                {trip.drop_lat.toFixed(3)}, {trip.drop_lng.toFixed(3)}
              </span>
              <span className="font-semibold text-gray-900 flex-shrink-0">
                {trip.fare != null ? `₹${trip.fare.toFixed(0)}` : '—'}
              </span>
            </div>
          </motion.button>
        ))}

        {!loading && data.length > 0 && (
          <p className="text-xs text-gray-400 text-center">
            Showing {data.length} of {total} trips
          </p>
        )}

        {data.length < total && !loading && (
          <Button variant="secondary" size="md" fullWidth loading={loadingMore} onClick={loadMore}>
            Load more
          </Button>
        )}
      </div>
    </div>
  );
}
