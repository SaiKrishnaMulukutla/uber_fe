import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import {
  AuthResponse,
  RefreshResponse,
  Trip,
  TripRequest,
  EstimateResponse,
  HistoryResponse,
  Payment,
  PaymentOrderResponse,
  RateRequest,
  Driver,
  User,
  EarningsResponse,
} from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// ── Request interceptor — attach access token ─────────────────────────────────

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — refresh token on 401 ───────────────────────────────

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.get<{ accessToken: string }>(
          '/api/auth/refresh'
        )
        useAuthStore.getState().setAccessToken(data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/rider/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── User auth ─────────────────────────────────────────────────────────────────

export const riderRegister = (body: {
  name: string
  email: string
  phone: string
  password: string
}) => api.post<{ message: string }>('/users/register', body)

export const riderVerify = (email: string, otp: string) =>
  api.post<AuthResponse>('/users/verify-register', { email, otp })

export const riderLogin = (email: string, password: string) =>
  api.post<AuthResponse>('/users/login', { email, password })

export const riderForgotPassword = (email: string) =>
  api.post<{ message: string }>('/users/forgot-password', { email })

export const riderResetPassword = (
  email: string,
  otp: string,
  new_password: string
) => api.post('/users/reset-password', { email, otp, new_password })

export const riderRefresh = (refresh_token: string) =>
  api.post<RefreshResponse>('/users/refresh', { refresh_token })

export const getUser = (id: string) => api.get<User>(`/users/${id}`)

// ── Driver auth ───────────────────────────────────────────────────────────────

export const driverRegister = (body: {
  name: string
  email: string
  phone: string
  password: string
  vehicle_type: string
  license_plate: string
}) => api.post<{ message: string }>('/drivers/register', body)

export const driverVerify = (email: string, otp: string) =>
  api.post<AuthResponse>('/drivers/verify-register', { email, otp })

export const driverLogin = (email: string, password: string) =>
  api.post<AuthResponse>('/drivers/login', { email, password })

export const driverForgotPassword = (email: string) =>
  api.post<{ message: string }>('/drivers/forgot-password', { email })

export const driverResetPassword = (
  email: string,
  otp: string,
  new_password: string
) => api.post('/drivers/reset-password', { email, otp, new_password })

export const driverRefresh = (refresh_token: string) =>
  api.post<RefreshResponse>('/drivers/refresh', { refresh_token })

export const getDriver = (id: string) => api.get<Driver>(`/drivers/${id}`)

export const updateDriverStatus = (id: string, status: string) =>
  api.patch<Driver>(`/drivers/${id}/status`, { status })

export const updateDriverLocation = (
  id: string,
  lat: number,
  lng: number
) => api.patch(`/drivers/${id}/location`, { lat, lng })

export const respondToOffer = (tripId: string, accept: boolean) =>
  api.post(`/drivers/trips/${tripId}/respond`, { accept })

// ── Trips ─────────────────────────────────────────────────────────────────────

export const estimateTrip = (body: {
  pickup_lat: number
  pickup_lng: number
  drop_lat: number
  drop_lng: number
  vehicle_type?: string
}) => api.post<EstimateResponse>('/trips/estimate', body)

export const requestTrip = (body: TripRequest) =>
  api.post<{ trip_id: string; status: string }>('/trips/request', body)

export const getTrip = (id: string) => api.get<Trip>(`/trips/${id}`)

export const startTrip = (id: string, otp: string) =>
  api.patch<Trip>(`/trips/${id}/start`, { otp })

export const endTrip = (id: string, distance_km?: number) =>
  api.patch<Trip>(`/trips/${id}/end`, { distance_km })

export const cancelTrip = (id: string, reason?: string) =>
  api.patch<Trip>(`/trips/${id}/cancel`, { reason })

export const pushTripLocation = (
  id: string,
  lat: number,
  lng: number
) => api.post(`/trips/${id}/location`, { lat, lng })

export const rateTrip = (id: string, body: RateRequest) =>
  api.post(`/trips/${id}/rate`, body)

export const getTripHistory = (limit = 10, offset = 0) =>
  api.get<HistoryResponse>(`/trips/history?limit=${limit}&offset=${offset}`)

export const getSurge = () =>
  api.get<{ multiplier: number }>('/trips/surge')

export const setSurge = (multiplier: number) =>
  api.patch<{ multiplier: number }>('/trips/surge', { multiplier })

// ── Payments ──────────────────────────────────────────────────────────────────

export const getPayment = (tripId: string) =>
  api.get<Payment>(`/payments/${tripId}`)

export const createPaymentOrder = (payment_id: string) =>
  api.post<PaymentOrderResponse>('/payments/orders', { payment_id })

export const verifyPayment = (body: {
  payment_id: string
  provider_order_id: string
  provider_payment_id: string
  signature: string
}) => api.post<Payment>('/payments/verify', body)

export const confirmCashPayment = (id: string) =>
  api.post<Payment>(`/payments/${id}/confirm-cash`)

export const getEarnings = (period: 'week' | 'month' | 'all') =>
  api.get<EarningsResponse>(`/payments/earnings?period=${period}`)
