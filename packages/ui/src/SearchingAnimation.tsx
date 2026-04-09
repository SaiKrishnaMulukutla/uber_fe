export function SearchingAnimation() {
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {/* Outermost ring */}
      <div
        className="absolute w-32 h-32 rounded-full bg-black/5 animate-ping"
        style={{ animationDuration: '2s', animationDelay: '0.8s' }}
      />
      {/* Middle ring */}
      <div
        className="absolute w-20 h-20 rounded-full bg-black/8 animate-ping"
        style={{ animationDuration: '2s', animationDelay: '0.4s' }}
      />
      {/* Inner ring */}
      <div
        className="absolute w-12 h-12 rounded-full bg-black/10 animate-ping"
        style={{ animationDuration: '2s' }}
      />
      {/* Center */}
      <div className="relative z-10 w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg">
        <span className="text-lg">🚗</span>
      </div>
    </div>
  );
}
