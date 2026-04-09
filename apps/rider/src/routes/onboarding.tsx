import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@uber_fe/ui';

const SLIDES = [
  {
    icon: '🚗',
    title: 'Get there',
    subtitle: 'Tap the map to set your pickup and drop, then book a ride in seconds.',
  },
  {
    icon: '📍',
    title: 'Track your ride',
    subtitle: 'Watch your driver navigate to you in real time on the map.',
  },
  {
    icon: '💳',
    title: 'Pay easily',
    subtitle: 'Cash, card, or wallet — pay how you prefer after every trip.',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const finish = () => {
    localStorage.setItem('uber_onboarded', '1');
    navigate('/auth/login', { replace: true });
  };

  const next = () => {
    if (current < SLIDES.length - 1) setCurrent((c) => c + 1);
    else finish();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -50 && current < SLIDES.length - 1) setCurrent((c) => c + 1);
    if (delta > 50 && current > 0) setCurrent((c) => c - 1);
  };

  const slide = SLIDES[current];

  return (
    <div
      className="h-screen w-full bg-black flex flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      <button
        onClick={finish}
        className="absolute top-10 right-6 text-gray-400 text-sm font-medium z-10"
      >
        Skip
      </button>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div key={current} className="text-center animate-slide-in-right">
          <div className="text-8xl mb-10">{slide.icon}</div>
          <h2 className="text-3xl font-black text-white mb-4">{slide.title}</h2>
          <p className="text-gray-400 text-base leading-relaxed">{slide.subtitle}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-12 flex flex-col gap-6">
        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-200 ${
                i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={next}
          className="bg-white text-black hover:bg-gray-100"
        >
          {current < SLIDES.length - 1 ? 'Next' : 'Get started'}
        </Button>
      </div>
    </div>
  );
}
