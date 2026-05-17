'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { MapMarker } from './RideMapClient'

// SSR-safe: Leaflet accesses window/document and must only run client-side
const RideMapClient = dynamic(() => import('./RideMapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900">
      <LoadingSpinner size={32} />
    </div>
  ),
})

export type { MapMarker }

interface RideMapProps {
  center: [number, number]
  zoom?: number
  markers?: MapMarker[]
  className?: string
}

export function RideMap(props: RideMapProps) {
  return <RideMapClient {...props} />
}
