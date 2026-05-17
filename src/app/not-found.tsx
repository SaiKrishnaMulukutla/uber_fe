import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="mb-4 text-6xl">🗺️</div>
      <h1 className="text-3xl font-black text-white">404</h1>
      <p className="mt-2 text-zinc-400">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-black hover:bg-yellow-300 transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
}
