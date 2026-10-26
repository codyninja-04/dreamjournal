// Labels (emotions, symbols, people) are compared across months of entries, so
// they need to be stored the same way every time: lowercase, single spaced,
// no stray punctuation.
export function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[“”"'`.,;:!?()[\]{}\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function cleanLabels(values: unknown, opts: { max: number; maxLength?: number } = { max: 12 }): string[] {
  if (!Array.isArray(values)) return []
  const maxLength = opts.maxLength ?? 48
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    if (typeof v !== 'string') continue
    const label = normalizeLabel(v)
    if (!label || label.length > maxLength || seen.has(label)) continue
    seen.add(label)
    out.push(label)
    if (out.length >= opts.max) break
  }
  return out
}

export type Valence = 'positive' | 'negative' | 'neutral'

// A small lexicon, enough to tint tags and chart the overall tone of dreams.
// Anything not listed counts as neutral, which is the honest default.
const NEGATIVE = new Set([
  'afraid', 'scared', 'frightened', 'terrified', 'fear', 'fearful', 'panic', 'panicked', 'panicky',
  'anxious', 'anxiety', 'nervous', 'worried', 'uneasy', 'dread', 'stressed', 'tense', 'overwhelmed',
  'rushed', 'pressured', 'trapped', 'stuck', 'helpless', 'powerless', 'lost', 'confused', 'disoriented',
  'sad', 'sadness', 'grief', 'grieving', 'lonely', 'abandoned', 'rejected', 'heartbroken', 'hurt',
  'angry', 'anger', 'furious', 'frustrated', 'irritated', 'betrayed', 'jealous', 'resentful',
  'ashamed', 'shame', 'embarrassed', 'guilty', 'guilt', 'humiliated', 'exposed', 'disgusted',
  'chased', 'threatened', 'unsafe', 'vulnerable', 'exhausted', 'desperate', 'hopeless', 'horrified',
])

const POSITIVE = new Set([
  'happy', 'happiness', 'joy', 'joyful', 'glad', 'delighted', 'elated', 'euphoric', 'excited', 'thrilled',
  'calm', 'peaceful', 'serene', 'relaxed', 'content', 'safe', 'secure', 'comforted', 'relieved', 'relief',
  'loved', 'love', 'warm', 'affectionate', 'connected', 'grateful', 'proud', 'confident', 'brave',
  'free', 'freedom', 'light', 'playful', 'amused', 'curious', 'awe', 'amazed', 'wonder', 'hopeful',
  'inspired', 'empowered', 'accomplished', 'satisfied',
])

export function valenceOf(emotion: string): Valence {
  const e = normalizeLabel(emotion)
  if (NEGATIVE.has(e)) return 'negative'
  if (POSITIVE.has(e)) return 'positive'
  // Catch simple variants like "very anxious" or "a bit scared".
  const last = e.split(' ').pop() ?? e
  if (NEGATIVE.has(last)) return 'negative'
  if (POSITIVE.has(last)) return 'positive'
  return 'neutral'
}

export type Tone = 'positive' | 'negative' | 'mixed' | 'neutral' | 'unknown'

// The overall feel of one dream from its emotions.
export function toneOf(emotions: string[]): Tone {
  if (emotions.length === 0) return 'unknown'
  let pos = 0
  let neg = 0
  for (const e of emotions) {
    const v = valenceOf(e)
    if (v === 'positive') pos++
    else if (v === 'negative') neg++
  }
  if (pos && neg) return 'mixed'
  if (neg) return 'negative'
  if (pos) return 'positive'
  return 'neutral'
}
