import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { users, useSessionStore } from '@uber_fe/shared';
import type { User } from '@uber_fe/shared';
import { Spinner, Button } from '@uber_fe/ui';
import { ChevronRightIcon, MailIcon, PhoneIcon } from '@uber_fe/ui';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Profile() {
  const navigate = useNavigate();
  const userId = useSessionStore((s) => s.userId);
  const email = useSessionStore((s) => s.email);
  const clearSession = useSessionStore((s) => s.clearSession);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      users.getProfile(userId).then(setProfile).finally(() => setLoading(false));
    }
  }, [userId]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      clearSession();
      navigate('/auth/login', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  const name = profile?.name ?? email ?? 'Rider';
  const rating = profile?.rating ?? 0;
  const ratingCount = profile?.rating_count ?? 0;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 z-10">
        <h1 className="text-xl font-bold text-gray-900">Account</h1>
      </div>

      <div className="px-4 py-4 pb-24 flex flex-col gap-4">
        {/* Avatar + name card */}
        <div className="bg-white rounded-2xl px-5 py-6 shadow-sm flex items-center gap-4">
          <div className="h-16 w-16 bg-black rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xl">{getInitials(name)}</span>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{name}</p>
            <p className="text-sm text-gray-400">{profile?.email ?? email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {ratingCount === 0 ? (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">New rider</span>
              ) : (
                <>
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({ratingCount} ratings)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info card */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
              <MailIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">Email</p>
                <p className="text-sm text-gray-900 truncate">{profile.email}</p>
              </div>
              <span className="text-gray-200">🔒</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <PhoneIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">Phone</p>
                <p className="text-sm text-gray-900">{profile.phone}</p>
              </div>
              <span className="text-gray-200">🔒</span>
            </div>
          </div>
        )}

        {/* Support rows */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            { label: 'Help', icon: '❓' },
            { label: 'Safety', icon: '🛡️' },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-5 py-4 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
              <ChevronRightIcon className="h-4 w-4 text-gray-300" />
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 text-red-500 font-semibold text-sm bg-white rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
