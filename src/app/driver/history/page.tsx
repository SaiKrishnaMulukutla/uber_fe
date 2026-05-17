'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TripStatusBadge } from '@/components/trip/TripStatusBadge'
import { getEarnings, getTripHistory } from '@/lib/api'
import { EarningsResponse, Trip } from '@/types'

type Period = 'week' | 'month' | 'all'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

const PAGE_SIZE = 10

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatShortDate(yyyymmdd: string) {
  const [, m, d] = yyyymmdd.split('-')
  return `${d}/${m}`
}

export default function DriverHistoryPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('week')
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null)
  const [earningsLoading, setEarningsLoading] = useState(true)
  const [trips, setTrips] = useState<Trip[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [tripsLoading, setTripsLoading] = useState(true)

  // Fetch earnings whenever period changes
  useEffect(() => {
    setEarningsLoading(true)
    getEarnings(period)
      .then((res) => setEarnings(res.data))
      .finally(() => setEarningsLoading(false))
  }, [period])

  // Fetch trip history
  useEffect(() => {
    setTripsLoading(true)
    getTripHistory(PAGE_SIZE, offset)
      .then((res) => {
        setTrips(res.data.trips)
        setTotal(res.data.total)
      })
      .finally(() => setTripsLoading(false))
  }, [offset])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  // Simple bar chart: scale daily amounts relative to max
  const maxDaily = earnings?.daily?.length
    ? Math.max(...earnings.daily.map((d) => d.amount), 1)
    : 1

  return (
    <div className="min-h-screen bg-black px-4 pt-10 pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/driver/home')}
          className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-white"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-white">Earnings & History</h1>
      </div>

      {/* Period selector */}
      <div className="mb-4 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
              period === p.value
                ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Earnings summary */}
      {earningsLoading ? (
        <div className="mb-4 flex justify-center py-8">
          <LoadingSpinner size={28} />
        </div>
      ) : earnings && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-yellow-400">₹{earnings.total_earnings.toFixed(0)}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Trips Completed</p>
              <p className="text-2xl font-bold text-white">{earnings.trip_count}</p>
            </div>
          </div>

          {/* Daily bar chart */}
          {earnings.daily?.length > 0 && (
            <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-500">Daily</p>
              <div className="flex items-end gap-1 h-20">
                {earnings.daily.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-yellow-400/70"
                      style={{ height: `${Math.max(4, (d.amount / maxDaily) * 72)}px` }}
                      title={`₹${d.amount.toFixed(0)} · ${d.trips} trips`}
                    />
                    <span className="text-[9px] text-zinc-600">{formatShortDate(d.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Trip list */}
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-500">All Trips</p>

      {tripsLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size={28} />
        </div>
      ) : trips.length === 0 ? (
        <div className="py-8 text-center text-zinc-500">No trips yet.</div>
      ) : (
        <>
          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
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
              </div>
            ))}
          </div>

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
