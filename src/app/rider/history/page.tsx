'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TripStatusBadge } from '@/components/trip/TripStatusBadge'
import { getTripHistory } from '@/lib/api'
import { Trip } from '@/types'

const PAGE_SIZE = 10

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function RiderHistoryPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTripHistory(PAGE_SIZE, offset)
      .then((res) => {
        setTrips(res.data.trips)
        setTotal(res.data.total)
      })
      .finally(() => setLoading(false))
  }, [offset])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="min-h-screen bg-black px-4 pt-10 pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/rider/home')}
          className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-white"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-white">Trip History</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size={32} />
        </div>
      ) : trips.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">No trips yet.</div>
      ) : (
        <>
          <div className="space-y-3">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => router.push(`/rider/trip/${trip.id}`)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition-colors hover:border-zinc-700"
              >
                <div className="mb-2 flex items-center justify-between">
                  <TripStatusBadge status={trip.status} />
                  <span className="text-xs text-zinc-500">{formatDate(trip.created_at)}</span>
                </div>
                <div className="space-y-1 text-sm text-zinc-400">
                  <div className="flex items-start gap-2">
                    <span>📍</span>
                    <span className="line-clamp-1">
                      {trip.pickup_lat.toFixed(4)}, {trip.pickup_lng.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span>🏁</span>
                    <span className="line-clamp-1">
                      {trip.drop_lat.toFixed(4)}, {trip.drop_lng.toFixed(4)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs capitalize text-zinc-500">
                    {trip.vehicle_type} · {trip.payment_method.toUpperCase()}
                  </span>
                  {trip.fare != null && (
                    <span className="font-bold text-white">₹{trip.fare.toFixed(0)}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 disabled:opacity-30 hover:border-zinc-500"
              >
                ← Prev
              </button>
              <span className="text-xs text-zinc-500">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 disabled:opacity-30 hover:border-zinc-500"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
