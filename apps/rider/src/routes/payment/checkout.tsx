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
    script.onerror = () => reject(new Error('Payment service unavailable'));
    document.head.appendChild(script);
  });
}

function StatusIcon({ status }: { status: Payment['status'] }) {
  if (status === 'COMPLETED') return <span className="text-5xl animate-scale-in">✅</span>;
  if (status === 'FAILED') return <span className="text-5xl">❌</span>;
  return <span className="text-5xl">💳</span>;
}

export default function Checkout() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tripId) {
      payments
        .getByTrip(tripId)
        .then(setPayment)
        .catch(() => setError('Payment not found.'))
        .finally(() => setLoading(false));
    }
  }, [tripId]);

  const handlePay = async () => {
    if (!payment) return;
    try {
      setPaying(true);
      setError('');
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Payment service unavailable');
      const order = await payments.createOrder(payment.id);
      new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.provider_order_id,
        name: 'Uber',
        description: 'Trip payment',
        handler: async (response: Record<string, string>) => {
          await payments.verify({
            payment_id: payment.id,
            provider_order_id: response.razorpay_order_id,
            provider_payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          setPayment((prev) => prev ? { ...prev, status: 'COMPLETED' } : prev);
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      }).open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment setup failed. Try again.');
      setPaying(false);
    }
  };

  const handleSimulate = async () => {
    if (!payment) return;
    try {
      setPaying(true);
      const updated = await payments.simulateSuccess(payment.id);
      setPayment(updated);
    } catch {
      setError('Simulate failed.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-500">{error || 'Payment not found.'}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const isCash = payment.payment_method === 'cash';
  const isCompleted = payment.status === 'COMPLETED';
  const isFailed = payment.status === 'FAILED';
  const isPending = payment.status === 'PENDING';
  const isProcessing = payment.status === 'PROCESSING';

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10">
        <h1 className="text-xl font-bold text-gray-900">Payment</h1>
      </div>

      <div className="px-5 py-8 flex flex-col items-center gap-6 pb-24">
        <StatusIcon status={payment.status} />

        {/* Amount */}
        <div className="text-center">
          <p className="text-4xl font-black text-gray-900">₹{payment.amount.toFixed(2)}</p>
          <p className="text-gray-400 text-sm mt-1">
            {isCompleted ? 'Payment received' : 'Amount due'}
          </p>
        </div>

        {/* Payment method badge */}
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 text-sm font-medium text-gray-700">
          {isCash ? '💵 Cash' : payment.payment_method === 'wallet' ? '👛 Wallet' : '💳 Card'}
          <span className="text-gray-400">·</span>
          <span className={`font-semibold ${isCompleted ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-gray-600'}`}>
            {payment.status.charAt(0) + payment.status.slice(1).toLowerCase()}
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 text-center w-full">
            {error}
          </p>
        )}

        {/* Cash auto-complete */}
        {isCash && !isCompleted && (
          <div className="text-center">
            <p className="text-sm text-gray-500">Cash payment will be marked complete automatically.</p>
          </div>
        )}

        {/* Card pending */}
        {!isCash && isPending && (
          <Button size="lg" fullWidth loading={paying} onClick={handlePay}>
            Pay ₹{payment.amount.toFixed(2)} with Razorpay
          </Button>
        )}

        {/* Processing */}
        {!isCash && isProcessing && !paying && (
          <div className="text-center flex flex-col items-center gap-2">
            <Spinner />
            <p className="text-sm text-gray-500">Processing payment…</p>
            <Button size="md" fullWidth onClick={handlePay}>Resume payment</Button>
          </div>
        )}

        {/* Failed */}
        {isFailed && (
          <div className="text-center flex flex-col items-center gap-2 w-full">
            {payment.failure_reason && (
              <p className="text-sm text-red-600 text-center">{payment.failure_reason}</p>
            )}
            <Button size="lg" fullWidth variant="danger" onClick={handlePay}>
              Try again
            </Button>
          </div>
        )}

        {/* Completed */}
        {isCompleted && (
          <Button size="lg" fullWidth variant="secondary" onClick={() => navigate('/')}>
            Back to home
          </Button>
        )}

        {/* Dev simulate button */}
        {import.meta.env.DEV && !isCompleted && (
          <Button variant="ghost" size="sm" loading={paying} onClick={handleSimulate}>
            [Dev] Simulate payment
          </Button>
        )}
      </div>
    </div>
  );
}
