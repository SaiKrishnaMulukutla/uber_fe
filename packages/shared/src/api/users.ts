import { http } from './client';
import type {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  User,
  VerifyOTPRequest,
} from '../types';

export const users = {
  register: (body: RegisterRequest) =>
    http.post<AuthResponse>('/users/register', body, true),

  login: (body: LoginRequest) =>
    http.post<{ message: string }>('/users/login', body, true),

  verifyLogin: (body: VerifyOTPRequest) =>
    http.post<AuthResponse>('/users/verify-login', body, true),

  refresh: (body: RefreshRequest) =>
    http.post<RefreshResponse>('/users/refresh', body, true),

  getProfile: (userId: string) =>
    http.get<User>(`/users/${userId}`),
};
