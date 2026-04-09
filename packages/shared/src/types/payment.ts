export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Payment {
  id: string;
  trip_id: string;
  rider_id: string;
  rider_email: string;
  driver_id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  failure_reason: string | null;
  attempts_count: number;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface RazorpayOrder {
  payment_id: string;
  provider_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export interface VerifyPaymentRequest {
  payment_id: string;
  provider_order_id: string;
  provider_payment_id: string;
  signature: string;
}

export interface PaymentHistoryResponse {
  payments: Payment[];
  total: number;
  limit: number;
  offset: number;
}
