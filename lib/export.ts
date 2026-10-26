import { formatDay } from './format'
import { SLEEP_LABELS, type DreamEntry } from './types'

// A readable Markdown copy of the whole journal, newest first. Meant for
// keeping, printing or pasting into another notes app.
export function toMarkdown(entries: DreamEntry[], exportedOn: string): string {
  const count = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`
  const out: string[] = ['# Dream journal', '', `Exported ${formatDay(exportedOn, { year: true })}. ${count}.`, '']
  for (const e of entries) {
    out.push(`## ${formatDay(e.dream_date, { weekday: true, year: true })}`, '')
    if (e.summary) out.push(`*${e.summary}*`, '')
    out.push(e.raw_text.trim(), '')
    const facts: string[] = []
    if (e.emotions.length) facts.push(`- Felt: ${e.emotions.join(', ')}`)
    if (e.recurring_symbols.length) facts.push(`- Symbols: ${e.recurring_symbols.join(', ')}`)
    if (e.people_present.length) facts.push(`- People: ${e.people_present.join(', ')}`)
    if (e.setting) facts.push(`- Setting: ${e.setting}`)
    if (e.was_lucid) facts.push('- Lucid: yes')
    if (e.sleep_quality_that_night) facts.push(`- Sleep: ${SLEEP_LABELS[e.sleep_quality_that_night]} (${e.sleep_quality_that_night}/5)`)
    if (e.life_context_note) facts.push(`- Going on in life: ${e.life_context_note}`)
    if (facts.length) out.push(...facts, '')
  }
  return out.join('\n')
}

export function toJson(entries: DreamEntry[], exportedAt = new Date().toISOString()): string {
  const rows = entries.map((e) => ({
    dream_date: e.dream_date,
    logged_at: e.logged_at,
    input_method: e.input_method,
    raw_text: e.raw_text,
    summary: e.summary,
    emotions: e.emotions,
    recurring_symbols: e.recurring_symbols,
    people_present: e.people_present,
    setting: e.setting,
    was_lucid: e.was_lucid,
    sleep_quality_that_night: e.sleep_quality_that_night,
    life_context_note: e.life_context_note,
  }))
  return JSON.stringify({ exported_at: exportedAt, entries: rows }, null, 2)
}
