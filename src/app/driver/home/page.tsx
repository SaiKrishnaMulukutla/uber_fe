'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { RideMap, MapMarker } from '@/components/map/RideMap'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useDriverOffers } from '@/hooks/useDriverOffers'
import { useAuthStore } from '@/store/authStore'
import { useDriverStore } from '@/store/driverStore'
import { updateDriverStatus, updateDriverLocation, respondToOffer } from '@/lib/api'

const LOCATION_SYNC_INTERVAL_MS = 10_000

export default function DriverHomePage() {
  const router = useRouter()
  const { driver, clearAuth } = useAuthStore()
  const { status, setStatus, currentOffer, clearOffer } = useDriverStore()
  const { position } = useGeolocation()
  const [toggling, setToggling] = useState(false)
  const [responding, setResponding] = useState(false)

  useDriverOffers(driver?.id ?? null)

  // Keep location synced while online
  useEffect(() => {
    if (status !== 'available' || !position || !driver) return
    const id = setInterval(() => {
      updateDriverLocation(driver.id, position.lat, position.lng).catch(() => null)
    }, LOCATION_SYNC_INTERVAL_MS)
    // push immediately on coming online
    updateDriverLocation(driver.id, position.lat, position.lng).catch(() => null)
    return () => clearInterval(id)
  }, [status, position, driver])

  const handleToggleOnline = async () => {
    if (!driver) return
    setToggling(true)
    const next = status === 'available' ? 'offline' : 'available'
    try {
      await updateDriverStatus(driver.id, next)
      setStatus(next)
      toast.success(next === 'available' ? 'You are now online' : 'You are now offline')
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Failed' : 'Failed'
      toast.error(msg)
    } finally {
      setToggling(false)
    }
  }

  const handleRespond = useCallback(async (accept: boolean) => {
    if (!currentOffer) return
    setResponding(true)
    try {
      await respondToOffer(currentOffer.id, accept)
      if (accept) {
        clearOffer()
        router.push(`/driver/trip/${currentOffer.id}`)
      } else {
        clearOffer()
        toast('Offer declined')
      }
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Failed to respond' : 'Failed to respond'
      toast.error(msg)
    } finally {
      setResponding(false)
    }
  }, [currentOffer, clearOffer, router])

  const markers: MapMarker[] = position
    ? [{ lat: position.lat, lng: position.lng, type: 'driver' as const, popup: 'You' }]
    : []

  const isOnline = status === 'available'

  return (
    <div className="relative flex h-screen flex-col bg-black">
      {/* Map */}
      <div className="relative h-[55%]">
        <RideMap
          center={position ? [position.lat, position.lng] : [12.9716, 77.5946]}
          markers={markers}
          className="h-full w-full"
        />

        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-4">
          <div className="rounded-full bg-black/70 px-3 py-1 text-sm text-white backdrop-blur">
            {driver?.name?.split(' ')?.[0]} · {driver?.vehicle_type?.toUpperCase()}
          </div>
          <button
            onClick={() => router.push('/driver/history')}
            className="rounded-full bg-black/70 px-3 py-1 text-sm text-white backdrop-blur"
          >
            History
          </button>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="flex flex-1 flex-col rounded-t-2xl bg-zinc-950 px-4 pt-5 pb-8">
        {/* Status row */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-sm font-medium text-zinc-300">
              {isOnline ? 'Online — accepting rides' : 'Offline'}
            </span>
          </div>
          <Button
            onClick={handleToggleOnline}
            disabled={toggling}
            className={isOnline
              ? 'bg-zinc-800 text-white hover:bg-zinc-700 font-semibold'
              : 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold'}
          >
            {toggling ? <LoadingSpinner size={16} /> : isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">Rating</p>
            <p className="text-lg font-bold text-yellow-400">⭐ {driver?.rating?.toFixed(1) ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">Vehicle</p>
            <p className="text-lg font-bold text-white">{driver?.vehicle_type?.toUpperCase() ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-1">Plate</p>
            <p className="text-sm font-bold text-white">{driver?.license_plate ?? '—'}</p>
          </div>
        </div>

        {isOnline ? (
          <p className="text-center text-xs text-zinc-500">Waiting for ride requests...</p>
        ) : (
          <p className="text-center text-xs text-zinc-500">Go online to start accepting rides.</p>
        )}

        {/* Sign out */}
        <button
          onClick={() => { clearAuth(); router.push('/driver/login') }}
          className="mt-auto text-xs text-zinc-600 hover:text-zinc-400 text-center"
        >
          Sign out
        </button>
      </div>

      {/* Offer modal */}
      {currentOffer && (
        <div className="absolute inset-0 flex items-end justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="w-full max-w-md rounded-t-3xl bg-zinc-900 border border-zinc-800 px-5 pt-5 pb-8">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-base font-bold text-white">New Ride Request</p>
              <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-semibold text-yellow-400">
                {currentOffer.vehicle_type?.toUpperCase()}
              </span>
            </div>

            <div className="my-3 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
              <div className="flex items-start gap-2">
                <span className="text-base">📍</span>
                <span className="line-clamp-1">
                  {currentOffer.pickup_lat.toFixed(4)}, {currentOffer.pickup_lng.toFixed(4)}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">🏁</span>
                <span className="line-clamp-1">
                  {currentOffer.drop_lat.toFixed(4)}, {currentOffer.drop_lng.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                <span className="capitalize text-zinc-400">{currentOffer.payment_method}</span>
                {currentOffer.fare && (
                  <span className="font-bold text-white text-base">₹{currentOffer.fare.toFixed(0)}</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleRespond(false)}
                disabled={responding}
                className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                Decline
              </Button>
              <Button
                onClick={() => handleRespond(true)}
                disabled={responding}
                className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
              >
                {responding ? <LoadingSpinner size={16} /> : 'Accept'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
