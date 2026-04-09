import { http } from './client';
import type {
  Driver,
  DriverAuthResponse,
  DriverStatus,
  LoginRequest,
  NearbyDriversResponse,
  RefreshRequest,
  RefreshResponse,
  RegisterDriverRequest,
  UpdateLocationRequest,
  VerifyOTPRequest,
} from '../types';

export const drivers = {
  register: (body: RegisterDriverRequest) =>
    http.post<DriverAuthResponse>('/drivers/register', body, true),

  login: (body: LoginRequest) =>
    http.post<{ message: string }>('/drivers/login', body, true),

  verifyLogin: (body: VerifyOTPRequest) =>
    http.post<DriverAuthResponse>('/drivers/verify-login', body, true),

  refresh: (body: RefreshRequest) =>
    http.post<RefreshResponse>('/drivers/refresh', body, true),

  getProfile: (driverId: string) =>
    http.get<Driver>(`/drivers/${driverId}`),

  updateLocation: (driverId: string, body: UpdateLocationRequest) =>
    http.patch<{ status: string }>(`/drivers/${driverId}/location`, body),

  updateStatus: (driverId: string, status: DriverStatus) =>
    http.patch<Driver>(`/drivers/${driverId}/status`, { status }),

  nearby: (lat: number, lng: number, radius = 5) =>
    http.get<NearbyDriversResponse>(`/drivers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
};
