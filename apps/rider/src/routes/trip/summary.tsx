import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trips, payments } from '@uber_fe/shared';
import type { Trip, Payment } from '@uber_fe/shared';
import { Button, StarRating, Spinner } from '@uber_fe/ui';

export default function TripSummary() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [rated, setRated] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    Promise.all([
      trips.get(tripId),
      payments.getByTrip(tripId).catch(() => null),
    ])
      .then(([t, p]) => {
        if (t.status !== 'COMPLETED') navigate(`/trip/tracking/${tripId}`, { replace: true });
        setTrip(t);
        setPayment(p);
      })
      .finally(() => setLoading(false));
  }, [tripId, navigate]);

  const handleRate = async () => {
    if (!tripId || rating === 0) return;
    try {
      setRatingError('');
      setSubmitting(true);
      await trips.rate(tripId, { score: rating, comment: comment.trim() || undefined });
      setRated(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Rating failed';
      if (msg.includes('409') || msg.toLowerCase().includes('already')) {
        setRated(true);
      } else {
        setRatingError('Could not submit rating. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!trip) return null;

  const durationMin = trip.duration_seconds ? Math.round(trip.duration_seconds / 60) : null;
  const needsPayment = payment && payment.status === 'PENDING' && trip.payment_method !== 'cash';

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Success header */}
      <div className="bg-black px-6 pt-16 pb-10 flex flex-col items-center gap-3">
        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center animate-scale-in">
          <span className="text-3xl">✓</span>
        </div>
        <p className="text-2xl font-black text-white">You've arrived</p>
        {trip.fare !== null && trip.fare !== undefined ? (
          <p className="text-4xl font-black text-white">₹{trip.fare.toFixed(2)}</p>
        ) : (
          <p className="text-gray-400 text-sm">Fare calculated shortly</p>
        )}
      </div>

      <div className="px-5 py-6 flex flex-col gap-5 pb-24">
        {/* Trip details card */}
        <div className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-3">
          <h3 className="font-semibold text-gray-900">Trip details</h3>
          <div className="flex flex-col gap-2">
            {durationMin !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium">{durationMin} min</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment</span>
              <span className="font-medium capitalize">{trip.payment_method}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="inline-flex bg-black text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* Rating section */}
        {!rated ? (
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex flex-col gap-4 shadow-sm">
            <h3 className="font-semibold text-gray-900">How was your trip?</h3>
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment (optional)"
                rows={2}
                className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none outline-none focus:ring-2 focus:ring-black/20 transition-all duration-150 animate-slide-up"
              />
            )}
            {ratingError && (
              <p className="text-xs text-red-600">{ratingError}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={submitting}
                disabled={rating === 0}
                onClick={handleRate}
              >
                Submit rating
              </Button>
              <Button variant="ghost" size="md" onClick={() => setRated(true)}>
                Skip
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 rounded-2xl px-5 py-4 text-center">
            <p className="text-green-700 font-semibold">Thanks for rating! ⭐</p>
          </div>
        )}

        {/* Payment CTA */}
        {needsPayment && (
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate(`/payment/checkout/${tripId}`)}
          >
            Pay ₹{payment!.amount.toFixed(2)}
          </Button>
        )}

        {/* Done */}
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/')}>
          Done
        </Button>
      </div>
    </div>
  );
}
