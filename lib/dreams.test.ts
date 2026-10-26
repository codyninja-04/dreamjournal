import { describe, expect, it } from 'vitest'
import { parseDreamDate, parseEntryPatch } from './dreams'
import { toJson, toMarkdown } from './export'
import type { DreamEntry } from './types'
import { BadInput } from './validate'

describe('parseDreamDate', () => {
  it('accepts a plain past date', () => {
    expect(parseDreamDate('2026-10-01')).toBe('2026-10-01')
  })

  it('rejects junk, the future and the distant past', () => {
    expect(() => parseDreamDate('yesterday')).toThrow(BadInput)
    expect(() => parseDreamDate('2999-01-01')).toThrow("hasn't happened")
    expect(() => parseDreamDate('1800-01-01')).toThrow(BadInput)
  })
})

describe('parseEntryPatch', () => {
  it('only touches the fields that were sent', () => {
    expect(parseEntryPatch({ was_lucid: true })).toEqual({ was_lucid: true })
  })

  it('normalises tags and rounds sleep quality', () => {
    const patch = parseEntryPatch({ emotions: ['Scared', 'scared'], recurring_symbols: ['Big Dog'], sleep_quality_that_night: '3.6' })
    expect(patch).toEqual({ emotions: ['scared'], recurring_symbols: ['big dog'], sleep_quality_that_night: 4 })
  })

  it('clears optional text with an empty string', () => {
    expect(parseEntryPatch({ life_context_note: '  ', setting: '' })).toEqual({ life_context_note: null, setting: null })
  })

  it('refuses an empty dream or an out of range rating', () => {
    expect(() => parseEntryPatch({ raw_text: '' })).toThrow('required')
    expect(() => parseEntryPatch({ sleep_quality_that_night: 9 })).toThrow(BadInput)
  })
})

describe('export', () => {
  const entry: DreamEntry = {
    id: '1',
    user_id: 'u',
    dream_date: '2026-10-14',
    logged_at: '2026-10-14T07:00:00Z',
    updated_at: '2026-10-14T07:00:00Z',
    raw_text: 'I was late for an exam.',
    input_method: 'voice',
    summary: 'You were late for an exam.',
    emotions: ['anxious'],
    recurring_symbols: ['exam'],
    people_present: [],
    setting: 'school',
    structured_at: '2026-10-14T07:00:05Z',
    was_lucid: true,
    sleep_quality_that_night: 2,
    life_context_note: 'Deadline week',
  }

  it('writes readable Markdown', () => {
    const md = toMarkdown([entry], '2026-10-26')
    expect(md).toContain('# Dream journal')
    expect(md).toContain('1 entry.')
    expect(md).toContain('## Wed, 14 Oct 2026')
    expect(md).toContain('- Felt: anxious')
    expect(md).toContain('- Lucid: yes')
    expect(md).toContain('- Sleep: Restless (2/5)')
    expect(md).toContain('- Going on in life: Deadline week')
  })

  it('leaves internal ids out of the JSON', () => {
    const json = JSON.parse(toJson([entry], '2026-10-26T00:00:00Z'))
    expect(json.exported_at).toBe('2026-10-26T00:00:00Z')
    expect(json.entries[0]).not.toHaveProperty('id')
    expect(json.entries[0]).not.toHaveProperty('user_id')
    expect(json.entries[0].raw_text).toBe('I was late for an exam.')
  })
})
