import type { Metadata } from 'next'
import Link from 'next/link'
import { DreamEntryCard } from '@/components/journal/DreamEntryCard'
import { EmotionTag, LabelTag } from '@/components/journal/EmotionTag'
import { PageHeader } from '@/components/layout/PageHeader'
import { requireUser } from '@/lib/auth'
import { formatMonth, plural } from '@/lib/format'
import { normalizeLabel } from '@/lib/patterns/labels'
import { countLabels } from '@/lib/patterns/stats'
import { limitsFor } from '@/lib/plan'
import type { DreamEntry } from '@/lib/types'

export const metadata: Metadata = { title: 'Journal' }

const PAGE_SIZE = 25

type Search = { q?: string; emotion?: string; symbol?: string; lucid?: string; page?: string }

function href(base: Search, change: Partial<Search>): string {
  const merged = { ...base, page: undefined, ...change }
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v)
  const qs = params.toString()
  return qs ? `/journal?${qs}` : '/journal'
}

export default async function JournalPage({ searchParams }: { searchParams: Search }) {
  const { supabase, user, plan } = await requireUser()
  const canSearch = limitsFor(plan).search

  const q = (searchParams.q ?? '').trim().slice(0, 200)
  const emotion = searchParams.emotion ? normalizeLabel(searchParams.emotion) : ''
  const symbol = searchParams.symbol ? normalizeLabel(searchParams.symbol) : ''
  const lucid = searchParams.lucid === '1'
  const page = Math.max(1, Math.min(200, Number(searchParams.page) || 1))
  const filtering = !!(q || emotion || symbol || lucid)

  let query = supabase
    .from('dream_entries')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('dream_date', { ascending: false })
    .order('logged_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (q && canSearch) query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
  if (emotion) query = query.contains('emotions', [emotion])
  if (symbol) query = query.contains('recurring_symbols', [symbol])
  if (lucid) query = query.eq('was_lucid', true)

  // Recent labels to offer as one tap filters.
  const [{ data, count, error }, { data: recent }] = await Promise.all([
    query,
    supabase.from('dream_entries').select('dream_date, emotions, recurring_symbols, people_present').eq('user_id', user.id).order('dream_date', { ascending: false }).limit(120),
  ])
  const entries = (data ?? []) as DreamEntry[]
  const total = count ?? 0
  const recentRows = (recent ?? []) as Pick<DreamEntry, 'dream_date' | 'emotions' | 'recurring_symbols' | 'people_present'>[]
  const topEmotions = countLabels(recentRows, 'emotions').filter((c) => c.count >= 2).slice(0, 6)
  const topSymbols = countLabels(recentRows, 'recurring_symbols').filter((c) => c.count >= 2).slice(0, 8)

  const months: { month: string; entries: DreamEntry[] }[] = []
  for (const e of entries) {
    const m = formatMonth(e.dream_date)
    const last = months[months.length - 1]
    if (last?.month === m) last.entries.push(e)
    else months.push({ month: m, entries: [e] })
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="animate-rise-in">
      <PageHeader
        eyebrow="Journal"
        title="Every dream you've caught"
        sub={filtering ? `${plural(total, 'dream')} match` : total ? `${plural(total, 'dream')} so far.` : undefined}
        action={
          <Link href="/log" className="btn-primary">
            Log a dream
          </Link>
        }
      />

      <form action="/journal" className="flex gap-2">
        {emotion && <input type="hidden" name="emotion" value={emotion} />}
        {symbol && <input type="hidden" name="symbol" value={symbol} />}
        {lucid && <input type="hidden" name="lucid" value="1" />}
        <label htmlFor="q" className="sr-only">
          Search your dreams
        </label>
        <input id="q" name="q" defaultValue={q} placeholder={canSearch ? 'Search every word you wrote…' : 'Full search comes with Pro'} disabled={!canSearch} className="input" type="search" />
        <button className="btn-ghost" disabled={!canSearch}>
          Search
        </button>
      </form>

      {(filtering || topEmotions.length > 0 || topSymbols.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {filtering ? (
            <>
              <span className="mr-1 text-xs text-faint">Showing</span>
              {q && <span className="chip text-ink">&ldquo;{q}&rdquo;</span>}
              {emotion && <EmotionTag emotion={emotion} />}
              {symbol && <LabelTag label={symbol} />}
              {lucid && <span className="chip border-dawn/30 bg-dawn-soft text-dawn">lucid only</span>}
              <Link href="/journal" className="ml-1 text-xs font-medium text-muted underline underline-offset-4 hover:text-ink">
                Clear
              </Link>
            </>
          ) : (
            <>
              <span className="mr-1 text-xs text-faint">Comes up often</span>
              {topEmotions.map((c) => (
                <EmotionTag key={`e-${c.label}`} emotion={c.label} href={href(searchParams, { emotion: c.label })} />
              ))}
              {topSymbols.map((c) => (
                <LabelTag key={`s-${c.label}`} label={c.label} href={href(searchParams, { symbol: c.label })} />
              ))}
              <Link href={href(searchParams, { lucid: '1' })} className="chip border-dawn/30 bg-dawn-soft text-dawn hover:brightness-125">
                lucid
              </Link>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-8 text-sm text-unease">Couldn&apos;t load your journal. Refresh to try again.</p>}

      {!error && entries.length === 0 && (
        <div className="card mt-10 px-6 py-14 text-center">
          {filtering ? (
            <>
              <p className="heading text-2xl">Nothing matches that</p>
              <p className="mt-2 text-sm text-muted">Try fewer words, or clear the filters.</p>
            </>
          ) : (
            <>
              <p className="heading text-2xl">Your journal is empty</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Tomorrow morning, before you check your phone for anything else, open this and say what you remember.</p>
              <Link href="/log" className="btn-primary mt-6">
                Log your first dream
              </Link>
            </>
          )}
        </div>
      )}

      <div className="mt-8 space-y-10">
        {months.map((m) => (
          <section key={m.month}>
            <h2 className="label mb-3 flex items-center gap-3">
              {m.month}
              <span className="hairline flex-1" />
            </h2>
            <div className="space-y-3">
              {m.entries.map((e) => (
                <DreamEntryCard key={e.id} entry={e} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-between" aria-label="Pages">
          {page > 1 ? (
            <Link href={href(searchParams, { page: String(page - 1) })} className="btn-ghost">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs text-faint">
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={href(searchParams, { page: String(page + 1) })} className="btn-ghost">
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}
