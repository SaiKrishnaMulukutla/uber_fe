export type TripStatus =
  | 'REQUESTED'
  | 'DRIVER_ASSIGNED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'cash' | 'card' | 'wallet';

export interface Trip {
  id: string;
  rider_id: string;
  rider_email: string;
  driver_id: string | null;
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  fare: number | null;
  status: TripStatus;
  payment_method: PaymentMethod;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface FareEstimateRequest {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
}

export interface FareEstimate {
  estimated_fare: number;
  estimated_distance: number;
  estimated_duration_min: number;
  surge_multiplier: number;
  currency: string;
}

export interface TripRequestRequest {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  payment_method?: PaymentMethod;
}

export interface TripRequestResponse {
  trip_id: string;
  status: TripStatus;
}

export interface RateRequest {
  score: number;
  comment?: string;
}

export interface Rating {
  id: string;
  trip_id: string;
  rater_id: string;
  rater_role: 'rider' | 'driver';
  ratee_id: string;
  ratee_role: 'rider' | 'driver';
  score: number;
  comment: string;
  created_at: string;
}

export interface TripHistoryResponse {
  trips: Trip[];
  total: number;
  limit: number;
  offset: number;
}

export interface LocationUpdate {
  lat: number;
  lng: number;
}

export interface EndTripRequest {
  distanceKm?: number;
  durationSeconds?: number;
}

export interface CancelTripRequest {
  reason?: string;
}
