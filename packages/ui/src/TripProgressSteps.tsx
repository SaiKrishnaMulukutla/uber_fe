export type TripStep = 'requested' | 'driver_found' | 'en_route' | 'arrived';

interface TripProgressStepsProps {
  currentStep: TripStep;
}

const STEPS: { key: TripStep; label: string }[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'driver_found', label: 'Driver found' },
  { key: 'en_route', label: 'En route' },
  { key: 'arrived', label: 'Arrived' },
];

const STEP_ORDER: Record<TripStep, number> = {
  requested: 0,
  driver_found: 1,
  en_route: 2,
  arrived: 3,
};

export function TripProgressSteps({ currentStep }: TripProgressStepsProps) {
  const currentIndex = STEP_ORDER[currentStep];

  return (
    <div className="flex items-center w-full px-1">
      {STEPS.map((step, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step dot + label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                  isPast || isCurrent ? 'bg-black' : 'bg-gray-200'
                } ${isCurrent ? 'ring-2 ring-black/20 ring-offset-1' : ''}`}
              />
              <span
                className={`text-[9px] font-medium whitespace-nowrap ${
                  isCurrent ? 'text-black' : isPast ? 'text-gray-500' : 'text-gray-300'
                }`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300 ${
                  i < currentIndex ? 'bg-black' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
