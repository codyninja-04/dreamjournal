'use client'

import { useState } from 'react'
import { normalizeLabel } from '@/lib/patterns/labels'
import { EmotionTag, LabelTag } from '../journal/EmotionTag'

// A row of removable tags with a small input on the end. Enter or comma adds,
// Backspace on an empty input removes the last one.
export function TagEditor({
  label,
  hint,
  values,
  onChange,
  kind = 'label',
  placeholder,
  max = 15,
}: {
  label: string
  hint?: string
  values: string[]
  onChange: (next: string[]) => void
  kind?: 'emotion' | 'label'
  placeholder: string
  max?: number
}) {
  const [draft, setDraft] = useState('')
  const id = `tags-${label.toLowerCase().replace(/\s+/g, '-')}`

  function add(raw: string) {
    const next = raw
      .split(',')
      .map(normalizeLabel)
      .filter((v) => v && v.length <= 48 && !values.includes(v))
    if (next.length) onChange([...values, ...next].slice(0, max))
    setDraft('')
  }

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="flex min-h-[2.9rem] flex-wrap items-center gap-1.5 rounded-xl border border-line bg-deep/60 px-2.5 py-2 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
        {values.map((v) =>
          kind === 'emotion' ? (
            <EmotionTag key={v} emotion={v} onRemove={() => onChange(values.filter((x) => x !== v))} />
          ) : (
            <LabelTag key={v} label={v} onRemove={() => onChange(values.filter((x) => x !== v))} />
          ),
        )}
        {values.length < max && (
          <input
            id={id}
            value={draft}
            onChange={(e) => {
              const v = e.target.value
              if (v.endsWith(',')) add(v)
              else setDraft(v)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (draft.trim()) add(draft)
              } else if (e.key === 'Backspace' && !draft && values.length) {
                onChange(values.slice(0, -1))
              }
            }}
            onBlur={() => draft.trim() && add(draft)}
            placeholder={values.length ? 'Add another' : placeholder}
            className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-ink placeholder:text-faint/80 focus:outline-none"
          />
        )}
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}
