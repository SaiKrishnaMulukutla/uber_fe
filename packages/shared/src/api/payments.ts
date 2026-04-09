import { http } from './client';
import type {
  Payment,
  PaymentHistoryResponse,
  RazorpayOrder,
  VerifyPaymentRequest,
} from '../types';

export const payments = {
  getByTrip: (tripId: string) =>
    http.get<Payment>(`/payments/${tripId}`),

  createOrder: (paymentId: string) =>
    http.post<RazorpayOrder>('/payments/orders', { payment_id: paymentId }),

  verify: (body: VerifyPaymentRequest) =>
    http.post<Payment>('/payments/verify', body),

  simulateSuccess: (paymentId: string) =>
    http.post<Payment>('/payments/simulate-success', { payment_id: paymentId }),

  history: (limit = 20, offset = 0) =>
    http.get<PaymentHistoryResponse>(`/payments/history?limit=${limit}&offset=${offset}`),
};
