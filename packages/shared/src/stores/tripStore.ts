import { create } from 'zustand';
import type { TripStatus } from '../types/trip';

interface DriverLocation {
  lat: number;
  lng: number;
}

interface TripState {
  tripId: string | null;
  status: TripStatus | null;
  driverLocation: DriverLocation | null;
  setTrip: (tripId: string, status: TripStatus) => void;
  setStatus: (status: TripStatus) => void;
  updateDriverLocation: (location: DriverLocation) => void;
  clearTrip: () => void;
}

export const useTripStore = create<TripState>()((set) => ({
  tripId: null,
  status: null,
  driverLocation: null,
  setTrip: (tripId, status) => set({ tripId, status, driverLocation: null }),
  setStatus: (status) => set({ status }),
  updateDriverLocation: (driverLocation) => set({ driverLocation }),
  clearTrip: () => set({ tripId: null, status: null, driverLocation: null }),
}));
