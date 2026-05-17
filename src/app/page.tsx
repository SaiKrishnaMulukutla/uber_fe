import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="mb-3 text-6xl">🚖</div>
        <h1 className="text-4xl font-black tracking-tight text-white">RideGo</h1>
        <p className="mt-2 text-zinc-400">Fast, reliable rides at your fingertips</p>
      </div>

      {/* CTAs */}
      <div className="w-full max-w-xs space-y-3">
        <Link
          href="/rider/login"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-4 text-base font-bold text-black hover:bg-yellow-300 transition-colors"
        >
          <span className="text-xl">🧑‍💼</span> I&apos;m a Rider
        </Link>
        <Link
          href="/driver/login"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-base font-semibold text-white hover:bg-zinc-800 transition-colors"
        >
          <span className="text-xl">🚗</span> I&apos;m a Driver
        </Link>
      </div>

      <p className="mt-10 text-xs text-zinc-600">
        Admin?{' '}
        <Link href="/admin/login" className="text-zinc-500 hover:text-zinc-300 underline">
          Sign in here
        </Link>
      </p>
    </div>
  )
}
