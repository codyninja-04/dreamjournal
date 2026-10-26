import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { requireUser } from '@/lib/auth'
import { claudeAvailable } from '@/lib/claude/client'
import { enforcingPlans, limitsFor } from '@/lib/plan'
import { voiceAvailable } from '@/lib/whisper/transcribe'
import { DangerZone } from './DangerZone'

export const metadata: Metadata = { title: 'Settings' }

const PRO_FEATURES = ['Voice logging, transcribed by Whisper', 'Pattern analysis across your last 20 dreams', 'Full text search across every entry', 'Export to Markdown or JSON']

export default async function SettingsPage() {
  const { supabase, user, plan } = await requireUser()
  const limits = limitsFor(plan)
  const { count } = await supabase.from('dream_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  const entries = count ?? 0

  return (
    <div className="animate-rise-in space-y-10">
      <PageHeader eyebrow="Settings" title="Your journal" sub={`Signed in as ${user.email}.`} />

      <section>
        <h2 className="label mb-3">Plan</h2>
        <div className="card p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-serif text-2xl capitalize">{plan}</p>
            {plan !== 'pro' && <p className="text-sm text-muted">Pro is $5 a month</p>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {plan === 'pro'
              ? 'Everything is unlocked.'
              : enforcingPlans()
                ? 'Text logging and the journal are free for good. Pro adds:'
                : 'Everything is unlocked while billing is being set up. Pro will include:'}
          </p>
          {plan !== 'pro' && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-bright" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="label mb-3">Export</h2>
        <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="text-sm text-muted">Your dreams belong to you. Download every entry, with the details and notes.</p>
          {limits.export ? (
            <div className="flex shrink-0 gap-2">
              <a href="/api/export?format=md" className="btn-ghost" download>
                Markdown
              </a>
              <a href="/api/export?format=json" className="btn-ghost" download>
                JSON
              </a>
            </div>
          ) : (
            <span className="chip shrink-0 border-primary/40 text-primary-bright">Pro</span>
          )}
        </div>
      </section>

      <section>
        <h2 className="label mb-3">Privacy</h2>
        <div className="card space-y-2 p-5 text-sm leading-relaxed text-muted sm:p-6">
          <p>Entries are locked to your account at the database level. Nobody else can read them, including other users of this app.</p>
          <p>
            To pull out details and find patterns, the text of a dream is sent to Anthropic&apos;s API{claudeAvailable() ? '' : ' (not set up on this server)'}. Voice notes are sent to OpenAI&apos;s Whisper API for transcription
            {voiceAvailable() ? '' : ' (not set up on this server)'} and the audio itself is never stored. Neither API trains on this data.
          </p>
        </div>
      </section>

      <section>
        <h2 className="label mb-3">Danger zone</h2>
        <DangerZone entries={entries} />
      </section>
    </div>
  )
}
