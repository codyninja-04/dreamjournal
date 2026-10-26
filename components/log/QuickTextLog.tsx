'use client'

import { useEffect, useRef } from 'react'

// Plain textarea that grows with the dream. Cmd or Ctrl + Enter saves, so
// you never need to find the button on a phone keyboard with a laptop open.
export function QuickTextLog({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(220, el.scrollHeight)}px`
  }, [value])

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const words = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <div className="card p-1.5">
      <label htmlFor="dream-text" className="sr-only">
        Describe your dream
      </label>
      <textarea
        id="dream-text"
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && value.trim()) {
            e.preventDefault()
            onSubmit()
          }
        }}
        placeholder="I was in a house I didn't recognise, but it felt like mine…"
        className="block w-full resize-none rounded-xl bg-transparent px-4 py-4 font-serif text-[1.08rem] leading-[1.8] text-ink placeholder:italic placeholder:text-faint/70 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3 border-t border-line/60 px-3 pb-1.5 pt-2.5">
        <span className="font-mono text-xs text-faint">
          {words} {words === 1 ? 'word' : 'words'}
          <span className="hidden sm:inline"> · ⌘/Ctrl + Enter to save</span>
        </span>
        <button type="button" onClick={onSubmit} disabled={disabled || !value.trim()} className="btn-primary">
          Save dream
        </button>
      </div>
    </div>
  )
}
