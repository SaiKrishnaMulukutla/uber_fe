import { create } from 'zustand'
import { User, Driver } from '@/types'

type Role = 'rider' | 'driver' | 'admin' | null

interface AuthState {
  accessToken: string | null
  role: Role
  user: User | null
  driver: Driver | null

  setRiderAuth: (token: string, user: User) => void
  setDriverAuth: (token: string, driver: Driver) => void
  setAdminAuth: (token: string) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  role: null,
  user: null,
  driver: null,

  setRiderAuth: (token, user) =>
    set({ accessToken: token, role: 'rider', user, driver: null }),

  setDriverAuth: (token, driver) =>
    set({ accessToken: token, role: 'driver', driver, user: null }),

  setAdminAuth: (token) =>
    set({ accessToken: token, role: 'admin', user: null, driver: null }),

  setAccessToken: (token) => set({ accessToken: token }),

  clearAuth: () =>
    set({ accessToken: null, role: null, user: null, driver: null }),
}))
