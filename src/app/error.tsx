'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <div className="mb-4 text-6xl">⚠️</div>
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-400">{error.message ?? 'An unexpected error occurred.'}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-black hover:bg-yellow-300 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
