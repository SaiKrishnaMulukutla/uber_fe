'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { getSurge, setSurge } from '@/lib/api'

const SURGE_MIN = 1.0
const SURGE_MAX = 5.0
const SURGE_STEP = 0.1

const PRESETS = [
  { label: 'Normal', value: 1.0, color: 'text-green-400 border-green-500/40 bg-green-500/10' },
  { label: '1.5×', value: 1.5, color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  { label: '2×', value: 2.0, color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' },
  { label: '3×', value: 3.0, color: 'text-red-400 border-red-500/40 bg-red-500/10' },
  { label: '5×', value: 5.0, color: 'text-red-600 border-red-700/40 bg-red-700/10' },
]

function surgeColor(v: number) {
  if (v <= 1.0) return 'text-green-400'
  if (v <= 1.5) return 'text-yellow-400'
  if (v <= 2.5) return 'text-orange-400'
  return 'text-red-400'
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { clearAuth } = useAuthStore()

  const [current, setCurrent] = useState<number | null>(null)
  const [draft, setDraft] = useState(1.0)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    getSurge()
      .then((res) => {
        setCurrent(res.data.multiplier)
        setDraft(res.data.multiplier)
      })
      .catch(() => toast.error('Failed to load surge'))
      .finally(() => setFetching(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await setSurge(draft)
      setCurrent(res.data.multiplier)
      setDraft(res.data.multiplier)
      toast.success(`Surge set to ${res.data.multiplier.toFixed(1)}×`)
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error ?? 'Failed to update surge' : 'Failed to update surge'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const isDirty = current !== null && Math.abs(draft - current) > 0.001

  return (
    <div className="min-h-screen bg-black px-4 pt-10 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Control Panel</h1>
          <p className="text-sm text-zinc-500">RideGo Admin</p>
        </div>
        <button
          onClick={() => { clearAuth(); router.push('/admin/login') }}
          className="text-xs text-zinc-600 hover:text-zinc-400"
        >
          Sign out
        </button>
      </div>

      {/* Surge card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h2 className="font-semibold text-white">Surge Pricing</h2>
        </div>
        <p className="mb-5 text-xs text-zinc-500">
          Multiplies base fares during high demand. Range: 1.0× – 5.0×
        </p>

        {fetching ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size={28} />
          </div>
        ) : (
          <>
            {/* Live value */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-zinc-500 mb-1">Current</p>
                <p className={`text-4xl font-black ${surgeColor(current ?? 1)}`}>
                  {(current ?? 1).toFixed(1)}×
                </p>
              </div>
              {isDirty && (
                <div className="flex-1 text-right">
                  <p className="text-xs text-zinc-500 mb-1">Pending</p>
                  <p className={`text-4xl font-black ${surgeColor(draft)}`}>
                    {draft.toFixed(1)}×
                  </p>
                </div>
              )}
            </div>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min={SURGE_MIN}
                max={SURGE_MAX}
                step={SURGE_STEP}
                value={draft}
                onChange={(e) => setDraft(parseFloat(e.target.value))}
                className="w-full accent-yellow-400"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>1.0×</span>
                <span>2.5×</span>
                <span>5.0×</span>
              </div>
            </div>

            {/* Presets */}
            <div className="mb-5 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDraft(p.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${p.color} ${
                    Math.abs(draft - p.value) < 0.001 ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold disabled:opacity-40"
            >
              {saving ? <LoadingSpinner size={18} /> : `Apply ${draft.toFixed(1)}× Surge`}
            </Button>

            {!isDirty && (
              <p className="mt-2 text-center text-xs text-zinc-600">No pending changes</p>
            )}
          </>
        )}
      </div>

      {/* Info cards */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-xs text-zinc-500 mb-1">Min multiplier</p>
          <p className="text-lg font-bold text-green-400">1.0×</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-xs text-zinc-500 mb-1">Max multiplier</p>
          <p className="text-lg font-bold text-red-400">5.0×</p>
        </div>
      </div>
    </div>
  )
}
