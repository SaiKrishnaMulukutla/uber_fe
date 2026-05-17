'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { RideMap, MapMarker } from '@/components/map/RideMap'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TripStatusBadge } from '@/components/trip/TripStatusBadge'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useAuthStore } from '@/store/authStore'
import { getTrip, startTrip, endTrip, pushTripLocation } from '@/lib/api'
import { Trip } from '@/types'

const LOCATION_BROADCAST_INTERVAL_MS = 5_000
const POLL_INTERVAL_MS = 5_000

export default function DriverTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { driver } = useAuthStore()
  const { position } = useGeolocation()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [otp, setOtp] = useState('')
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const broadcastRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Polling ────────────────────────────────────────────────────────────────

  const fetchTrip = async () => {
    try {
      const res = await getTrip(id)
      setTrip(res.data)
      if (res.data.status === 'COMPLETED' || res.data.status === 'CANCELLED') {
        if (pollRef.current) clearInterval(pollRef.current)
        if (broadcastRef.current) clearInterval(broadcastRef.current)
      }
    } catch {
      // silent retry
    }
  }

  useEffect(() => {
    fetchTrip()
    pollRef.current = setInterval(fetchTrip, POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ── Live location broadcast (only while STARTED) ───────────────────────────

  useEffect(() => {
    if (trip?.status !== 'STARTED' || !position) return
    broadcastRef.current = setInterval(() => {
      pushTripLocation(id, position.lat, position.lng).catch(() => null)
    }, LOCATION_BROADCAST_INTERVAL_MS)
    // push immediately
    pushTripLocation(id, position.lat, position.lng).catch(() => null)
    return () => {
      if (broadcastRef.current) clearInterval(broadcastRef.current)
    }
  }, [trip?.status, position, id])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (otp.length !== 4) { toast.error('Enter the 4-digit OTP'); return }
    setStarting(true)
    try {
      const res = await startTrip(id, otp)
      setTrip(res.data)
      toast.success('Trip started!')
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Failed to start' : 'Failed to start'
      toast.error(msg)
    } finally {
      setStarting(false)
    }
  }

  const handleEnd = async () => {
    setEnding(true)
    try {
      const res = await endTrip(id)
      setTrip(res.data)
      if (broadcastRef.current) clearInterval(broadcastRef.current)
      toast.success('Trip completed!')
      router.push('/driver/home')
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Failed to end trip' : 'Failed to end trip'
      toast.error(msg)
    } finally {
      setEnding(false)
    }
  }

  // ── Map ────────────────────────────────────────────────────────────────────

  const markers: MapMarker[] = [
    ...(trip ? [{ lat: trip.pickup_lat, lng: trip.pickup_lng, type: 'pickup' as const, popup: 'Pickup' }] : []),
    ...(trip ? [{ lat: trip.drop_lat, lng: trip.drop_lng, type: 'drop' as const, popup: 'Drop' }] : []),
    ...(position ? [{ lat: position.lat, lng: position.lng, type: 'driver' as const, popup: 'You' }] : []),
  ]

  const mapCenter: [number, number] = position
    ? [position.lat, position.lng]
    : trip
      ? [trip.pickup_lat, trip.pickup_lng]
      : [12.9716, 77.5946]

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!trip) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  return (
    <div className="relative flex h-screen flex-col bg-black">
      {/* Map */}
      <div className="relative h-[50%]">
        <RideMap center={mapCenter} markers={markers} className="h-full w-full" />
        <div className="absolute left-0 right-0 top-4 flex justify-center">
          <div className="rounded-full bg-black/70 px-4 py-1 backdrop-blur">
            <TripStatusBadge status={trip.status} />
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="flex flex-1 flex-col overflow-y-auto rounded-t-2xl bg-zinc-950 px-4 pt-4 pb-6">

        {/* Rider info */}
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-xl">👤</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{trip.rider_email}</p>
            <p className="text-xs text-zinc-400">{trip.rider_phone}</p>
          </div>
          <a href={`tel:${trip.rider_phone}`} className="rounded-full bg-zinc-800 p-2 text-white hover:bg-zinc-700">
            📞
          </a>
        </div>

        {/* Route */}
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400 space-y-1">
          <div className="flex items-start gap-2">
            <span className="text-base">📍</span>
            <span>{trip.pickup_lat.toFixed(4)}, {trip.pickup_lng.toFixed(4)}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">🏁</span>
            <span>{trip.drop_lat.toFixed(4)}, {trip.drop_lng.toFixed(4)}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className="capitalize">{trip.vehicle_type} · {trip.payment_method.toUpperCase()}</span>
            {trip.fare && <span className="font-bold text-white">₹{trip.fare.toFixed(0)}</span>}
          </div>
        </div>

        {/* DRIVER_ASSIGNED — OTP entry */}
        {trip.status === 'DRIVER_ASSIGNED' && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
              Enter rider OTP to start
            </p>
            <div className="flex gap-3">
              <input
                type="number"
                inputMode="numeric"
                placeholder="OTP"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-center text-xl font-bold tracking-widest text-yellow-400 outline-none focus:border-yellow-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                onClick={handleStart}
                disabled={starting || otp.length !== 4}
                className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
              >
                {starting ? <LoadingSpinner size={16} /> : 'Start Trip'}
              </Button>
            </div>
          </div>
        )}

        {/* STARTED — End trip */}
        {trip.status === 'STARTED' && (
          <div className="mb-4">
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <p className="text-sm text-green-400">Trip in progress · broadcasting location</p>
            </div>
            <Button
              onClick={handleEnd}
              disabled={ending}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold text-base"
            >
              {ending ? <LoadingSpinner size={18} /> : 'End Trip'}
            </Button>
          </div>
        )}

        {/* COMPLETED */}
        {trip.status === 'COMPLETED' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-4xl">✅</div>
            <p className="text-sm text-zinc-400">Trip completed.</p>
            <Button
              onClick={() => router.push('/driver/home')}
              className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
            >
              Back to Home
            </Button>
          </div>
        )}

        {/* CANCELLED */}
        {trip.status === 'CANCELLED' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-4xl">❌</div>
            <p className="text-sm text-zinc-400">Trip was cancelled.</p>
            <Button
              onClick={() => router.push('/driver/home')}
              className="bg-zinc-800 text-white hover:bg-zinc-700 font-semibold"
            >
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
