import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { drivers, useSessionStore, getUserId, getRole, getEmail } from '@uber_fe/shared';
import { Button, OTPInput } from '@uber_fe/ui';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email ?? '';
  const setSession = useSessionStore((s) => s.setSession);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 6) return;
    try {
      setError('');
      setLoading(true);
      const res = await drivers.verifyLogin({ email, otp });
      const userId = getUserId(res.access_token);
      const role = getRole(res.access_token);
      const emailClaim = getEmail(res.access_token);
      if (!userId || !role || !emailClaim) throw new Error('Invalid token');
      setSession({ accessToken: res.access_token, refreshToken: res.refresh_token, userId, role, email: emailClaim });
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Enter OTP</h1>
        <p className="text-sm text-gray-500 mb-6">Sent to {email}</p>
        <div className="flex flex-col gap-6">
          <OTPInput value={otp} onChange={setOtp} />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button onClick={handleVerify} loading={loading} disabled={otp.length < 6} className="w-full">
            Verify
          </Button>
        </div>
      </div>
    </div>
  );
}
