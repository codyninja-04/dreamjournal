'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { formatDay, formatTimestamp } from '@/lib/format'
import { SLEEP_LABELS, type DreamEntry, type LogResult } from '@/lib/types'
import { DreamDetailsFields, SleepDots, detailsFrom, type DreamDetails } from '../log/DreamDetailsFields'
import { EmotionTag, LabelTag } from './EmotionTag'

// One dream: read it, correct it, rerun the details, or delete it.
export function EntryView({ entry: initial, claudeReady }: { entry: DreamEntry; claudeReady: boolean }) {
  const router = useRouter()
  const [entry, setEntry] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [details, setDetails] = useState<DreamDetails>(() => detailsFrom(initial))
  const [rawText, setRawText] = useState(initial.raw_text)
  const [date, setDate] = useState(initial.dream_date)
  const [busy, setBusy] = useState<'save' | 'refresh' | 'delete' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setDetails(detailsFrom(entry))
    setRawText(entry.raw_text)
    setDate(entry.dream_date)
    setError(null)
    setEditing(true)
  }

  async function save() {
    setBusy('save')
    setError(null)
    try {
      const { entry: next } = await postJson<{ entry: DreamEntry }>(`/api/dreams/${entry.id}`, { ...details, raw_text: rawText, dream_date: date }, 'PATCH')
      setEntry(next)
      setEditing(false)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function refresh() {
    setBusy('refresh')
    setError(null)
    try {
      const r = await postJson<LogResult>(`/api/dreams/${entry.id}/restructure`, {})
      setEntry(r.entry)
      if (r.structureError) setError(r.structureError)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    setBusy('delete')
    try {
      await postJson(`/api/dreams/${entry.id}`, {}, 'DELETE')
      router.push('/journal')
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
      setBusy(null)
    }
  }

  if (editing) {
    return (
      <div className="mt-6">
        <h1 className="heading text-3xl">Edit dream</h1>
        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="date" className="field-label">
              Night of
            </label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input max-w-[12rem]" />
          </div>
          <div>
            <label htmlFor="raw" className="field-label">
              The dream
            </label>
            <textarea id="raw" value={rawText} onChange={(e) => setRawText(e.target.value)} rows={10} className="input resize-y font-serif text-[1rem] leading-[1.75]" />
            <p className="hint">Changed the text a lot? Save, then use “Refresh details” so the tags catch up.</p>
          </div>
          <DreamDetailsFields value={details} onChange={setDetails} />
        </div>
        {error && (
          <p role="alert" className="mt-5 text-sm text-unease">
            {error}
          </p>
        )}
        <div className="mt-8 flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className="btn-quiet" disabled={busy !== null}>
            Cancel
          </button>
          <button type="button" onClick={save} className="btn-primary" disabled={busy !== null || !rawText.trim()}>
            {busy === 'save' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    )
  }

  const hasDetails = entry.emotions.length + entry.recurring_symbols.length + entry.people_present.length > 0 || !!entry.setting

  return (
    <article className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="label">{formatDay(entry.dream_date, { weekday: true, year: true })}</p>
        {entry.was_lucid && <span className="chip border-dawn/30 bg-dawn-soft py-0.5 text-dawn">lucid</span>}
        {entry.input_method === 'voice' && <span className="chip py-0.5">voice note</span>}
      </div>
      {entry.summary && <h1 className="heading mt-3 text-2xl leading-snug sm:text-[1.9rem]">{entry.summary}</h1>}

      <div className={`prose-dream ${entry.summary ? 'mt-6 border-l border-line pl-5 text-ink/80' : 'mt-4'}`}>{entry.raw_text}</div>

      {hasDetails && (
        <dl className="card mt-8 grid gap-5 p-5 sm:grid-cols-2">
          {entry.emotions.length > 0 && (
            <Detail term="Felt">
              {entry.emotions.map((e) => (
                <EmotionTag key={e} emotion={e} href={`/journal?emotion=${encodeURIComponent(e)}`} />
              ))}
            </Detail>
          )}
          {entry.recurring_symbols.length > 0 && (
            <Detail term="Symbols and themes">
              {entry.recurring_symbols.map((s) => (
                <LabelTag key={s} label={s} href={`/journal?symbol=${encodeURIComponent(s)}`} />
              ))}
            </Detail>
          )}
          {entry.people_present.length > 0 && (
            <Detail term="People">
              {entry.people_present.map((p) => (
                <LabelTag key={p} label={p} />
              ))}
            </Detail>
          )}
          {entry.setting && (
            <Detail term="Setting">
              <span className="text-sm text-ink/90">{entry.setting}</span>
            </Detail>
          )}
          {entry.sleep_quality_that_night && (
            <Detail term="Sleep">
              <span className="flex items-center gap-2 text-sm text-ink/90">
                <SleepDots n={entry.sleep_quality_that_night} />
                {SLEEP_LABELS[entry.sleep_quality_that_night]}
              </span>
            </Detail>
          )}
        </dl>
      )}

      {entry.life_context_note && (
        <div className="mt-4 rounded-2xl border border-dawn/20 bg-dawn-soft p-4">
          <p className="label text-dawn/90">Going on in life</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/90">{entry.life_context_note}</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-5 text-sm text-unease">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button type="button" onClick={startEdit} className="btn-ghost" disabled={busy !== null}>
          Edit
        </button>
        {claudeReady && (
          <button type="button" onClick={refresh} className="btn-ghost" disabled={busy !== null}>
            {busy === 'refresh' ? 'Reading it again…' : entry.structured_at ? 'Refresh details' : 'Pull out details'}
          </button>
        )}
        <span className="flex-1" />
        {confirmDelete ? (
          <span className="flex items-center gap-2">
            <span className="text-xs text-muted">Delete for good?</span>
            <button type="button" onClick={() => setConfirmDelete(false)} className="btn-quiet" disabled={busy !== null}>
              Keep
            </button>
            <button type="button" onClick={remove} className="btn-danger" disabled={busy !== null}>
              {busy === 'delete' ? 'Deleting…' : 'Delete'}
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="btn-quiet">
            Delete
          </button>
        )}
      </div>
      <p className="mt-4 text-xs text-faint">Logged {formatTimestamp(entry.logged_at)}</p>
    </article>
  )
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label mb-2">{term}</dt>
      <dd className="flex flex-wrap gap-1.5">{children}</dd>
    </div>
  )
}
