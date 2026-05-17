'use client'

import { useState, useEffect } from 'react'

interface GeoPosition {
  lat: number
  lng: number
}

interface UseGeolocationResult {
  position: GeoPosition | null
  error: string | null
  loading: boolean
}

const BANGALORE_DEFAULT: GeoPosition = { lat: 12.9716, lng: 77.5946 }

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setPosition(BANGALORE_DEFAULT)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => {
        // Fall back to Bangalore on denial/timeout
        setPosition(BANGALORE_DEFAULT)
        setLoading(false)
      },
      { timeout: 8000, maximumAge: 30000 }
    )
  }, [])

  return { position, error, loading }
}
