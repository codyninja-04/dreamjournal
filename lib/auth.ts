import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './supabase/server'
import type { Plan } from './types'

async function planFor(supabase: SupabaseClient, userId: string): Promise<Plan> {
  const { data } = await supabase.from('profiles').select('plan').eq('user_id', userId).maybeSingle()
  return (data?.plan as Plan | undefined) ?? 'free'
}

// Server components behind the app layout call this to get the signed in user.
export async function requireUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return { supabase, user, plan: await planFor(supabase, user.id) }
}

// Route handler version: returns a 401 response instead of redirecting.
export async function apiUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, plan: 'free' as Plan, unauthorized: NextResponse.json({ error: 'Sign in first' }, { status: 401 }) }
  return { supabase, user, plan: await planFor(supabase, user.id), unauthorized: null }
}

export function displayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined
  const name = (meta?.full_name ?? meta?.name)?.trim()
  if (name) return name.split(/\s+/)[0]
  return user.email?.split('@')[0] ?? 'there'
}
