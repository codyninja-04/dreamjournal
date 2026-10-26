import { apiUser } from '@/lib/auth'
import { RAW_TEXT_MAX, structureEntry } from '@/lib/dreams'
import type { DreamEntry } from '@/lib/types'
import { UUID, badRequest, readJson, str } from '@/lib/validate'

// POST { raw_text? }: rerun Claude on the entry. Used after the dreamer answers
// the follow up questions or edits the text, so the details catch up.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  let rawText: string | null
  try {
    const body = await readJson(req)
    rawText = str(body.raw_text, 'The dream', { max: RAW_TEXT_MAX })
  } catch (e) {
    return badRequest(e)
  }

  const query = rawText
    ? supabase.from('dream_entries').update({ raw_text: rawText }).eq('id', params.id).eq('user_id', user.id).select('*').maybeSingle()
    : supabase.from('dream_entries').select('*').eq('id', params.id).eq('user_id', user.id).maybeSingle()
  const { data, error } = await query
  if (error) return Response.json({ error: "Couldn't save the text. Try again." }, { status: 500 })
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(await structureEntry(supabase, data as DreamEntry))
}
