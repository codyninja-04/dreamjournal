import { describe, expect, it } from 'vitest'
import { cleanLabels, normalizeLabel, toneOf, valenceOf } from './labels'

describe('normalizeLabel', () => {
  it('lowercases, trims and collapses spaces', () => {
    expect(normalizeLabel('  Flooded   House ')).toBe('flooded house')
  })

  it('drops punctuation that would break array filters', () => {
    expect(normalizeLabel('"exam," (again)!')).toBe('exam again')
    expect(normalizeLabel('back\\slash{x}')).toBe('backslashx')
  })
})

describe('cleanLabels', () => {
  it('dedupes after normalising and keeps order', () => {
    expect(cleanLabels(['Exam', 'exam ', 'Water', 'EXAM'])).toEqual(['exam', 'water'])
  })

  it('ignores non strings, empties and overlong labels', () => {
    expect(cleanLabels(['ok', 3, null, '', 'x'.repeat(60)], { max: 10 })).toEqual(['ok'])
  })

  it('caps the count', () => {
    expect(cleanLabels(['a', 'b', 'c', 'd'], { max: 2 })).toEqual(['a', 'b'])
  })

  it('returns [] for anything that is not an array', () => {
    expect(cleanLabels('exam')).toEqual([])
  })
})

describe('valenceOf', () => {
  it('knows common emotions', () => {
    expect(valenceOf('anxious')).toBe('negative')
    expect(valenceOf('Relieved')).toBe('positive')
    expect(valenceOf('surprised')).toBe('neutral')
  })

  it('reads the last word of a short phrase', () => {
    expect(valenceOf('a bit scared')).toBe('negative')
    expect(valenceOf('really calm')).toBe('positive')
  })
})

describe('toneOf', () => {
  it('summarises a dream from its emotions', () => {
    expect(toneOf([])).toBe('unknown')
    expect(toneOf(['anxious', 'rushed'])).toBe('negative')
    expect(toneOf(['happy'])).toBe('positive')
    expect(toneOf(['afraid', 'relieved'])).toBe('mixed')
    expect(toneOf(['surprised'])).toBe('neutral')
  })
})
