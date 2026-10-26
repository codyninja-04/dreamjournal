import OpenAI from 'openai'

// Whisper rejects anything over 25 MB. A five minute voice note in webm/opus is
// a few MB, so this only trips on something that isn't a voice note.
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024

export const ACCEPTED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'video/webm']

export function voiceAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY
}

let client: OpenAI | null = null

export function extensionFor(type: string): string {
  if (type.includes('webm')) return 'webm'
  if (type.includes('ogg')) return 'ogg'
  if (type.includes('mp4') || type.includes('m4a')) return 'm4a'
  if (type.includes('mpeg')) return 'mp3'
  if (type.includes('wav')) return 'wav'
  return 'webm'
}

export async function transcribeDream(audio: Blob): Promise<string> {
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const type = audio.type.split(';')[0] || 'audio/webm'
  const file = new File([audio], `dream.${extensionFor(type)}`, { type })

  const result = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    // A light hint about the content helps with half awake, mumbled speech.
    prompt: 'Someone describing a dream they just woke up from, in the first person.',
  })

  return result.text.trim()
}
