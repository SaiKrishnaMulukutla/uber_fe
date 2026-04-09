import { useEffect, useState } from 'react';
import { users, useSessionStore } from '@uber_fe/shared';
import type { User } from '@uber_fe/shared';
import { Spinner } from '@uber_fe/ui';

export default function Profile() {
  const userId = useSessionStore((s) => s.userId);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) users.getProfile(userId).then(setProfile).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (!profile) return <p className="text-sm text-red-600">Failed to load profile.</p>;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-lg">Profile</h2>
      <div className="bg-white border rounded-xl p-6 flex flex-col gap-3">
        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
          {profile.name[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-lg">{profile.name}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <p className="text-sm text-gray-500">{profile.phone}</p>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-yellow-400 text-lg">★</span>
          <span className="font-medium">{profile.rating.toFixed(1)}</span>
          <span className="text-gray-400">({profile.rating_count} ratings)</span>
        </div>
      </div>
    </div>
  );
}
