import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { trips } from '@uber_fe/shared';
import type { Trip } from '@uber_fe/shared';
import { TripStatusBadge } from '@uber_fe/ui';

const PAGE_SIZE = 10;

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-3 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
          <div className="h-4 w-14 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TripHistory() {
  const navigate = useNavigate();
  const [data, setData] = useState<Trip[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadTrips = useCallback(async (offset = 0, append = false) => {
    try {
      const res = await trips.history(PAGE_SIZE, offset);
      setTotal(res.total);
      setData((prev: Trip[]) => append ? [...prev, ...res.trips] : res.trips);
    } catch {
      setError('Failed to load trips');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    loadTrips(data.length, true);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10">
        <h1 className="text-xl font-bold text-gray-900">Activity</h1>
      </div>

      <div className="px-4 py-4 pb-24 flex flex-col gap-3">
        {/* Loading skeletons */}
        {loading && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center py-12 gap-4">
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              onClick={() => { setError(''); setLoading(true); loadTrips(); }}
              className="h-10 px-6 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">🚗</span>
            <p className="text-lg font-bold text-gray-900">No trips yet</p>
            <p className="text-sm text-gray-400">Your completed trips will appear here</p>
          </div>
        )}

        {/* Trip cards */}
        {data.map((trip: Trip, i: number) => {
          const isActive = trip.status === 'DRIVER_ASSIGNED' || trip.status === 'STARTED';
          return (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              onClick={() => isActive ? navigate(`/trip/active/${trip.id}`) : undefined}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 ${isActive ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-400">{formatDate(trip.created_at)}</p>
                  <p className="text-sm text-gray-700 truncate">
                    Rider: <span className="font-medium">{trip.rider_email}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {trip.pickup_lat.toFixed(3)}, {trip.pickup_lng.toFixed(3)}
                    &nbsp;→&nbsp;
                    {trip.drop_lat.toFixed(3)}, {trip.drop_lng.toFixed(3)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <TripStatusBadge status={trip.status} />
                  {trip.fare != null ? (
                    <span className="text-sm font-bold text-gray-900">₹{trip.fare.toFixed(0)}</span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                  {isActive && (
                    <span className="text-xs text-blue-600 font-semibold">View →</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Load more */}
        {!loading && !error && data.length < total && (
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-xs text-gray-400">Showing {data.length} of {total} trips</p>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="h-10 px-6 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-semibold disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
