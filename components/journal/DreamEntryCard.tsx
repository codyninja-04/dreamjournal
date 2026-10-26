import Link from 'next/link'
import { excerpt, formatDay } from '@/lib/format'
import type { DreamEntry } from '@/lib/types'
import { EmotionTag, LabelTag } from './EmotionTag'

export function DreamEntryCard({ entry }: { entry: DreamEntry }) {
  const text = entry.summary ?? entry.raw_text
  return (
    <article className="card group relative p-5 transition hover:border-strong/80">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs text-faint">{formatDay(entry.dream_date, { weekday: true })}</p>
        <div className="flex items-center gap-1.5">
          {entry.was_lucid && <span className="chip border-dawn/30 bg-dawn-soft py-0.5 text-dawn">lucid</span>}
          {entry.input_method === 'voice' && (
            <span className="text-faint" title="Logged by voice">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-label="Logged by voice">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
              </svg>
            </span>
          )}
        </div>
      </div>
      <h2 className="mt-2.5">
        <Link href={`/entries/${entry.id}`} className="font-serif text-[1.05rem] leading-relaxed text-ink/95 after:absolute after:inset-0 after:rounded-2xl group-hover:text-ink">
          {excerpt(text, 240)}
        </Link>
      </h2>
      {(entry.emotions.length > 0 || entry.recurring_symbols.length > 0) && (
        // Above the stretched link so the tags stay clickable as filters.
        <div className="relative z-10 mt-3.5 flex flex-wrap gap-1.5">
          {entry.emotions.slice(0, 3).map((e) => (
            <EmotionTag key={`e-${e}`} emotion={e} href={`/journal?emotion=${encodeURIComponent(e)}`} />
          ))}
          {entry.recurring_symbols.slice(0, 4).map((s) => (
            <LabelTag key={`s-${s}`} label={s} href={`/journal?symbol=${encodeURIComponent(s)}`} />
          ))}
        </div>
      )}
      {!entry.structured_at && <p className="mt-3 text-xs text-faint">No details pulled out yet</p>}
    </article>
  )
}
