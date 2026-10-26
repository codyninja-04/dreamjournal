import { apiUser } from '@/lib/auth'
import { RAW_TEXT_MAX, createDream, parseDreamDate } from '@/lib/dreams'
import { BadInput, badRequest, readJson, str } from '@/lib/validate'

// POST: save a typed dream, then let Claude pull out the details.
export async function POST(req: Request) {
  const { supabase, user, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  try {
    const body = await readJson(req)
    const rawText = str(body.raw_text, 'The dream', { max: RAW_TEXT_MAX, required: true })!
    const dreamDate = parseDreamDate(body.dream_date)

    const result = await createDream(supabase, user.id, { rawText, dreamDate, inputMethod: 'text' })
    return Response.json(result, { status: 201 })
  } catch (e) {
    if (e instanceof BadInput) return badRequest(e)
    console.error('create dream failed', e)
    return Response.json({ error: "Couldn't save that. Your text is still here, try again." }, { status: 500 })
  }
}
