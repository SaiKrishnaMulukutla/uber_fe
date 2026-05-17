'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DRIVER_ICON = L.divIcon({
  html: `<div style="font-size:28px;line-height:1">🚗</div>`,
  className: '',
  iconAnchor: [14, 14],
})

const PICKUP_ICON = L.divIcon({
  html: `<div style="font-size:26px;line-height:1">📍</div>`,
  className: '',
  iconAnchor: [13, 26],
})

const DROP_ICON = L.divIcon({
  html: `<div style="font-size:26px;line-height:1">🏁</div>`,
  className: '',
  iconAnchor: [13, 26],
})

export interface MapMarker {
  lat: number
  lng: number
  type: 'pickup' | 'drop' | 'driver'
  popup?: string
}

interface RideMapClientProps {
  center: [number, number]
  zoom?: number
  markers?: MapMarker[]
  className?: string
}

export default function RideMapClient({
  center,
  zoom = 14,
  markers = [],
  className = 'h-full w-full',
}: RideMapClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRefs = useRef<Record<string, L.Marker>>({})

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    mapRef.current = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update center when prop changes
  useEffect(() => {
    mapRef.current?.setView(center, zoom)
  }, [center, zoom])

  // Update markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove stale markers
    Object.keys(markerRefs.current).forEach((key) => {
      if (!markers.find((m) => m.type === key)) {
        markerRefs.current[key].remove()
        delete markerRefs.current[key]
      }
    })

    // Add / update markers
    markers.forEach((m) => {
      const icon =
        m.type === 'driver'
          ? DRIVER_ICON
          : m.type === 'pickup'
          ? PICKUP_ICON
          : DROP_ICON

      if (markerRefs.current[m.type]) {
        markerRefs.current[m.type].setLatLng([m.lat, m.lng])
      } else {
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(map)
        if (m.popup) marker.bindPopup(m.popup)
        markerRefs.current[m.type] = marker
      }
    })
  }, [markers])

  return <div ref={containerRef} className={className} />
}
