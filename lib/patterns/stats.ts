import { addDays, parseDay } from '../format'
import type { DreamEntry, Echo, RecurringElement } from '../types'
import { normalizeLabel, toneOf, valenceOf, type Tone } from './labels'

// Everything here is plain counting over the entries, no AI. The patterns page
// leans on these numbers, and the Claude analysis is given them as ground truth.

type Countable = Pick<DreamEntry, 'dream_date' | 'emotions' | 'recurring_symbols' | 'people_present'>

export interface LabelCount {
  label: string
  count: number
  lastDate: string
}

export function countLabels(entries: Countable[], key: 'emotions' | 'recurring_symbols' | 'people_present'): LabelCount[] {
  const map = new Map<string, LabelCount>()
  for (const e of entries) {
    // A label counts once per dream, however often it's repeated in it.
    for (const label of new Set((e[key] ?? []).map(normalizeLabel).filter(Boolean))) {
      const prev = map.get(label)
      if (!prev) map.set(label, { label, count: 1, lastDate: e.dream_date })
      else {
        prev.count++
        if (e.dream_date > prev.lastDate) prev.lastDate = e.dream_date
      }
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate) || a.label.localeCompare(b.label))
}

// Symbols in a new dream that already showed up in earlier ones.
export function findEchoes(symbols: string[], earlier: Pick<DreamEntry, 'dream_date' | 'recurring_symbols'>[]): Echo[] {
  const wanted = new Set(symbols.map(normalizeLabel))
  const counts = countLabels(
    earlier.map((e) => ({ ...e, emotions: [], people_present: [] })),
    'recurring_symbols',
  ).filter((c) => wanted.has(c.label))
  return counts.slice(0, 5)
}

export function entryHasAny(entry: Pick<DreamEntry, 'recurring_symbols' | 'people_present' | 'emotions' | 'setting'>, labels: string[]): boolean {
  if (!labels.length) return false
  const wanted = new Set(labels.map(normalizeLabel))
  const own = [...entry.recurring_symbols, ...entry.people_present, ...entry.emotions, entry.setting ?? ''].map(normalizeLabel)
  return own.some((l) => wanted.has(l))
}

// Claude groups labels into elements ("exam" and "test" into "exams") and
// reports a frequency. Recount it from the entries so the number shown is
// always true, falling back to Claude's count clamped to the window size.
export function reconcileElements(elements: RecurringElement[], entries: DreamEntry[]): RecurringElement[] {
  return elements
    .map((el) => {
      const matched = entries.filter((e) => entryHasAny(e, el.labels)).length
      const frequency = matched > 0 ? matched : Math.min(Math.max(0, Math.round(el.frequency)), entries.length)
      return { ...el, frequency }
    })
    .filter((el) => el.frequency >= 2)
    .sort((a, b) => b.frequency - a.frequency)
}

// One cell per dream in the window, oldest first, lit when the element appears.
export function occurrenceStrip(labels: string[], entriesOldestFirst: DreamEntry[]): boolean[] {
  return entriesOldestFirst.map((e) => entryHasAny(e, labels))
}

export interface ToneWeek {
  weekStart: string
  label: string
  positive: number
  negative: number
  mixed: number
  neutral: number
}

// Monday of the week a day falls in.
export function weekStart(day: string): string {
  const d = parseDay(day)
  const offset = (d.getUTCDay() + 6) % 7
  return addDays(day, -offset)
}

export function toneByWeek(entries: Pick<DreamEntry, 'dream_date' | 'emotions'>[], weeks: number, today: string): ToneWeek[] {
  const lastWeek = weekStart(today)
  const out: ToneWeek[] = []
  const index = new Map<string, ToneWeek>()
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = addDays(lastWeek, -7 * i)
    const row: ToneWeek = {
      weekStart: ws,
      label: parseDay(ws).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' }),
      positive: 0,
      negative: 0,
      mixed: 0,
      neutral: 0,
    }
    out.push(row)
    index.set(ws, row)
  }
  for (const e of entries) {
    const row = index.get(weekStart(e.dream_date))
    if (!row) continue
    const tone: Tone = toneOf(e.emotions)
    if (tone === 'unknown') continue
    row[tone]++
  }
  return out
}

export interface SleepToneGroup {
  key: 'poor' | 'okay' | 'good'
  label: string
  count: number
  negativeShare: number
}

// Do rough nights line up with heavier dreams? Only meaningful with a few
// entries in each group, so callers should check `enough` before showing it.
export function sleepVsTone(entries: Pick<DreamEntry, 'sleep_quality_that_night' | 'emotions'>[]) {
  const groups: Record<SleepToneGroup['key'], { label: string; total: number; heavy: number }> = {
    poor: { label: 'Rough or restless nights', total: 0, heavy: 0 },
    okay: { label: 'Okay nights', total: 0, heavy: 0 },
    good: { label: 'Good or deep nights', total: 0, heavy: 0 },
  }
  for (const e of entries) {
    const q = e.sleep_quality_that_night
    if (q == null) continue
    const tone = toneOf(e.emotions)
    if (tone === 'unknown') continue
    const key = q <= 2 ? 'poor' : q === 3 ? 'okay' : 'good'
    groups[key].total++
    if (tone === 'negative' || tone === 'mixed') groups[key].heavy++
  }
  const rows: SleepToneGroup[] = (Object.keys(groups) as SleepToneGroup['key'][]).map((key) => ({
    key,
    label: groups[key].label,
    count: groups[key].total,
    negativeShare: groups[key].total ? groups[key].heavy / groups[key].total : 0,
  }))
  const poor = rows[0]
  const good = rows[2]
  return { rows, enough: poor.count >= 3 && good.count >= 3 }
}

// How many distinct days in the last `days` had at least one dream logged.
export function daysLogged(entries: Pick<DreamEntry, 'dream_date'>[], days: number, today: string): number {
  const from = addDays(today, -(days - 1))
  return new Set(entries.map((e) => e.dream_date).filter((d) => d >= from && d <= today)).size
}

// Consecutive days with an entry, counting back from today (or yesterday, so
// the streak doesn't reset before you've had a chance to log this morning).
export function currentStreak(entries: Pick<DreamEntry, 'dream_date'>[], today: string): number {
  const days = new Set(entries.map((e) => e.dream_date))
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function emotionSplit(entries: Pick<DreamEntry, 'emotions'>[]) {
  let positive = 0
  let negative = 0
  let neutral = 0
  for (const e of entries) for (const em of e.emotions) {
    const v = valenceOf(em)
    if (v === 'positive') positive++
    else if (v === 'negative') negative++
    else neutral++
  }
  return { positive, negative, neutral }
}

