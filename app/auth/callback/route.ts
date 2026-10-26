import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Google OAuth lands here. Swap the code for a session and carry on to wherever
// the user was heading, defaulting to the log screen.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const destination = next && next.startsWith('/') && !next.startsWith('//') ? next : '/log'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${destination}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
