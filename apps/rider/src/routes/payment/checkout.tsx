import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { payments } from '@uber_fe/shared';
import type { Payment } from '@uber_fe/shared';
import { Button, Spinner } from '@uber_fe/ui';

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.head.appendChild(script);
  });
}

export default function Checkout() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tripId) payments.getByTrip(tripId).then(setPayment).catch(() => setError('Payment not found')).finally(() => setLoading(false));
  }, [tripId]);

  const handlePay = async () => {
    if (!payment) return;
    try {
      setPaying(true);
      setError('');
      await loadRazorpay();
      const order = await payments.createOrder(payment.id);
      new window.Razorpay({
        key: order.key_id,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.provider_order_id,
        handler: async (response: Record<string, string>) => {
          await payments.verify({
            payment_id: payment.id,
            provider_order_id: response.razorpay_order_id,
            provider_payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          navigate('/');
        },
      }).open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (!payment) return <p className="text-red-600">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-semibold text-lg">Payment</h2>
      <div className="bg-gray-50 rounded-xl p-4 border">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount</span>
          <span className="font-semibold">₹{payment.amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Status</span>
          <span className="capitalize">{payment.status.toLowerCase()}</span>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {payment.status !== 'COMPLETED' && (
        <Button onClick={handlePay} loading={paying} className="w-full">
          Pay ₹{payment.amount.toFixed(2)}
        </Button>
      )}
      {payment.status === 'COMPLETED' && (
        <p className="text-sm text-green-600 font-medium text-center">Payment completed</p>
      )}
    </div>
  );
}
