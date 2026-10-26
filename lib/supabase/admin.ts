import { createClient } from '@supabase/supabase-js'

// Service role client. Only used server side to delete an account, since that
// needs the auth admin API. Never import this into a client component.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
