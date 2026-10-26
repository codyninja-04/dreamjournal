import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EntryView } from '@/components/journal/EntryView'
import { requireUser } from '@/lib/auth'
import { claudeAvailable } from '@/lib/claude/client'
import { excerpt, formatDay, timesWord } from '@/lib/format'
import { normalizeLabel } from '@/lib/patterns/labels'
import type { DreamEntry } from '@/lib/types'
import { UUID } from '@/lib/validate'

export const metadata: Metadata = { title: 'Dream' }

export default async function EntryPage({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound()
  const { supabase, user } = await requireUser()

  const { data } = await supabase.from('dream_entries').select('*').eq('id', params.id).eq('user_id', user.id).maybeSingle()
  if (!data) notFound()
  const entry = data as DreamEntry

  // Other dreams that share a symbol with this one.
  let related: { entry: DreamEntry; shared: string[] }[] = []
  const symbolCounts = new Map<string, number>()
  if (entry.recurring_symbols.length) {
    const { data: others } = await supabase
      .from('dream_entries')
      .select('*')
      .eq('user_id', user.id)
      .neq('id', entry.id)
      .overlaps('recurring_symbols', entry.recurring_symbols)
      .order('dream_date', { ascending: false })
      .limit(100)
    const mine = new Set(entry.recurring_symbols.map(normalizeLabel))
    related = ((others ?? []) as DreamEntry[]).map((o) => ({ entry: o, shared: o.recurring_symbols.filter((s) => mine.has(normalizeLabel(s))) }))
    for (const r of related) for (const s of r.shared) symbolCounts.set(s, (symbolCounts.get(s) ?? 0) + 1)
    related.sort((a, b) => b.shared.length - a.shared.length || b.entry.dream_date.localeCompare(a.entry.dream_date))
  }
  const repeating = [...symbolCounts.entries()].sort((a, b) => b[1] - a[1])

  return (
    <div className="animate-rise-in">
      <Link href="/journal" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M12 5l-5 5 5 5" />
        </svg>
        Journal
      </Link>

      <EntryView entry={entry} claudeReady={claudeAvailable()} />

      {repeating.length > 0 && (
        <section className="mt-12">
          <h2 className="label mb-3 flex items-center gap-3">
            Echoes in your journal
            <span className="hairline flex-1" />
          </h2>
          <p className="mb-4 text-sm text-muted">
            {repeating.slice(0, 4).map(([label, n], i) => (
              <span key={label}>
                {i > 0 && (i === Math.min(repeating.length, 4) - 1 ? ' and ' : ', ')}
                <Link href={`/journal?symbol=${encodeURIComponent(label)}`} className="font-medium text-ink underline decoration-strong underline-offset-4 hover:decoration-primary">
                  {label}
                </Link>{' '}
                {timesWord(n)}
              </span>
            ))}{' '}
            in other dreams.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.slice(0, 6).map(({ entry: o, shared }) => (
              <Link key={o.id} href={`/entries/${o.id}`} className="card block p-4 transition hover:border-strong/80">
                <p className="font-mono text-xs text-faint">{formatDay(o.dream_date, { year: true })}</p>
                <p className="mt-1.5 font-serif text-[0.98rem] leading-relaxed text-ink/90">{excerpt(o.summary ?? o.raw_text, 140)}</p>
                <p className="mt-2 text-xs text-dawn/90">Shares {shared.join(', ')}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
