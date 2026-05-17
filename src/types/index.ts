// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user?: User
  driver?: Driver
}

export interface RefreshResponse {
  access_token: string
  refresh_token: string
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  phone: string
  rating: number
  rating_count: number
  created_at: string
}

// ── Driver ────────────────────────────────────────────────────────────────────

export type DriverStatus = 'available' | 'busy' | 'offline'
export type VehicleType = 'go' | 'x' | 'xl'

export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  vehicle_type: VehicleType
  license_plate: string
  status: DriverStatus
  rating: number
  rating_count: number
  created_at: string
}

// ── Trip ──────────────────────────────────────────────────────────────────────

export type TripStatus =
  | 'REQUESTED'
  | 'DRIVER_ASSIGNED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED'

export type PaymentMethod = 'upi' | 'card' | 'cash'

export interface Trip {
  id: string
  rider_id: string
  rider_email: string
  rider_phone: string
  driver_id?: string
  pickup_lat: number
  pickup_lng: number
  drop_lat: number
  drop_lng: number
  fare?: number
  status: TripStatus
  vehicle_type: VehicleType
  payment_method: PaymentMethod
  duration_seconds?: number
  requested_at?: string
  started_at?: string
  completed_at?: string
  created_at: string
  ride_otp?: string            // populated for rider when DRIVER_ASSIGNED
}

export interface TripRequest {
  pickup_lat: number
  pickup_lng: number
  drop_lat: number
  drop_lng: number
  payment_method?: PaymentMethod
  vehicle_type?: VehicleType
}

export interface EstimateResponse {
  estimated_fare: number
  distance_km: number
  duration_min: number
  surge_multiplier: number
  currency: string
}

export interface HistoryResponse {
  trips: Trip[]
  total: number
  limit: number
  offset: number
}

// ── Payment ───────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'AWAITING_CASH_CONFIRM'
  | 'COMPLETED'
  | 'FAILED'

export interface Payment {
  id: string
  trip_id: string
  rider_id: string
  driver_id: string
  amount: number
  status: PaymentStatus
  payment_method: PaymentMethod
  provider: string
  provider_order_id?: string
  created_at: string
  completed_at?: string
}

export interface PaymentOrderResponse {
  provider_order_id: string
  amount: number
  currency: string
  key_id: string
}

// ── Rating ────────────────────────────────────────────────────────────────────

export interface RateRequest {
  score: number
  comment?: string
}

// ── Earnings ──────────────────────────────────────────────────────────────────

export interface DailyEarning {
  date: string   // YYYY-MM-DD
  amount: number
  trips: number
}

export interface EarningsResponse {
  period: string
  total_earnings: number
  trip_count: number
  daily: DailyEarning[]
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
}
