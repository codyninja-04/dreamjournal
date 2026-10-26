import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { SampleEntry } from '@/components/marketing/SampleEntry'
import { createClient } from '@/lib/supabase/server'

const STEPS = [
  {
    title: 'Catch it before it fades',
    body: 'Open the app, tap once and talk. Dreams fade within minutes of waking, so logging takes about as long as saying it out loud.',
  },
  {
    title: 'Get the details down',
    body: 'Claude pulls out who was there, where you were, how it felt and what stood out, then asks a question or two while you still remember.',
  },
  {
    title: 'See what keeps coming back',
    body: 'Over weeks, the patterns page counts what repeats and lines it up with what you noted about your life at the time.',
  },
]

export default async function Home() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo />
        {user ? (
          <Link href="/log" className="btn-ghost">
            Open journal
          </Link>
        ) : (
          <Link href="/login" className="btn-quiet">
            Sign in
          </Link>
        )}
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="animate-rise-in">
            <p className="label">A dream journal for pattern spotters</p>
            <h1 className="heading mt-5 text-5xl leading-[1.05] sm:text-6xl">
              Not what your dreams <em className="text-primary-bright">mean</em>.
              <br />
              What they keep coming back to.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Log a dream by voice the moment you wake. Over time you&apos;ll see the exams, the chases and the old houses that repeat, and how they line up with deadlines, moves and rough weeks.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={user ? '/log' : '/signup'} className="btn-primary px-6 py-3 text-base">
                {user ? 'Log a dream' : 'Start your journal'}
              </Link>
              <span className="text-sm text-faint">Text logging is free, for good.</span>
            </div>
          </div>
          <SampleEntry className="animate-drift lg:ml-auto lg:max-w-md" />
        </section>

        <div className="hairline mx-auto max-w-6xl" />

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <ol className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="font-mono text-xs text-primary-bright">0{i + 1}</span>
                <h2 className="heading mt-3 text-2xl">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="card grid gap-10 p-8 sm:p-12 md:grid-cols-2">
            <div>
              <p className="label">What it won&apos;t do</p>
              <h2 className="heading mt-3 text-3xl leading-snug">No symbol dictionary. No prophecy.</h2>
            </div>
            <div className="space-y-4 leading-relaxed text-muted">
              <p>
                There&apos;s no &ldquo;a snake means betrayal&rdquo; here. Instead you&apos;ll read things like:{' '}
                <span className="font-serif italic text-ink/90">
                  &ldquo;you&apos;ve dreamed about exams four times this month, all during the deadline you noted. Replaying stressful situations is a common way the mind processes pressure.&rdquo;
                </span>
              </p>
              <p>Counts come straight from your entries. The observations stay grounded in sleep and memory research, and always say how sure they are.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-faint sm:flex-row sm:justify-between sm:px-8">
          <span>DreamJournal. Your entries are private to your account.</span>
          <span>Not a medical service. If nightmares are disturbing your sleep, talk to a doctor.</span>
        </div>
      </footer>
    </div>
  )
}
