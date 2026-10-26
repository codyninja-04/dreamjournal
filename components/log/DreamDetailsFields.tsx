'use client'

import { SLEEP_LABELS } from '@/lib/types'
import { TagEditor } from './TagEditor'

export interface DreamDetails {
  summary: string
  emotions: string[]
  recurring_symbols: string[]
  people_present: string[]
  setting: string
  was_lucid: boolean
  sleep_quality_that_night: number | null
  life_context_note: string
}

export function detailsFrom(e: {
  summary: string | null
  emotions: string[]
  recurring_symbols: string[]
  people_present: string[]
  setting: string | null
  was_lucid: boolean
  sleep_quality_that_night: number | null
  life_context_note: string | null
}): DreamDetails {
  return {
    summary: e.summary ?? '',
    emotions: e.emotions,
    recurring_symbols: e.recurring_symbols,
    people_present: e.people_present,
    setting: e.setting ?? '',
    was_lucid: e.was_lucid,
    sleep_quality_that_night: e.sleep_quality_that_night,
    life_context_note: e.life_context_note ?? '',
  }
}

// The editable details of a dream. Used on the log screen right after saving,
// and on an entry when you want to correct something later.
export function DreamDetailsFields({ value, onChange }: { value: DreamDetails; onChange: (next: DreamDetails) => void }) {
  const set = <K extends keyof DreamDetails>(key: K, v: DreamDetails[K]) => onChange({ ...value, [key]: v })

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="summary" className="field-label">
          Summary
        </label>
        <textarea id="summary" rows={3} value={value.summary} onChange={(e) => set('summary', e.target.value)} className="input resize-y leading-relaxed" placeholder="A couple of plain sentences about what happened." />
      </div>

      <TagEditor label="How it felt" kind="emotion" values={value.emotions} onChange={(v) => set('emotions', v)} placeholder="anxious, relieved…" max={12} />

      <TagEditor
        label="Symbols and themes"
        values={value.recurring_symbols}
        onChange={(v) => set('recurring_symbols', v)}
        placeholder="exam, flooded house, being chased…"
        hint="Short, general labels match better over time. “Exam” will line up with next month's exam dream, “calculus final in Hall B” won't."
        max={20}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TagEditor label="People" values={value.people_present} onChange={(v) => set('people_present', v)} placeholder="my sister, strangers…" />
        <div>
          <label htmlFor="setting" className="field-label">
            Setting
          </label>
          <input id="setting" value={value.setting} onChange={(e) => set('setting', e.target.value)} className="input" placeholder="old school, a train, grandma's flat…" maxLength={120} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        <fieldset>
          <legend className="field-label">How did you sleep?</legend>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = value.sleep_quality_that_night === n
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set('sleep_quality_that_night', active ? null : n)}
                  className={`flex min-w-[4.4rem] flex-col items-center rounded-xl border px-2.5 py-2 text-xs transition ${
                    active ? 'border-primary bg-primary/15 text-ink' : 'border-line bg-deep/40 text-muted hover:border-strong hover:text-ink'
                  }`}
                >
                  <SleepDots n={n} />
                  <span className="mt-1 font-medium">{SLEEP_LABELS[n]}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
        <div>
          <span className="field-label">Lucid?</span>
          <button
            type="button"
            role="switch"
            aria-checked={value.was_lucid}
            onClick={() => set('was_lucid', !value.was_lucid)}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${value.was_lucid ? 'border-dawn/50 bg-dawn-soft text-dawn' : 'border-line bg-deep/40 text-muted hover:text-ink'}`}
          >
            <span className={`relative h-5 w-9 rounded-full transition ${value.was_lucid ? 'bg-dawn/80' : 'bg-line'}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-all ${value.was_lucid ? 'left-[1.15rem]' : 'left-0.5'}`} />
            </span>
            I knew I was dreaming
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-dawn/20 bg-dawn-soft p-4">
        <label htmlFor="context" className="field-label text-dawn">
          What&apos;s going on in your life right now?
        </label>
        <textarea
          id="context"
          rows={2}
          value={value.life_context_note}
          onChange={(e) => set('life_context_note', e.target.value)}
          className="input resize-y border-dawn/20 bg-deep/50 leading-relaxed focus:border-dawn focus:ring-dawn/15"
          placeholder="Deadline on Friday, moving house, started a new job…"
          maxLength={2000}
        />
        <p className="hint">Optional, but this is what turns a list of dreams into patterns you can actually read.</p>
      </div>
    </div>
  )
}

export function SleepDots({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= n ? 'bg-primary-bright' : 'bg-line'}`} />
      ))}
    </span>
  )
}
