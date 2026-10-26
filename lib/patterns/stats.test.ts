import { describe, expect, it } from 'vitest'
import type { DreamEntry } from '../types'
import { countLabels, currentStreak, daysLogged, findEchoes, occurrenceStrip, reconcileElements, sleepVsTone, toneByWeek, weekStart } from './stats'

function dream(date: string, over: Partial<DreamEntry> = {}): DreamEntry {
  return {
    id: date + Math.random(),
    user_id: 'u',
    dream_date: date,
    logged_at: `${date}T07:00:00Z`,
    updated_at: `${date}T07:00:00Z`,
    raw_text: 'a dream',
    input_method: 'text',
    summary: null,
    emotions: [],
    recurring_symbols: [],
    people_present: [],
    setting: null,
    structured_at: `${date}T07:00:00Z`,
    was_lucid: false,
    sleep_quality_that_night: null,
    life_context_note: null,
    ...over,
  }
}

describe('countLabels', () => {
  it('counts each label once per dream and sorts by frequency', () => {
    const entries = [
      dream('2026-10-01', { recurring_symbols: ['exam', 'Exam', 'water'] }),
      dream('2026-10-05', { recurring_symbols: ['exam'] }),
      dream('2026-10-03', { recurring_symbols: ['dog'] }),
    ]
    const counts = countLabels(entries, 'recurring_symbols')
    expect(counts[0]).toEqual({ label: 'exam', count: 2, lastDate: '2026-10-05' })
    expect(counts.map((c) => c.label)).toEqual(['exam', 'dog', 'water'])
  })
})

describe('findEchoes', () => {
  it('only reports symbols from the new dream that appeared before', () => {
    const earlier = [dream('2026-10-01', { recurring_symbols: ['exam', 'dog'] }), dream('2026-10-08', { recurring_symbols: ['exam'] })]
    expect(findEchoes(['exam', 'train'], earlier)).toEqual([{ label: 'exam', count: 2, lastDate: '2026-10-08' }])
  })
})

describe('reconcileElements', () => {
  const entries = [
    dream('2026-10-01', { recurring_symbols: ['exam'] }),
    dream('2026-10-02', { recurring_symbols: ['test'] }),
    dream('2026-10-03', { recurring_symbols: ['dog'] }),
  ]

  it('recounts frequency from the grouped labels instead of trusting Claude', () => {
    const out = reconcileElements([{ element: 'exams', labels: ['exam', 'test'], frequency: 9, note: '' }], entries)
    expect(out[0].frequency).toBe(2)
  })

  it('clamps an unmatched frequency to the window and drops one-offs', () => {
    const out = reconcileElements(
      [
        { element: 'falling', labels: ['nothing like it'], frequency: 40, note: '' },
        { element: 'dog', labels: ['dog'], frequency: 1, note: '' },
      ],
      entries,
    )
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ element: 'falling', frequency: 3 })
  })
})

describe('occurrenceStrip', () => {
  it('lights the cells for dreams containing the element, matching people and settings too', () => {
    const entries = [dream('2026-10-01', { recurring_symbols: ['exam'] }), dream('2026-10-02'), dream('2026-10-03', { setting: 'Old School' })]
    expect(occurrenceStrip(['exam', 'old school'], entries)).toEqual([true, false, true])
  })
})

describe('weeks', () => {
  it('finds the Monday of the week', () => {
    expect(weekStart('2026-10-26')).toBe('2026-10-26') // Monday
    expect(weekStart('2026-11-01')).toBe('2026-10-26') // Sunday
  })

  it('buckets dreams into weeks by tone, oldest first', () => {
    const weeks = toneByWeek(
      [
        { dream_date: '2026-10-27', emotions: ['anxious'] },
        { dream_date: '2026-10-28', emotions: ['happy'] },
        { dream_date: '2026-10-21', emotions: ['afraid', 'relieved'] },
        { dream_date: '2026-10-22', emotions: [] },
        { dream_date: '2026-01-01', emotions: ['happy'] },
      ],
      2,
      '2026-10-29',
    )
    expect(weeks.map((w) => w.weekStart)).toEqual(['2026-10-19', '2026-10-26'])
    expect(weeks[0]).toMatchObject({ mixed: 1, positive: 0, negative: 0 })
    expect(weeks[1]).toMatchObject({ negative: 1, positive: 1 })
  })
})

describe('sleepVsTone', () => {
  it('needs enough nights on both ends before it says anything', () => {
    const few = sleepVsTone([{ sleep_quality_that_night: 1, emotions: ['afraid'] }])
    expect(few.enough).toBe(false)
  })

  it('compares the share of heavy dreams on rough and good nights', () => {
    const rough = Array.from({ length: 4 }, (_, i) => ({ sleep_quality_that_night: 2, emotions: i < 3 ? ['anxious'] : ['calm'] }))
    const good = Array.from({ length: 4 }, (_, i) => ({ sleep_quality_that_night: 5, emotions: i < 1 ? ['sad'] : ['happy'] }))
    const out = sleepVsTone([...rough, ...good, { sleep_quality_that_night: null, emotions: ['sad'] }])
    expect(out.enough).toBe(true)
    expect(out.rows[0].negativeShare).toBe(0.75)
    expect(out.rows[2].negativeShare).toBe(0.25)
  })
})

describe('logging habits', () => {
  const entries = [{ dream_date: '2026-10-26' }, { dream_date: '2026-10-25' }, { dream_date: '2026-10-25' }, { dream_date: '2026-10-23' }, { dream_date: '2026-08-01' }]

  it('counts distinct days logged in the window', () => {
    expect(daysLogged(entries, 30, '2026-10-26')).toBe(3)
  })

  it('keeps the streak alive until today has had a chance', () => {
    expect(currentStreak(entries, '2026-10-26')).toBe(2)
    expect(currentStreak(entries, '2026-10-27')).toBe(2)
    expect(currentStreak(entries, '2026-10-28')).toBe(0)
  })
})
