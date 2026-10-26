import { apiUser } from '@/lib/auth'
import { createDream, parseDreamDate } from '@/lib/dreams'
import { DAILY_VOICE_CAP, limitsFor, startOfUtcDayIso } from '@/lib/plan'
import { BadInput, badRequest } from '@/lib/validate'
import { ACCEPTED_AUDIO_TYPES, MAX_AUDIO_BYTES, transcribeDream, voiceAvailable } from '@/lib/whisper/transcribe'

export const maxDuration = 60

// POST (multipart: audio, dream_date): Whisper transcribes the voice note, the
// transcript is saved as the dream, then Claude structures it like a typed one.
export async function POST(req: Request) {
  const { supabase, user, plan, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  if (!limitsFor(plan).voice) return Response.json({ error: 'Voice logging is part of Pro. You can still type it out.' }, { status: 403 })
  if (!voiceAvailable()) return Response.json({ error: 'Voice logging is not set up on this server. Type it out instead.' }, { status: 503 })

  try {
    const form = await req.formData().catch(() => null)
    if (!form) throw new BadInput('Send the recording as form data')
    const audio = form.get('audio')
    if (!(audio instanceof Blob) || audio.size === 0) throw new BadInput("The recording came through empty. Try again, or type it out.")
    if (audio.size > MAX_AUDIO_BYTES) throw new BadInput('That recording is too long. Keep it under about ten minutes.')
    const type = audio.type.split(';')[0]
    if (type && !ACCEPTED_AUDIO_TYPES.includes(type)) throw new BadInput("That audio format isn't supported")
    const dreamDate = parseDreamDate(form.get('dream_date'))

    const { count } = await supabase
      .from('dream_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('input_method', 'voice')
      .gte('logged_at', startOfUtcDayIso())
    if ((count ?? 0) >= DAILY_VOICE_CAP) {
      return Response.json({ error: "That's a lot of voice notes for one day. Type this one out." }, { status: 429 })
    }

    let transcript: string
    try {
      transcript = await transcribeDream(audio)
    } catch (e) {
      console.error('whisper failed', e)
      return Response.json({ error: "Couldn't transcribe that recording. Try again, or type it out while it's fresh." }, { status: 502 })
    }
    if (transcript.length < 3) throw new BadInput("Didn't catch any words in that one. Try again a little closer to the mic.")

    const result = await createDream(supabase, user.id, { rawText: transcript.slice(0, 20000), dreamDate, inputMethod: 'voice' })
    return Response.json(result, { status: 201 })
  } catch (e) {
    if (e instanceof BadInput) return badRequest(e)
    console.error('voice log failed', e)
    return Response.json({ error: "Couldn't save that recording. Try again, or type it out." }, { status: 500 })
  }
}
