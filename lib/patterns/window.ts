import type { SupabaseClient } from '@supabase/supabase-js'
import { ANALYSIS_WINDOW } from '../plan'
import type { DreamEntry } from '../types'

// The most recent dreams that have details to compare, oldest first. This is
// "your last 20 dreams" on the patterns page and what Claude is shown.
export async function analysisWindow(supabase: SupabaseClient, userId: string, size = ANALYSIS_WINDOW): Promise<DreamEntry[]> {
  const { data } = await supabase
    .from('dream_entries')
    .select('*')
    .eq('user_id', userId)
    .not('structured_at', 'is', null)
    .order('dream_date', { ascending: false })
    .order('logged_at', { ascending: false })
    .limit(size)
  return ((data ?? []) as DreamEntry[]).reverse()
}
