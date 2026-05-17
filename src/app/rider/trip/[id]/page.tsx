'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { RideMap, MapMarker } from '@/components/map/RideMap'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TripStatusBadge } from '@/components/trip/TripStatusBadge'
import { OTPDisplay } from '@/components/trip/OTPDisplay'
import { useTripLocation } from '@/hooks/useTripLocation'
import { getTrip, cancelTrip, getDriver } from '@/lib/api'
import { Trip, Driver, TripStatus } from '@/types'

const TERMINAL_STATUSES: TripStatus[] = ['COMPLETED', 'CANCELLED']
const POLL_INTERVAL_MS = 5000

export default function RiderTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { driverLocation } = useTripLocation(
    trip && !TERMINAL_STATUSES.includes(trip.status) ? id : null
  )

  const markers: MapMarker[] = [
    ...(trip ? [{ lat: trip.pickup_lat, lng: trip.pickup_lng, type: 'pickup' as const, popup: 'Pickup' }] : []),
    ...(trip ? [{ lat: trip.drop_lat, lng: trip.drop_lng, type: 'drop' as const, popup: 'Drop' }] : []),
    ...(driverLocation ? [{ lat: driverLocation.lat, lng: driverLocation.lng, type: 'driver' as const, popup: 'Driver' }] : []),
  ]

  const mapCenter: [number, number] = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : trip
      ? [trip.pickup_lat, trip.pickup_lng]
      : [12.9716, 77.5946]

  const fetchTrip = async () => {
    try {
      const res = await getTrip(id)
      const latest = res.data
      setTrip(latest)

      if (latest.driver_id && !driver) {
        getDriver(latest.driver_id)
          .then((r) => setDriver(r.data))
          .catch(() => null)
      }

      if (latest.status === 'COMPLETED') {
        if (pollRef.current) clearInterval(pollRef.current)
        router.push(`/rider/payment/${id}`)
      } else if (latest.status === 'CANCELLED') {
        if (pollRef.current) clearInterval(pollRef.current)
      }
    } catch {
      // silent — poll will retry
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

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelTrip(id, 'Cancelled by rider')
      toast.success('Ride cancelled')
      router.push('/rider/home')
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Cancel failed' : 'Cancel failed'
      toast.error(msg)
    } finally {
      setCancelling(false)
    }
  }

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

        {/* Status badge overlay */}
        <div className="absolute left-0 right-0 top-4 flex justify-center">
          <div className="rounded-full bg-black/70 px-4 py-1 backdrop-blur">
            <TripStatusBadge status={trip.status} />
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="flex flex-1 flex-col overflow-y-auto rounded-t-2xl bg-zinc-950 px-4 pt-4 pb-6">
        {/* REQUESTED */}
        {trip.status === 'REQUESTED' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <LoadingSpinner size={40} />
            <p className="text-sm text-zinc-400">Looking for a nearby driver...</p>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelling}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              {cancelling ? <LoadingSpinner size={16} /> : 'Cancel Ride'}
            </Button>
          </div>
        )}

        {/* DRIVER_ASSIGNED */}
        {trip.status === 'DRIVER_ASSIGNED' && (
          <div className="flex flex-col gap-4">
            {driver && (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-2xl">
                  🧑‍✈️
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{driver.name}</p>
                  <p className="text-xs text-zinc-400">{driver.vehicle_type.toUpperCase()} · {driver.license_plate}</p>
                  <p className="text-xs text-yellow-400">⭐ {driver.rating.toFixed(1)}</p>
                </div>
                <a href={`tel:${driver.phone}`} className="rounded-full bg-zinc-800 p-2 text-white hover:bg-zinc-700">
                  📞
                </a>
              </div>
            )}

            {trip.ride_otp && <OTPDisplay otp={trip.ride_otp} />}

            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelling}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              {cancelling ? <LoadingSpinner size={16} /> : 'Cancel Ride'}
            </Button>
          </div>
        )}

        {/* STARTED */}
        {trip.status === 'STARTED' && (
          <div className="flex flex-col gap-4">
            {driver && (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-2xl">
                  🧑‍✈️
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{driver.name}</p>
                  <p className="text-xs text-zinc-400">{driver.vehicle_type.toUpperCase()} · {driver.license_plate}</p>
                </div>
                <a href={`tel:${driver.phone}`} className="rounded-full bg-zinc-800 p-2 text-white hover:bg-zinc-700">
                  📞
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <p className="text-sm text-green-400">Trip in progress</p>
            </div>
          </div>
        )}

        {/* CANCELLED */}
        {trip.status === 'CANCELLED' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-4xl">❌</div>
            <p className="text-sm text-zinc-400">This ride was cancelled.</p>
            <Button
              onClick={() => router.push('/rider/home')}
              className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
            >
              Book New Ride
            </Button>
          </div>
        )}

        {/* Route info — always shown */}
        <div className="mt-auto pt-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400 space-y-1">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-base">📍</span>
              <span className="line-clamp-1">{trip.pickup_lat.toFixed(4)}, {trip.pickup_lng.toFixed(4)}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-base">🏁</span>
              <span className="line-clamp-1">{trip.drop_lat.toFixed(4)}, {trip.drop_lng.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="capitalize">{trip.vehicle_type} · {trip.payment_method.toUpperCase()}</span>
              {trip.fare && <span className="font-semibold text-white">₹{trip.fare.toFixed(0)}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
