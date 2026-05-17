export function OTPDisplay({ otp }: { otp: string }) {
  return (
    <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-center">
      <p className="mb-1 text-xs text-zinc-400 uppercase tracking-widest">Ride OTP</p>
      <div className="flex justify-center gap-2">
        {otp.split('').map((digit, i) => (
          <div
            key={i}
            className="flex h-12 w-10 items-center justify-center rounded-lg border border-yellow-400/40 bg-zinc-900 text-2xl font-bold text-yellow-400"
          >
            {digit}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500">Share this with your driver when they arrive</p>
    </div>
  )
}
