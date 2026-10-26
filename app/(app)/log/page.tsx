import type { Metadata } from 'next'
import { LogFlow } from '@/components/log/LogFlow'
import { requireUser } from '@/lib/auth'
import { claudeAvailable } from '@/lib/claude/client'
import { limitsFor } from '@/lib/plan'
import { voiceAvailable } from '@/lib/whisper/transcribe'

export const metadata: Metadata = { title: 'Log a dream' }

export default async function LogPage() {
  const { plan } = await requireUser()
  const allowed = limitsFor(plan).voice
  const configured = voiceAvailable()

  const voice = {
    enabled: allowed && configured,
    reason: !allowed ? 'Voice logging comes with Pro.' : !configured ? 'Voice logging is not set up on this server yet.' : null,
  }

  return <LogFlow voice={voice} claudeReady={claudeAvailable()} />
}
