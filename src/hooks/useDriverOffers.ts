'use client'

import { useCallback } from 'react'
import { useWebSocket } from './useWebSocket'
import { useAuthStore } from '@/store/authStore'
import { useDriverStore } from '@/store/driverStore'
import { Trip } from '@/types'

interface OfferMessage {
  type: 'offer'
  trip: Trip
}

export function useDriverOffers(driverId: string | null) {
  const { accessToken } = useAuthStore()
  const { setOffer } = useDriverStore()

  const wsUrl =
    driverId && accessToken
      ? `${process.env.NEXT_PUBLIC_WS_URL}/ws/drivers/${driverId}?token=${accessToken}`
      : null

  const onMessage = useCallback(
    (data: string) => {
      try {
        const parsed = JSON.parse(data) as OfferMessage
        if (parsed.type === 'offer' && parsed.trip) {
          setOffer(parsed.trip)
        }
      } catch {
        // ignore malformed messages
      }
    },
    [setOffer]
  )

  const { readyState } = useWebSocket(wsUrl, {
    onMessage,
    enabled: !!driverId,
  })

  return { readyState }
}
