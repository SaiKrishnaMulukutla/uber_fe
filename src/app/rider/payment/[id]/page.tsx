'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { getTrip, getPayment, createPaymentOrder, verifyPayment, rateTrip } from '@/lib/api'
import { Trip, Payment } from '@/types'
import axios from 'axios'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

const STARS = [1, 2, 3, 4, 5]

export default function RiderPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [paying, setPaying] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [rated, setRated] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    Promise.all([getTrip(id), getPayment(id)])
      .then(([tripRes, payRes]) => {
        setTrip(tripRes.data)
        setPayment(payRes.data)
        if (payRes.data.status === 'COMPLETED') setDone(true)
      })
      .catch(() => toast.error('Failed to load trip details'))
  }, [id])

  // Load Razorpay SDK once
  useEffect(() => {
    if (document.getElementById('rzp-script')) return
    const script = document.createElement('script')
    script.id = 'rzp-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)
  }, [])

  const handleOnlinePayment = async () => {
    if (!payment) return
    setPaying(true)
    try {
      const orderRes = await createPaymentOrder(payment.id)
      const { provider_order_id, amount, currency, key_id } = orderRes.data

      const rzp = new window.Razorpay({
        key: key_id,
        amount: amount * 100,
        currency,
        order_id: provider_order_id,
        name: 'RideGo',
        description: 'Trip payment',
        theme: { color: '#facc15' },
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            await verifyPayment({
              payment_id: payment.id,
              provider_order_id: response.razorpay_order_id,
              provider_payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            toast.success('Payment successful!')
            setDone(true)
            setPayment((prev) => prev ? { ...prev, status: 'COMPLETED' } : prev)
          } catch {
            toast.error('Payment verification failed')
          } finally {
            setPaying(false)
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      })
      rzp.open()
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Payment failed' : 'Payment failed'
      toast.error(msg)
      setPaying(false)
    }
  }

  const handleRating = async () => {
    if (rating === 0) { toast.error('Please select a rating'); return }
    setSubmittingRating(true)
    try {
      await rateTrip(id, { score: rating, comment: comment.trim() || undefined })
      toast.success('Thanks for your feedback!')
      setRated(true)
    } catch {
      toast.error('Could not submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  if (!trip || !payment) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  const isCash = trip.payment_method === 'cash'
  const isPaid = done || payment.status === 'COMPLETED' || payment.status === 'AWAITING_CASH_CONFIRM'

  return (
    <div className="flex min-h-screen flex-col bg-black px-4 pt-10 pb-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-2 text-4xl">{isPaid ? '✅' : '💳'}</div>
        <h1 className="text-xl font-bold text-white">
          {isPaid ? 'Ride Complete!' : 'Pay for your ride'}
        </h1>
        <p className="text-sm text-zinc-400">Trip #{id.slice(0, 8)}</p>
      </div>

      {/* Fare summary */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Fare</span>
          <span className="text-2xl font-bold text-white">₹{payment.amount.toFixed(0)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>{trip.vehicle_type.toUpperCase()}</span>
          <span className="capitalize">{trip.payment_method}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Status</span>
          <span className={`font-medium ${
            payment.status === 'COMPLETED' ? 'text-green-400' :
            payment.status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {payment.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Payment action */}
      {!isPaid && (
        <div className="mb-6">
          {isCash ? (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-center">
              <p className="text-sm text-zinc-300">Pay <span className="font-bold text-white">₹{payment.amount.toFixed(0)}</span> cash to your driver.</p>
              <p className="mt-1 text-xs text-zinc-500">Driver will confirm receipt on their end.</p>
            </div>
          ) : (
            <Button
              onClick={handleOnlinePayment}
              disabled={paying}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold text-base"
            >
              {paying ? <LoadingSpinner size={18} /> : `Pay ₹${payment.amount.toFixed(0)}`}
            </Button>
          )}
        </div>
      )}

      {/* Rating */}
      {(isPaid || isCash) && !rated && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4">
          <p className="mb-3 text-sm font-medium text-white">Rate your driver</p>
          <div className="mb-3 flex justify-center gap-2">
            {STARS.map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className={`text-3xl transition-transform hover:scale-110 ${s <= rating ? 'text-yellow-400' : 'text-zinc-600'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            placeholder="Any comments? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="mb-3 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-yellow-400"
          />
          <Button
            onClick={handleRating}
            disabled={submittingRating || rating === 0}
            className="w-full bg-zinc-800 text-white hover:bg-zinc-700 font-semibold"
          >
            {submittingRating ? <LoadingSpinner size={16} /> : 'Submit Rating'}
          </Button>
        </div>
      )}

      {rated && (
        <div className="mb-6 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-center text-sm text-yellow-400">
          Rating submitted. Thanks!
        </div>
      )}

      {/* Go home */}
      <Button
        variant="outline"
        onClick={() => router.push('/rider/home')}
        className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
      >
        Back to Home
      </Button>
    </div>
  )
}
