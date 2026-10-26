import { apiUser } from '@/lib/auth'
import { parseEntryPatch } from '@/lib/dreams'
import type { DreamEntry } from '@/lib/types'
import { UUID, badRequest, readJson } from '@/lib/validate'

type Ctx = { params: { id: string } }

export async function PATCH(req: Request, { params }: Ctx) {
  const { supabase, user, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  let patch: Record<string, unknown>
  try {
    patch = parseEntryPatch(await readJson(req))
  } catch (e) {
    return badRequest(e)
  }
  if (!Object.keys(patch).length) return Response.json({ error: 'Nothing to change' }, { status: 400 })

  const { data, error } = await supabase.from('dream_entries').update(patch).eq('id', params.id).eq('user_id', user.id).select('*').maybeSingle()
  if (error) return Response.json({ error: "Couldn't save those changes. Try again." }, { status: 500 })
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ entry: data as DreamEntry })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { supabase, user, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  const { error, count } = await supabase.from('dream_entries').delete({ count: 'exact' }).eq('id', params.id).eq('user_id', user.id)
  if (error) return Response.json({ error: "Couldn't delete it. Try again." }, { status: 500 })
  if (!count) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true })
}
