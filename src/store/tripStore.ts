import { create } from 'zustand'
import { Trip, EstimateResponse } from '@/types'

interface TripState {
  activeTrip: Trip | null
  estimate: EstimateResponse | null

  setActiveTrip: (trip: Trip) => void
  updateTrip: (trip: Trip) => void
  setEstimate: (estimate: EstimateResponse) => void
  clearTrip: () => void
}

export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  estimate: null,

  setActiveTrip: (trip) => set({ activeTrip: trip }),
  updateTrip: (trip) => set({ activeTrip: trip }),
  setEstimate: (estimate) => set({ estimate }),
  clearTrip: () => set({ activeTrip: null, estimate: null }),
}))
