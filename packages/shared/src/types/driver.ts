export type DriverStatus = 'available' | 'busy' | 'offline';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  license_plate: string;
  status: DriverStatus;
  rating: number;
  rating_count: number;
  created_at: string;
}

export interface DriverAuthResponse {
  access_token: string;
  refresh_token: string;
  driver: Driver;
}

export interface RegisterDriverRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicle_type: string;
  license_plate: string;
}

export interface UpdateLocationRequest {
  lat: number;
  lng: number;
}

export interface UpdateStatusRequest {
  status: DriverStatus;
}

export interface NearbyDriversResponse {
  driver_ids: string[];
}
