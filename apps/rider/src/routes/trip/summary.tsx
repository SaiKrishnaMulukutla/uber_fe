import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trips } from '@uber_fe/shared';
import type { Trip } from '@uber_fe/shared';
import { Button, StarRating, Spinner } from '@uber_fe/ui';

export default function TripSummary() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tripId) trips.get(tripId).then(setTrip).catch(console.error);
  }, [tripId]);

  const handleRate = async () => {
    if (!tripId || rating === 0) return;
    try {
      setSubmitting(true);
      await trips.rate(tripId, { score: rating });
      setRated(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!trip) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-semibold text-lg">Trip completed</h2>

      <div className="bg-gray-50 rounded-xl p-4 border flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Fare</span>
          <span className="font-semibold">₹{trip.fare?.toFixed(2) ?? '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Duration</span>
          <span>{trip.duration_seconds ? `${Math.round(trip.duration_seconds / 60)} min` : '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Payment</span>
          <span className="capitalize">{trip.payment_method}</span>
        </div>
      </div>

      {!rated ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Rate your driver</p>
          <StarRating value={rating} onChange={setRating} />
          <Button onClick={handleRate} loading={submitting} disabled={rating === 0} className="w-full">
            Submit rating
          </Button>
          <button onClick={() => setRated(true)} className="text-sm text-gray-500 underline text-center">
            Skip
          </button>
        </div>
      ) : (
        <p className="text-sm text-green-600 font-medium text-center">Thanks for rating!</p>
      )}

      {trip.payment_method !== 'cash' && (
        <Button variant="secondary" onClick={() => navigate(`/payment/checkout/${tripId}`)} className="w-full">
          Pay now
        </Button>
      )}

      <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
        Back to home
      </Button>
    </div>
  );
}
