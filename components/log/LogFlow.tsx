'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { postJson } from '@/lib/api'
import { addDays, formatDay, localToday, timesWord } from '@/lib/format'
import type { LogResult } from '@/lib/types'
import { DreamDetailsFields, detailsFrom, type DreamDetails } from './DreamDetailsFields'
import { QuickTextLog } from './QuickTextLog'
import { VoiceLogButton } from './VoiceLogButton'

const DRAFT_KEY = 'dreamjournal:draft'

type Stage = 'capture' | 'saving' | 'review'

function readDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeDraft(text: string) {
  try {
    if (text) localStorage.setItem(DRAFT_KEY, text)
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Private mode or storage blocked. The draft just won't survive a reload.
  }
}

export function LogFlow({ voice, claudeReady }: { voice: { enabled: boolean; reason: string | null }; claudeReady: boolean }) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('capture')
  const [mode, setMode] = useState<'voice' | 'text'>(voice.enabled ? 'voice' : 'text')
  const [today, setToday] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [savingWhat, setSavingWhat] = useState<'voice' | 'text'>('text')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LogResult | null>(null)

  // The date is the browser's own calendar day, so it's set after mount
  // rather than on the server.
  useEffect(() => {
    const t = localToday()
    setToday(t)
    setDate(t)
    const draft = readDraft()
    if (draft) {
      setText(draft)
      setMode('text')
    }
  }, [])

  useEffect(() => {
    if (stage === 'capture') writeDraft(text)
  }, [text, stage])

  const finishSaving = useCallback((r: LogResult) => {
    writeDraft('')
    setText('')
    setResult(r)
    setStage('review')
    window.scrollTo({ top: 0 })
  }, [])

  async function saveText() {
    if (!text.trim() || !date) return
    setError(null)
    setSavingWhat('text')
    setStage('saving')
    try {
      finishSaving(await postJson<LogResult>('/api/dreams', { raw_text: text, dream_date: date }))
    } catch (e) {
      setError((e as Error).message)
      setStage('capture')
    }
  }

  async function saveVoice(audio: Blob) {
    if (!date) return
    setError(null)
    setSavingWhat('voice')
    setStage('saving')
    const form = new FormData()
    form.append('audio', audio, 'dream')
    form.append('dream_date', date)
    try {
      const res = await fetch('/api/dreams/voice-log', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error || "Couldn't save that recording. Type it out instead.")
      finishSaving(data as LogResult)
    } catch (e) {
      setError((e as Error).message)
      setMode('text')
      setStage('capture')
    }
  }

  if (stage === 'saving') return <Saving what={savingWhat} claudeReady={claudeReady} />
  if (stage === 'review' && result) {
    return (
      <Review
        initial={result}
        claudeReady={claudeReady}
        onDone={(id) => router.push(`/entries/${id}`)}
        onAnother={() => {
          setResult(null)
          setStage('capture')
          setMode(voice.enabled ? 'voice' : 'text')
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl animate-rise-in">
      <DatePicker today={today} value={date} onChange={setDate} />

      <h1 className="heading mt-5 text-center text-4xl sm:text-5xl">What did you dream?</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted">
        Start with whatever you remember, even a single image. More tends to come back once you start.
      </p>

      {error && (
        <p role="alert" className="mx-auto mt-6 max-w-md rounded-xl border border-unease/30 bg-unease-soft px-4 py-3 text-center text-sm text-unease">
          {error}
        </p>
      )}

      <div className="mt-10">
        {mode === 'voice' ? (
          <div className="flex flex-col items-center">
            <VoiceLogButton onRecorded={saveVoice} disabled={!date} />
            <button type="button" onClick={() => setMode('text')} className="btn-quiet mt-6">
              <KeyboardIcon />
              Type it instead
            </button>
          </div>
        ) : (
          <>
            <QuickTextLog value={text} onChange={setText} onSubmit={saveText} disabled={!date} />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              {voice.enabled ? (
                <button type="button" onClick={() => setMode('voice')} className="btn-quiet">
                  <MicIcon />
                  Say it instead
                </button>
              ) : (
                voice.reason && <p className="text-xs text-faint">{voice.reason}</p>
              )}
              {text && <span className="text-xs text-faint">Draft kept on this device until you save.</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DatePicker({ today, value, onChange }: { today: string | null; value: string | null; onChange: (v: string) => void }) {
  if (!today || !value) return <div className="mx-auto h-8 w-48 skeleton" />
  const yesterday = addDays(today, -1)
  const presets = [
    { day: today, label: 'Last night' },
    { day: yesterday, label: 'Night before' },
  ]
  const custom = !presets.some((p) => p.day === value)
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {presets.map((p) => (
        <button
          key={p.day}
          type="button"
          onClick={() => onChange(p.day)}
          aria-pressed={value === p.day}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            value === p.day ? 'border-primary/60 bg-primary/15 text-ink' : 'border-line text-muted hover:text-ink'
          }`}
        >
          {p.label}
        </button>
      ))}
      <label className={`relative rounded-full border px-3 py-1 text-xs font-medium transition ${custom ? 'border-primary/60 bg-primary/15 text-ink' : 'border-line text-muted hover:text-ink'}`}>
        {custom ? formatDay(value, { weekday: true }) : 'Earlier'}
        <input
          type="date"
          value={value}
          max={today}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Pick another date"
        />
      </label>
    </div>
  )
}

function Saving({ what, claudeReady }: { what: 'voice' | 'text'; claudeReady: boolean }) {
  const steps = [what === 'voice' ? 'Transcribing your voice note' : 'Saving your dream', claudeReady ? 'Pulling out the details' : null, claudeReady ? 'Checking earlier dreams for echoes' : null].filter(
    Boolean,
  ) as string[]
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), what === 'voice' ? 3500 : 2200)
    return () => clearInterval(t)
  }, [steps.length, what])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center" aria-live="polite">
      <div className="relative h-20 w-20">
        <span className="absolute inset-0 animate-breathe rounded-full border border-primary/50" />
        <span className="absolute inset-4 rounded-full bg-primary/25 blur-md" />
        <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto h-8 w-8 text-primary-bright" fill="currentColor" aria-hidden>
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        </svg>
      </div>
      <p className="heading mt-8 text-2xl">{steps[step]}…</p>
      <p className="mt-2 text-sm text-faint">Your words are saved first, so nothing gets lost if this takes a moment.</p>
    </div>
  )
}

function Review({ initial, claudeReady, onDone, onAnother }: { initial: LogResult; claudeReady: boolean; onDone: (id: string) => void; onAnother: () => void }) {
  const [result, setResult] = useState(initial)
  const [details, setDetails] = useState<DreamDetails>(() => detailsFrom(initial.entry))
  const [rawText, setRawText] = useState(initial.entry.raw_text)
  const [answers, setAnswers] = useState<string[]>(() => initial.questions.map(() => ''))
  const [busy, setBusy] = useState<'answers' | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const entry = result.entry
  const textChanged = rawText.trim() !== entry.raw_text.trim()

  // Answers get appended to the dream text itself, then Claude reruns so the
  // new detail flows into the summary, symbols and so on.
  async function addAnswers() {
    const lines = result.questions.map((q, i) => (answers[i]?.trim() ? `${q}\n${answers[i].trim()}` : null)).filter(Boolean)
    const base = rawText.trim()
    const next = lines.length ? `${base}\n\n${lines.join('\n\n')}` : base
    setBusy('answers')
    setError(null)
    try {
      const r = await postJson<LogResult>(`/api/dreams/${entry.id}/restructure`, { raw_text: next })
      setResult(r)
      setRawText(r.entry.raw_text)
      // Keep what the dreamer already typed in the life context and sleep fields.
      setDetails((d) => ({ ...detailsFrom(r.entry), was_lucid: d.was_lucid, sleep_quality_that_night: d.sleep_quality_that_night, life_context_note: d.life_context_note }))
      setAnswers(r.questions.map(() => ''))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function save() {
    setBusy('save')
    setError(null)
    try {
      await postJson(`/api/dreams/${entry.id}`, { ...details, ...(textChanged ? { raw_text: rawText } : {}) }, 'PATCH')
      onDone(entry.id)
    } catch (e) {
      setError((e as Error).message)
      setBusy(null)
    }
  }

  const hasAnswers = answers.some((a) => a.trim())

  return (
    <div className="mx-auto max-w-2xl animate-rise-in">
      <div className="flex items-center gap-2 text-sm text-calm">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 10.5l4 4 8-9" />
        </svg>
        Saved to your journal · {formatDay(entry.dream_date, { weekday: true })}
      </div>
      <h1 className="heading mt-3 text-3xl sm:text-4xl">Does this look right?</h1>
      <p className="mt-2 text-sm text-muted">
        {result.structureError ? 'Fill in whatever you remember.' : 'Claude pulled these out of what you said. Fix anything that is off, it all feeds your patterns.'}
      </p>

      {result.structureError && <p className="mt-5 rounded-xl border border-dawn/25 bg-dawn-soft px-4 py-3 text-sm text-dawn">{result.structureError}</p>}

      <Echoes result={result} />

      {result.questions.length > 0 && (
        <section className="card mt-6 p-5">
          <p className="label text-primary-bright">While it&apos;s fresh</p>
          <p className="mt-1 text-sm text-muted">A few things you might still remember. Skip any you don&apos;t.</p>
          <div className="mt-4 space-y-4">
            {result.questions.map((q, i) => (
              <div key={q}>
                <label htmlFor={`q-${i}`} className="block font-serif text-[1.02rem] italic text-ink/95">
                  {q}
                </label>
                <input
                  id={`q-${i}`}
                  value={answers[i] ?? ''}
                  onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
                  className="input mt-2"
                  placeholder="Whatever comes back…"
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={addAnswers} disabled={!hasAnswers || busy !== null || !claudeReady} className="btn-ghost mt-4">
            {busy === 'answers' ? 'Adding…' : 'Add to the dream'}
          </button>
        </section>
      )}

      <details className="group mt-6" open={entry.input_method === 'voice' || !entry.structured_at}>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <svg viewBox="0 0 20 20" className="h-4 w-4 transition group-open:rotate-90" fill="currentColor" aria-hidden>
            <path d="M7 5l6 5-6 5z" />
          </svg>
          {entry.input_method === 'voice' ? 'Transcript' : 'What you wrote'}
        </summary>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={Math.min(14, Math.max(4, Math.ceil(rawText.length / 70)))}
          className="input mt-3 resize-y font-serif text-[1rem] leading-[1.75]"
          aria-label="Dream text"
        />
        {entry.input_method === 'voice' && <p className="hint">Whisper does its best with sleepy voices. Fix any misheard words here.</p>}
      </details>

      <div className="hairline my-8" />

      <DreamDetailsFields value={details} onChange={setDetails} />

      {error && (
        <p role="alert" className="mt-5 text-sm text-unease">
          {error}
        </p>
      )}

      <div className="sticky bottom-20 z-10 mt-8 flex flex-col-reverse gap-2 rounded-2xl border border-line/70 bg-bg/90 p-2 backdrop-blur sm:flex-row sm:justify-between md:bottom-4">
        <button type="button" onClick={onAnother} className="btn-quiet" disabled={busy !== null}>
          Log another dream
        </button>
        <div className="flex gap-2">
          <Link href={`/entries/${entry.id}`} className="btn-ghost flex-1 sm:flex-none">
            Skip
          </Link>
          <button type="button" onClick={save} disabled={busy !== null} className="btn-primary flex-1 sm:flex-none">
            {busy === 'save' ? 'Saving…' : 'Looks right'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Echoes({ result }: { result: LogResult }) {
  const symbols = result.entry.recurring_symbols
  if (!result.entry.structured_at || !symbols.length) return null
  if (!result.echoes.length) {
    return (
      <p className="mt-6 rounded-2xl border border-line/70 bg-raised/40 px-4 py-3 text-sm text-muted">
        Nothing in this one has shown up in your journal before. If it comes back, you&apos;ll see it here.
      </p>
    )
  }
  return (
    <section className="mt-6 rounded-2xl border border-dawn/25 bg-dawn-soft p-4">
      <p className="label text-dawn/90">Seen before</p>
      <ul className="mt-2 space-y-1.5">
        {result.echoes.map((e) => (
          <li key={e.label} className="text-sm text-ink/90">
            <Link href={`/journal?symbol=${encodeURIComponent(e.label)}`} className="font-medium underline decoration-dawn/40 underline-offset-4 hover:decoration-dawn">
              {e.label}
            </Link>{' '}
            <span className="text-muted">
              {timesWord(e.count)} before, most recently {formatDay(e.lastDate)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  )
}

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
    </svg>
  )
}
