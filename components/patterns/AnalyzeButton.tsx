'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postJson } from '@/lib/api'

export function AnalyzeButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      await postJson('/api/patterns/analyze', {})
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button type="button" onClick={run} disabled={busy || disabled} className="btn-primary">
        {busy ? 'Reading your dreams…' : label}
      </button>
      {error && (
        <p role="alert" className="max-w-xs text-sm text-unease sm:text-right">
          {error}
        </p>
      )}
    </div>
  )
}
