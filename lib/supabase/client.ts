'use client'

import { createBrowserClient } from '@supabase/ssr'

// Browser side client for the sign in screen. Writes go through the
// API routes, and RLS keeps each person scoped to their own rows either way.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
