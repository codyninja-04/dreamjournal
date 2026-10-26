import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { AnalyzeButton } from '@/components/patterns/AnalyzeButton'
import { EmotionTrendChart } from '@/components/patterns/EmotionTrendChart'
import { RecurringElementCard } from '@/components/patterns/RecurringElementCard'
import { requireUser } from '@/lib/auth'
import { claudeAvailable } from '@/lib/claude/client'
import { addDays, formatDay, formatTimestamp, plural, toDay } from '@/lib/format'
import { countLabels, currentStreak, daysLogged, occurrenceStrip, sleepVsTone, toneByWeek } from '@/lib/patterns/stats'
import { analysisWindow } from '@/lib/patterns/window'
import { MIN_DREAMS_FOR_ANALYSIS, limitsFor } from '@/lib/plan'
import type { DreamEntry, PatternAnalysis } from '@/lib/types'

export const metadata: Metadata = { title: 'Patterns' }

const CHART_WEEKS = 12

export default async function PatternsPage() {
  const { supabase, user, plan } = await requireUser()
  const canAnalyze = limitsFor(plan).patterns && claudeAvailable()
  const today = toDay(new Date())

  const [dreams, { data: recent }, { data: analyses }] = await Promise.all([
    analysisWindow(supabase, user.id),
    supabase
      .from('dream_entries')
      .select('dream_date, emotions, sleep_quality_that_night')
      .eq('user_id', user.id)
      .gte('dream_date', addDays(today, -7 * CHART_WEEKS - 7))
      .order('dream_date', { ascending: false })
      .limit(600),
    supabase.from('pattern_analyses').select('*').eq('user_id', user.id).order('generated_at', { ascending: false }).limit(4),
  ])

  const recentRows = (recent ?? []) as Pick<DreamEntry, 'dream_date' | 'emotions' | 'sleep_quality_that_night'>[]
  const [latest, ...previous] = (analyses ?? []) as PatternAnalysis[]
  const weeks = toneByWeek(recentRows, CHART_WEEKS, today)
  const sleep = sleepVsTone(recentRows)
  const topEmotion = countLabels(dreams, 'emotions')[0]
  const lucid = dreams.filter((e) => e.was_lucid).length
  const localElements = countLabels(dreams, 'recurring_symbols').filter((c) => c.count >= 2).slice(0, 6)
  const newSince = latest ? dreams.filter((e) => e.logged_at > latest.generated_at).length : 0

  if (dreams.length === 0) {
    return (
      <div className="animate-rise-in">
        <PageHeader eyebrow="Patterns" title="Nothing to compare yet" />
        <div className="card px-6 py-14 text-center">
          <p className="heading text-2xl">Patterns need a few mornings</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Log a dream on as many mornings as you can. After {MIN_DREAMS_FOR_ANALYSIS} or so, this page starts showing what keeps coming back and how it lines up with what&apos;s going on in your life.
          </p>
          <Link href="/log" className="btn-primary mt-6">
            Log a dream
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise-in">
      <PageHeader
        eyebrow="Patterns"
        title={`Based on your last ${plural(dreams.length, 'dream')}`}
        sub={`${formatDay(dreams[0].dream_date, { year: true })} to ${formatDay(dreams[dreams.length - 1].dream_date, { year: true })}. Counting what repeats, not guessing what it means.`}
        action={
          canAnalyze ? (
            <AnalyzeButton label={latest ? 'Run it again' : 'Find patterns'} disabled={dreams.length < MIN_DREAMS_FOR_ANALYSIS} />
          ) : !limitsFor(plan).patterns ? (
            <span className="chip border-primary/40 text-primary-bright">Pattern analysis comes with Pro</span>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Last 30 days" value={`${daysLogged(recentRows, 30, today)}`} unit="mornings logged" />
        <Stat label="Streak" value={`${currentStreak(recentRows, today)}`} unit="days in a row" />
        <Stat label="Felt most" value={topEmotion?.label ?? 'n/a'} unit={topEmotion ? `in ${plural(topEmotion.count, 'dream')}` : 'no emotions tagged'} />
        <Stat label="Lucid" value={`${lucid}`} unit={`of the last ${dreams.length}`} />
      </div>

      {latest?.grounded_observation && (
        <section className="relative mt-10 overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-surface/80 via-raised/80 to-deep/80 p-6 sm:p-8">
          <span aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <p className="label text-primary-bright">What this might reflect</p>
          <p className="relative mt-3 font-serif text-[1.2rem] leading-[1.7] text-ink sm:text-[1.3rem]">{latest.grounded_observation}</p>
          <p className="relative mt-5 text-xs text-faint">
            Read from {plural(latest.based_on_entries, 'dream')} on {formatTimestamp(latest.generated_at)}
            {newSince > 0 && ` · ${plural(newSince, 'new dream')} since then`}. A description of patterns in your entries, not a diagnosis or an interpretation.
          </p>
        </section>
      )}

      {dreams.length < MIN_DREAMS_FOR_ANALYSIS && (
        <p className="mt-8 rounded-2xl border border-line/70 bg-raised/40 px-4 py-3 text-sm text-muted">
          {plural(MIN_DREAMS_FOR_ANALYSIS - dreams.length, 'more dream')} with details and there&apos;s enough to look for patterns.
        </p>
      )}

      <section className="mt-10">
        <SectionTitle>Recurring elements</SectionTitle>
        {latest && latest.recurring_elements.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {latest.recurring_elements.map((el) => {
              const strip = occurrenceStrip(el.labels, dreams)
              const seen = strip.filter(Boolean).length
              return (
                <RecurringElementCard
                  key={el.element}
                  element={el.element}
                  frequency={seen || el.frequency}
                  total={dreams.length}
                  note={el.note}
                  strip={strip}
                  filterLabel={el.labels[0]}
                />
              )
            })}
          </div>
        ) : localElements.length > 0 ? (
          <>
            {latest && <p className="mb-3 text-sm text-muted">The last analysis didn&apos;t find anything repeating. Here&apos;s the raw count from your entries.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {localElements.map((c) => (
                <RecurringElementCard key={c.label} element={c.label} frequency={c.count} total={dreams.length} strip={occurrenceStrip([c.label], dreams)} filterLabel={c.label} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Nothing has come up more than once yet. Give it a few more mornings.</p>
        )}
      </section>

      <section className="mt-10 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5 sm:p-6">
          <h2 className="heading text-xl">How your dreams have felt</h2>
          <p className="mb-5 mt-1 text-sm text-muted">Dreams per week over the last {CHART_WEEKS} weeks, by the emotions you tagged.</p>
          <EmotionTrendChart weeks={weeks} />
        </div>
        <div className="flex flex-col gap-3">
          {latest?.emotional_trends && (
            <div className="card p-5">
              <p className="label">Emotional trend</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/90">{latest.emotional_trends}</p>
            </div>
          )}
          <SleepCard sleep={sleep} />
        </div>
      </section>

      {previous.length > 0 && (
        <section className="mt-10">
          <SectionTitle>Earlier reads</SectionTitle>
          <div className="space-y-3">
            {previous.map((a) => (
              <details key={a.id} className="card group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm">
                  <span className="text-ink/90">
                    {a.period_start && a.period_end ? `${formatDay(a.period_start)} to ${formatDay(a.period_end, { year: true })}` : formatTimestamp(a.generated_at)}
                  </span>
                  <span className="text-xs text-faint group-open:hidden">{plural(a.based_on_entries, 'dream')}</span>
                </summary>
                {a.grounded_observation && <p className="mt-3 font-serif leading-relaxed text-ink/85">{a.grounded_observation}</p>}
                {a.recurring_elements.length > 0 && (
                  <p className="mt-3 text-xs text-muted">Recurring then: {a.recurring_elements.map((el) => `${el.element} (${el.frequency})`).join(', ')}</p>
                )}
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="label mb-4 flex items-center gap-3">
      {children}
      <span className="hairline flex-1" />
    </h2>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <p className="mt-2 truncate font-serif text-3xl capitalize text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-faint">{unit}</p>
    </div>
  )
}

function SleepCard({ sleep }: { sleep: ReturnType<typeof sleepVsTone> }) {
  const poor = sleep.rows[0]
  const good = sleep.rows[2]
  return (
    <div className="card p-5">
      <p className="label">Sleep and dream tone</p>
      {sleep.enough ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-ink/90">
            On rough or restless nights, {Math.round(poor.negativeShare * 100)}% of your dreams felt heavy. On good nights, {Math.round(good.negativeShare * 100)}%.
          </p>
          <div className="mt-4 space-y-2.5">
            {sleep.rows
              .filter((r) => r.count > 0)
              .map((r) => (
                <div key={r.key}>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{r.label}</span>
                    <span className="font-mono">{Math.round(r.negativeShare * 100)}% heavy</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-line/60">
                    <div className="h-full rounded-full bg-[#D9578F]" style={{ width: `${Math.max(2, r.negativeShare * 100)}%` }} />
                  </div>
                </div>
              ))}
          </div>
          <p className="mt-3 text-xs text-faint">Correlation from your own entries, not cause and effect.</p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-muted">Rate your sleep when you log. Once there are a few rough nights and a few good ones, you&apos;ll see whether they line up with how your dreams felt.</p>
      )}
    </div>
  )
}
