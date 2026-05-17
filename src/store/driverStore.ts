import { create } from 'zustand'
import { DriverStatus, Trip } from '@/types'

interface DriverState {
  status: DriverStatus
  currentOffer: Trip | null
  activeTrip: Trip | null

  setStatus: (status: DriverStatus) => void
  setOffer: (trip: Trip) => void
  clearOffer: () => void
  setActiveTrip: (trip: Trip) => void
  clearActiveTrip: () => void
}

export const useDriverStore = create<DriverState>((set) => ({
  status: 'offline',
  currentOffer: null,
  activeTrip: null,

  setStatus: (status) => set({ status }),
  setOffer: (trip) => set({ currentOffer: trip }),
  clearOffer: () => set({ currentOffer: null }),
  setActiveTrip: (trip) => set({ activeTrip: trip }),
  clearActiveTrip: () => set({ activeTrip: null }),
}))
