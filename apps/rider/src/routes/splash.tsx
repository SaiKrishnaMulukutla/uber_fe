import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore, isExpired } from '@uber_fe/shared';

export default function Splash() {
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);

  useEffect(() => {
    const timer = setTimeout(() => {
      const onboarded = localStorage.getItem('uber_onboarded');
      const loggedIn = accessToken && !isExpired(accessToken);

      if (!onboarded) {
        navigate('/onboarding', { replace: true });
      } else if (loggedIn) {
        navigate('/', { replace: true });
      } else {
        navigate('/auth/login', { replace: true });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate, accessToken]);

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center">
      <div className="animate-fade-in text-center">
        <p className="text-6xl font-black tracking-widest text-white">uber</p>
        <p className="text-gray-500 text-sm mt-3 tracking-wide">Move freely.</p>
      </div>
    </div>
  );
}
