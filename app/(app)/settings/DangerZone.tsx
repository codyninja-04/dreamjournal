'use client'

import { useState, useTransition } from 'react'
import { clearJournal, deleteAccount } from './actions'

export function DangerZone({ entries }: { entries: number }) {
  return (
    <section className="card divide-y divide-line/70">
      <Row
        title="Clear the journal"
        body={`Deletes all ${entries} ${entries === 1 ? 'dream' : 'dreams'} and every pattern read. Your account stays. Export first if you want a copy.`}
        button="Clear journal"
        confirm="Yes, clear it"
        action={clearJournal}
        disabled={entries === 0}
      />
      <Row title="Delete account" body="Removes your account and everything in it. This can't be undone." button="Delete account" confirm="Yes, delete it all" action={deleteAccount} />
    </section>
  )
}

function Row({ title, body, button, confirm, action, disabled }: { title: string; body: string; button: string; confirm: string; action: () => Promise<void>; disabled?: boolean }) {
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="p-5 sm:p-6">
      <h3 className="font-medium text-ink">{title}</h3>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{body}</p>
        {confirming ? (
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-quiet" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    await action()
                    setConfirming(false)
                  } catch (e) {
                    setError((e as Error).message)
                  }
                })
              }
            >
              {pending ? 'Working…' : confirm}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost shrink-0" onClick={() => setConfirming(true)} disabled={disabled}>
            {button}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-unease">{error}</p>}
    </div>
  )
}
