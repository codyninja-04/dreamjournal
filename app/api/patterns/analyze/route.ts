import { apiUser } from '@/lib/auth'
import { claudeAvailable } from '@/lib/claude/client'
import { analyzeDreamPatterns } from '@/lib/claude/pattern-analyzer'
import { countLabels, reconcileElements } from '@/lib/patterns/stats'
import { analysisWindow } from '@/lib/patterns/window'
import { DAILY_ANALYSIS_CAP, MIN_DREAMS_FOR_ANALYSIS, limitsFor, startOfUtcDayIso } from '@/lib/plan'
import type { PatternAnalysis } from '@/lib/types'

export const maxDuration = 60

// POST: ask Claude to describe the patterns across the last 20 dreams and keep
// the result, so the patterns page can show it without another call.
export async function POST() {
  const { supabase, user, plan, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  if (!limitsFor(plan).patterns) return Response.json({ error: 'Pattern analysis is part of Pro.' }, { status: 403 })
  if (!claudeAvailable()) return Response.json({ error: 'Claude is not set up on this server.' }, { status: 503 })

  const { count } = await supabase
    .from('pattern_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('generated_at', startOfUtcDayIso())
  if ((count ?? 0) >= DAILY_ANALYSIS_CAP) {
    return Response.json({ error: "That's enough analysis for one day. Patterns show up over weeks, not hours." }, { status: 429 })
  }

  const entries = await analysisWindow(supabase, user.id)
  if (entries.length < MIN_DREAMS_FOR_ANALYSIS) {
    return Response.json({ error: `Log at least ${MIN_DREAMS_FOR_ANALYSIS} dreams first. There isn't a pattern to find yet.` }, { status: 400 })
  }

  let result
  try {
    result = await analyzeDreamPatterns(entries, {
      symbols: countLabels(entries, 'recurring_symbols'),
      emotions: countLabels(entries, 'emotions'),
      people: countLabels(entries, 'people_present'),
    })
  } catch (e) {
    console.error('pattern analysis failed', e)
    return Response.json({ error: "Couldn't finish the analysis just now. Try again in a minute." }, { status: 502 })
  }
  if (!result) return Response.json({ error: 'The analysis came back empty. Try again.' }, { status: 502 })

  const { data, error } = await supabase
    .from('pattern_analyses')
    .insert({
      user_id: user.id,
      based_on_entries: entries.length,
      period_start: entries[0].dream_date,
      period_end: entries[entries.length - 1].dream_date,
      recurring_elements: reconcileElements(result.recurring_elements, entries),
      emotional_trends: result.emotional_trends || null,
      grounded_observation: result.grounded_observation || null,
    })
    .select('*')
    .single()
  if (error || !data) return Response.json({ error: "Couldn't save the analysis. Try again." }, { status: 500 })

  return Response.json({ analysis: data as PatternAnalysis }, { status: 201 })
}
