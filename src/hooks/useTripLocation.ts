'use client'

import { useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'
import { useAuthStore } from '@/store/authStore'

interface DriverLocation {
  lat: number
  lng: number
  ts: string
}

export function useTripLocation(tripId: string | null) {
  const { accessToken } = useAuthStore()
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null)

  const wsUrl =
    tripId && accessToken
      ? `${process.env.NEXT_PUBLIC_WS_URL}/ws/trips/${tripId}?token=${accessToken}`
      : null

  const onMessage = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data) as DriverLocation
      setDriverLocation(parsed)
    } catch {
      // ignore malformed messages
    }
  }, [])

  const { readyState } = useWebSocket(wsUrl, { onMessage, enabled: !!tripId })

  return { driverLocation, readyState }
}
