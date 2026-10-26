'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function signedIn() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

// Wipes every entry and analysis but keeps the account, for a fresh start.
export async function clearJournal() {
  const { supabase, user } = await signedIn()
  const [a, b] = await Promise.all([
    supabase.from('dream_entries').delete().eq('user_id', user.id),
    supabase.from('pattern_analyses').delete().eq('user_id', user.id),
  ])
  if (a.error || b.error) throw new Error("Couldn't clear the journal. Try again.")
  revalidatePath('/', 'layout')
}

// Every table cascades from auth.users, so deleting the user takes every
// dream, analysis and the profile with it.
export async function deleteAccount() {
  const { supabase, user } = await signedIn()
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id)
  if (error) throw new Error('Could not delete the account. Try again or contact support.')

  await supabase.auth.signOut()
  redirect('/')
}
