import type { SupabaseClient } from '@supabase/supabase-js'
import { claudeAvailable } from './claude/client'
import { structureDream } from './claude/dream-structurer'
import { cleanLabels } from './patterns/labels'
import { countLabels, findEchoes } from './patterns/stats'
import { DAILY_STRUCTURE_CAP, startOfUtcDayIso } from './plan'
import type { DreamEntry, InputMethod, LogResult } from './types'
import { BadInput, bool, num, str } from './validate'

const DAY = /^\d{4}-\d{2}-\d{2}$/

export function parseDreamDate(v: unknown): string {
  if (typeof v !== 'string' || !DAY.test(v) || Number.isNaN(Date.parse(v))) throw new BadInput('Pick the date of the dream')
  // A day of slack for time zones ahead of UTC.
  const tomorrow = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10)
  if (v > tomorrow) throw new BadInput("That date hasn't happened yet")
  if (v < '1900-01-01') throw new BadInput('That date is too far back')
  return v
}

// The labels this person already uses, most common first, so Claude can reuse
// them and "exam" doesn't become "test" one week and "examination" the next.
async function knownLabels(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('dream_entries')
    .select('dream_date, emotions, recurring_symbols, people_present')
    .eq('user_id', userId)
    .not('structured_at', 'is', null)
    .order('dream_date', { ascending: false })
    .limit(150)
  const rows = (data ?? []) as Pick<DreamEntry, 'dream_date' | 'emotions' | 'recurring_symbols' | 'people_present'>[]
  return [
    ...countLabels(rows, 'recurring_symbols').slice(0, 40),
    ...countLabels(rows, 'people_present').slice(0, 15),
    ...countLabels(rows, 'emotions').slice(0, 20),
  ].map((c) => c.label)
}

async function underDailyCap(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('dream_entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('structured_at', startOfUtcDayIso())
  return (count ?? 0) < DAILY_STRUCTURE_CAP
}

// Run Claude over the entry's raw text and write the result back. The raw
// dream is already saved before this runs, so a Claude failure never loses it.
export async function structureEntry(supabase: SupabaseClient, entry: DreamEntry): Promise<LogResult> {
  const base = { entry, questions: [] as string[], echoes: [] as LogResult['echoes'] }
  if (!claudeAvailable()) return { ...base, structureError: 'Claude is not set up on this server, so add the details yourself below.' }
  if (!(await underDailyCap(supabase, entry.user_id))) {
    return { ...base, structureError: "You've hit today's limit for automatic details. Your dream is saved, add the details yourself below." }
  }

  let structure
  try {
    structure = await structureDream(entry.raw_text, await knownLabels(supabase, entry.user_id))
  } catch (e) {
    console.error('structureDream failed', e)
    return { ...base, structureError: "Couldn't pull the details out just now. Your dream is saved, try again from the entry." }
  }
  if (!structure) return { ...base, structureError: "Couldn't pull the details out of that one. Your dream is saved, add them yourself below." }

  const { data, error } = await supabase
    .from('dream_entries')
    .update({
      summary: structure.summary,
      emotions: structure.emotions,
      recurring_symbols: structure.recurring_symbols,
      people_present: structure.people_present,
      setting: structure.setting || null,
      structured_at: new Date().toISOString(),
    })
    .eq('id', entry.id)
    .select('*')
    .single()
  if (error || !data) return { ...base, structureError: 'Saved the dream but not the details. Try again from the entry.' }

  return {
    entry: data as DreamEntry,
    questions: structure.follow_up_questions,
    echoes: await echoesFor(supabase, data as DreamEntry),
    structureError: null,
  }
}

// Which of this dream's symbols turned up before, and how often.
export async function echoesFor(supabase: SupabaseClient, entry: DreamEntry) {
  if (!entry.recurring_symbols.length) return []
  const { data } = await supabase
    .from('dream_entries')
    .select('dream_date, recurring_symbols')
    .eq('user_id', entry.user_id)
    .neq('id', entry.id)
    .overlaps('recurring_symbols', entry.recurring_symbols)
    .order('dream_date', { ascending: false })
    .limit(200)
  return findEchoes(entry.recurring_symbols, (data ?? []) as Pick<DreamEntry, 'dream_date' | 'recurring_symbols'>[])
}

export async function createDream(
  supabase: SupabaseClient,
  userId: string,
  input: { rawText: string; dreamDate: string; inputMethod: InputMethod },
): Promise<LogResult> {
  const { data, error } = await supabase
    .from('dream_entries')
    .insert({ user_id: userId, raw_text: input.rawText, dream_date: input.dreamDate, input_method: input.inputMethod })
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Insert failed')
  return structureEntry(supabase, data as DreamEntry)
}

export const RAW_TEXT_MAX = 20000

// Fields the dreamer can edit on an entry. Only keys present in the body change.
export function parseEntryPatch(body: Record<string, unknown>) {
  const patch: Record<string, unknown> = {}
  if ('raw_text' in body) patch.raw_text = str(body.raw_text, 'The dream', { max: RAW_TEXT_MAX, required: true })
  if ('dream_date' in body) patch.dream_date = parseDreamDate(body.dream_date)
  if ('summary' in body) patch.summary = str(body.summary, 'Summary', { max: 1200 })
  if ('setting' in body) patch.setting = str(body.setting, 'Setting', { max: 120 })
  if ('life_context_note' in body) patch.life_context_note = str(body.life_context_note, 'Life context', { max: 2000 })
  if ('emotions' in body) patch.emotions = cleanLabels(body.emotions, { max: 12, maxLength: 32 })
  if ('recurring_symbols' in body) patch.recurring_symbols = cleanLabels(body.recurring_symbols, { max: 20 })
  if ('people_present' in body) patch.people_present = cleanLabels(body.people_present, { max: 15 })
  if ('was_lucid' in body) patch.was_lucid = bool(body.was_lucid)
  if ('sleep_quality_that_night' in body) patch.sleep_quality_that_night = num(body.sleep_quality_that_night, 'Sleep quality', { min: 1, max: 5 })
  if (patch.sleep_quality_that_night != null) patch.sleep_quality_that_night = Math.round(patch.sleep_quality_that_night as number)
  return patch
}
