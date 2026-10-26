export type Plan = 'free' | 'pro'

export type InputMethod = 'text' | 'voice'

export interface DreamEntry {
  id: string
  user_id: string
  dream_date: string
  logged_at: string
  updated_at: string
  raw_text: string
  input_method: InputMethod
  summary: string | null
  emotions: string[]
  recurring_symbols: string[]
  people_present: string[]
  setting: string | null
  structured_at: string | null
  was_lucid: boolean
  sleep_quality_that_night: number | null
  life_context_note: string | null
}

// What Claude pulls out of a raw dream description.
export interface DreamStructure {
  summary: string
  emotions: string[]
  recurring_symbols: string[]
  people_present: string[]
  setting: string
  follow_up_questions: string[]
}

// A symbol from a new dream that has shown up in earlier entries too.
export interface Echo {
  label: string
  count: number
  lastDate: string
}

// What the log screen gets back after saving a dream.
export interface LogResult {
  entry: DreamEntry
  questions: string[]
  echoes: Echo[]
  structureError: string | null
}

export interface RecurringElement {
  element: string
  frequency: number
  note: string
  // The exact labels from the entries this element groups together, so the
  // UI can show which dreams it appeared in.
  labels: string[]
}

export interface PatternAnalysis {
  id: string
  user_id: string
  generated_at: string
  based_on_entries: number
  period_start: string | null
  period_end: string | null
  recurring_elements: RecurringElement[]
  emotional_trends: string | null
  grounded_observation: string | null
}

export const SLEEP_LABELS: Record<number, string> = {
  1: 'Rough',
  2: 'Restless',
  3: 'Okay',
  4: 'Good',
  5: 'Deep',
}
