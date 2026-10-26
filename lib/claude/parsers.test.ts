import { describe, expect, it } from 'vitest'
import { parseDreamStructure } from './dream-structurer'
import { describeEntries, parsePatternResult } from './pattern-analyzer'

describe('parseDreamStructure', () => {
  it('cleans and normalises a good tool call', () => {
    const out = parseDreamStructure({
      summary: '  You were back at school.  ',
      emotions: ['Anxious', 'anxious', 'Rushed'],
      recurring_symbols: ['Exam', 'School Hall'],
      people_present: ['My Sister'],
      setting: 'old school',
      follow_up_questions: ['How did it end?', '', 'ok', 'Who was the teacher?', 'What room?', 'Fourth one?'],
    })
    expect(out).toEqual({
      summary: 'You were back at school.',
      emotions: ['anxious', 'rushed'],
      recurring_symbols: ['exam', 'school hall'],
      people_present: ['my sister'],
      setting: 'old school',
      follow_up_questions: ['How did it end?', 'Who was the teacher?', 'What room?'],
    })
  })

  it('rejects a call with no summary', () => {
    expect(parseDreamStructure({ summary: ' ', emotions: [] })).toBeNull()
    expect(parseDreamStructure(null)).toBeNull()
  })

  it('tolerates missing lists', () => {
    const out = parseDreamStructure({ summary: 'A short one.' })
    expect(out).toMatchObject({ emotions: [], recurring_symbols: [], people_present: [], setting: '', follow_up_questions: [] })
  })
})

describe('parsePatternResult', () => {
  it('keeps valid elements and caps them at eight', () => {
    const elements = Array.from({ length: 10 }, (_, i) => ({ element: `Thing ${i}`, labels: ['Thing'], frequency: 3, note: 'n' }))
    const out = parsePatternResult({ recurring_elements: [...elements, { element: '' }], emotional_trends: 'Calmer lately.', grounded_observation: 'Stress shows up.' })
    expect(out?.recurring_elements).toHaveLength(8)
    expect(out?.recurring_elements[0]).toEqual({ element: 'thing 0', labels: ['thing'], frequency: 3, note: 'n' })
  })

  it('returns null when there is nothing to show', () => {
    expect(parsePatternResult({ recurring_elements: [], emotional_trends: '', grounded_observation: '' })).toBeNull()
  })

  it('treats a non numeric frequency as zero so it gets recounted', () => {
    const out = parsePatternResult({ recurring_elements: [{ element: 'water', labels: ['water'], frequency: 'lots', note: '' }], grounded_observation: 'x' })
    expect(out?.recurring_elements[0].frequency).toBe(0)
  })
})

describe('describeEntries', () => {
  it('includes the life context so Claude can line things up', () => {
    const text = describeEntries([
      {
        dream_date: '2026-10-02',
        summary: 'You sat an exam.',
        raw_text: 'exam dream',
        emotions: ['anxious'],
        recurring_symbols: ['exam'],
        people_present: [],
        setting: null,
        was_lucid: false,
        sleep_quality_that_night: 2,
        life_context_note: 'Deadline on Friday',
      },
    ])
    expect(text).toContain('[2026-10-02]')
    expect(text).toContain('Life context they noted: Deadline on Friday')
    expect(text).toContain('Sleep quality: 2/5')
    expect(text).not.toContain('Setting')
  })
})
