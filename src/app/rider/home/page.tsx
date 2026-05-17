'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { RideMap, MapMarker } from '@/components/map/RideMap'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useAuthStore } from '@/store/authStore'
import { useTripStore } from '@/store/tripStore'
import { estimateTrip, requestTrip } from '@/lib/api'
import { VehicleType, PaymentMethod } from '@/types'
import axios from 'axios'

const VEHICLE_OPTIONS: { type: VehicleType; label: string; icon: string; base: number; perKm: number }[] = [
  { type: 'go', label: 'Go', icon: '🚙', base: 30, perKm: 8 },
  { type: 'x', label: 'X', icon: '🚗', base: 50, perKm: 12 },
  { type: 'xl', label: 'XL', icon: '🚐', base: 80, perKm: 16 },
]

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; icon: string }[] = [
  { method: 'upi', label: 'UPI', icon: '📱' },
  { method: 'card', label: 'Card', icon: '💳' },
  { method: 'cash', label: 'Cash', icon: '💵' },
]

interface DropResult {
  lat: number
  lng: number
  label: string
}

export default function RiderHomePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { setEstimate } = useTripStore()
  const { position, loading: geoLoading } = useGeolocation()

  const [dropQuery, setDropQuery] = useState('')
  const [dropResults, setDropResults] = useState<DropResult[]>([])
  const [drop, setDrop] = useState<DropResult | null>(null)
  const [vehicleType, setVehicleType] = useState<VehicleType>('x')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [estimating, setEstimating] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [estimate, setLocalEstimate] = useState<{ fare: number; distance: number; duration: number; surge: number } | null>(null)

  const markers: MapMarker[] = [
    ...(position ? [{ lat: position.lat, lng: position.lng, type: 'pickup' as const, popup: 'Your location' }] : []),
    ...(drop ? [{ lat: drop.lat, lng: drop.lng, type: 'drop' as const, popup: drop.label }] : []),
  ]

  // Geocode drop address using Nominatim
  useEffect(() => {
    if (dropQuery.length < 3) { setDropResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dropQuery)}&format=json&limit=5&countrycodes=in`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        setDropResults(data.map((r: { lat: string; lon: string; display_name: string }) => ({
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          label: r.display_name,
        })))
      } catch {
        setDropResults([])
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [dropQuery])

  const handleGetEstimate = async () => {
    if (!position || !drop) { toast.error('Set pickup and drop locations'); return }
    setEstimating(true)
    try {
      const res = await estimateTrip({
        pickup_lat: position.lat,
        pickup_lng: position.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        vehicle_type: vehicleType,
      })
      const d = res.data
      setLocalEstimate({ fare: d.estimated_fare, distance: d.distance_km, duration: d.duration_min, surge: d.surge_multiplier })
      setEstimate(d)
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Estimate failed' : 'Estimate failed'
      toast.error(msg)
    } finally {
      setEstimating(false)
    }
  }

  const handleRequestRide = async () => {
    if (!position || !drop) { toast.error('Set pickup and drop locations'); return }
    setRequesting(true)
    try {
      const res = await requestTrip({
        pickup_lat: position.lat,
        pickup_lng: position.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        vehicle_type: vehicleType,
        payment_method: paymentMethod,
      })
      router.push(`/rider/trip/${res.data.trip_id}`)
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Request failed' : 'Request failed'
      toast.error(msg)
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="relative flex h-screen flex-col bg-black">
      {/* Map — top 55% */}
      <div className="relative h-[55%]">
        {geoLoading ? (
          <div className="flex h-full items-center justify-center bg-zinc-900">
            <LoadingSpinner size={32} />
          </div>
        ) : (
          <RideMap
            center={position ? [position.lat, position.lng] : [12.9716, 77.5946]}
            markers={markers}
            className="h-full w-full"
          />
        )}
        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-4">
          <div className="rounded-full bg-black/70 px-3 py-1 text-sm text-white backdrop-blur">
            Hi, {user?.name?.split(' ')[0]} 👋
          </div>
          <button
            onClick={() => router.push('/rider/history')}
            className="rounded-full bg-black/70 px-3 py-1 text-sm text-white backdrop-blur"
          >
            History
          </button>
        </div>
      </div>

      {/* Bottom sheet — scrollable */}
      <div className="flex flex-1 flex-col overflow-y-auto rounded-t-2xl bg-zinc-950 px-4 pt-4 pb-6">
        {/* Pickup */}
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <span className="text-lg">📍</span>
          <span className="text-sm text-zinc-300">
            {geoLoading ? 'Getting your location...' : 'Current Location'}
          </span>
        </div>

        {/* Drop input with autocomplete */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-yellow-400">
            <span className="text-lg">🏁</span>
            <input
              type="text"
              placeholder="Where to?"
              value={drop ? drop.label.split(',')[0] : dropQuery}
              onChange={(e) => { setDrop(null); setDropQuery(e.target.value) }}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
            {drop && (
              <button onClick={() => { setDrop(null); setDropQuery(''); setLocalEstimate(null) }} className="text-zinc-500 hover:text-white">✕</button>
            )}
          </div>
          {dropResults.length > 0 && !drop && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
              {dropResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => { setDrop(r); setDropQuery(''); setDropResults([]) }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator className="mb-3 bg-zinc-800" />

        {/* Vehicle type */}
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">Vehicle</p>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {VEHICLE_OPTIONS.map((v) => (
            <button
              key={v.type}
              onClick={() => { setVehicleType(v.type); setLocalEstimate(null) }}
              className={`rounded-lg border p-2 text-center transition-colors ${
                vehicleType === v.type
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <div className="text-xl">{v.icon}</div>
              <div className={`text-sm font-semibold ${vehicleType === v.type ? 'text-yellow-400' : 'text-white'}`}>{v.label}</div>
              <div className="text-xs text-zinc-500">₹{v.base}+</div>
            </button>
          ))}
        </div>

        {/* Payment method */}
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-500">Payment</p>
        <div className="mb-4 flex gap-2">
          {PAYMENT_OPTIONS.map((p) => (
            <button
              key={p.method}
              onClick={() => setPaymentMethod(p.method)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-sm transition-colors ${
                paymentMethod === p.method
                  ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {/* Estimate result */}
        {estimate && (
          <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Estimated fare</p>
                <p className="text-2xl font-bold text-white">₹{estimate.fare.toFixed(0)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">{estimate.distance.toFixed(1)} km</p>
                <p className="text-xs text-zinc-500">{estimate.duration.toFixed(0)} min</p>
                {estimate.surge > 1 && (
                  <p className="text-xs text-orange-400">{estimate.surge}x surge</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!estimate ? (
          <Button
            onClick={handleGetEstimate}
            disabled={!drop || estimating}
            className="w-full bg-zinc-800 text-white hover:bg-zinc-700 font-semibold"
          >
            {estimating ? <LoadingSpinner size={18} /> : 'Get Estimate'}
          </Button>
        ) : (
          <Button
            onClick={handleRequestRide}
            disabled={requesting}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold text-base"
          >
            {requesting ? <LoadingSpinner size={18} /> : `Book Ride · ₹${estimate.fare.toFixed(0)}`}
          </Button>
        )}
      </div>
    </div>
  )
}
