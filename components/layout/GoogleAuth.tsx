'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from './Logo'

export function GoogleAuth({ mode }: { mode: 'login' | 'signup' }) {
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(params.get('error') ? "Sign in didn't finish. Give it another go." : null)

  async function signIn() {
    setLoading(true)
    setError(null)
    const next = params.get('next') ?? '/log'
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const copy =
    mode === 'login'
      ? {
          title: 'Good morning',
          sub: 'Your journal is where you left it. Catch the dream before it fades.',
          alt: 'New here?',
          altLink: '/signup',
          altText: 'Start a journal',
        }
      : {
          title: 'Start a dream journal',
          sub: 'Say or type what you remember the moment you wake. After a few weeks you will see what keeps coming back, and when. Text logging is free, forever.',
          alt: 'Already have a journal?',
          altLink: '/login',
          altText: 'Sign in',
        }

  return (
    <div className="w-full max-w-sm animate-rise-in">
      <Logo />
      <h1 className="heading mt-14 text-4xl sm:text-5xl">{copy.title}</h1>
      <p className="mt-4 leading-relaxed text-muted">{copy.sub}</p>

      <button onClick={signIn} disabled={loading} className="btn-ghost mt-9 w-full py-3">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.4 24 12 24z" />
          <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10.1 0 12s.5 3.8 1.3 5.4l4-3.1z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
        </svg>
        {loading ? 'Opening Google…' : 'Continue with Google'}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-unease">
          {error}
        </p>
      )}

      <p className="mt-6 text-sm text-muted">
        {copy.alt}{' '}
        <Link href={copy.altLink} className="font-medium text-ink underline decoration-strong underline-offset-4 hover:decoration-primary">
          {copy.altText}
        </Link>
      </p>

      <p className="mt-12 text-xs leading-relaxed text-faint">
        Your dreams are private to your account. Nobody else can read them, and they are never used to train anything.
      </p>
    </div>
  )
}
