import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { users, useSessionStore, getUserId, getRole, getEmail } from '@uber_fe/shared';
import { AuthLayout, OTPInput, Spinner } from '@uber_fe/ui';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.slice(0, 2) + '***';
  return `${masked}@${domain}`;
}

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email ?? '';
  const setSession = useSessionStore((s) => s.setSession);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate('/auth/login', { replace: true });
  }, [email, navigate]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (code.length < 6) return;
      try {
        setError('');
        setLoading(true);
        const res = await users.verifyLogin({ email, otp: code });
        const userId = getUserId(res.access_token);
        const role = getRole(res.access_token);
        const emailClaim = getEmail(res.access_token);
        if (!userId || !role || !emailClaim) throw new Error('Invalid token');
        setSession({
          accessToken: res.access_token,
          refreshToken: res.refresh_token,
          userId,
          role,
          email: emailClaim,
        });
        navigate('/');
      } catch (e) {
        const status = e instanceof Error && 'status' in e ? (e as { status: number }).status : 0;
        if (status === 429) {
          setError('Too many attempts. Request a new code.');
        } else if (status === 410) {
          setError('Code expired. Go back to request a new one.');
        } else {
          setError('Incorrect code. Try again.');
        }
        setOtp('');
      } finally {
        setLoading(false);
      }
    },
    [email, navigate, setSession]
  );

  return (
    <AuthLayout title="Enter the code">
      <div className="flex flex-col gap-6">
        <p className="text-sm text-gray-500 -mt-4">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-gray-700">{maskEmail(email)}</span>
        </p>

        {/* OTP input */}
        <div className="relative">
          <OTPInput value={otp} onChange={setOtp} onComplete={handleVerify} />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
              <Spinner size="md" />
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center bg-red-50 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <p className="text-sm text-center text-gray-400">
          Didn't receive it?{' '}
          <button
            type="button"
            onClick={() => navigate('/auth/login', { state: { email } })}
            className="text-black font-semibold underline underline-offset-2"
          >
            Go back
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
