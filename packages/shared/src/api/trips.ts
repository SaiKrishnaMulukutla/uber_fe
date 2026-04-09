import { http } from './client';
import type {
  CancelTripRequest,
  EndTripRequest,
  FareEstimate,
  FareEstimateRequest,
  LocationUpdate,
  RateRequest,
  Rating,
  Trip,
  TripHistoryResponse,
  TripRequestRequest,
  TripRequestResponse,
} from '../types';

export const trips = {
  estimate: (body: FareEstimateRequest) =>
    http.post<FareEstimate>('/trips/estimate', body),

  request: (body: TripRequestRequest) =>
    http.post<TripRequestResponse>('/trips/request', body),

  get: (tripId: string) =>
    http.get<Trip>(`/trips/${tripId}`),

  start: (tripId: string) =>
    http.patch<Trip>(`/trips/${tripId}/start`),

  end: (tripId: string, body?: EndTripRequest) =>
    http.patch<Trip>(`/trips/${tripId}/end`, body),

  cancel: (tripId: string, body?: CancelTripRequest) =>
    http.patch<Trip>(`/trips/${tripId}/cancel`, body),

  rate: (tripId: string, body: RateRequest) =>
    http.post<Rating>(`/trips/${tripId}/rate`, body),

  pushLocation: (tripId: string, body: LocationUpdate) =>
    http.post<{ status: string }>(`/trips/${tripId}/location`, body),

  history: (limit = 20, offset = 0) =>
    http.get<TripHistoryResponse>(`/trips/history?limit=${limit}&offset=${offset}`),
};
