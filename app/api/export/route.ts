import { apiUser } from '@/lib/auth'
import { toJson, toMarkdown } from '@/lib/export'
import { limitsFor } from '@/lib/plan'
import type { DreamEntry } from '@/lib/types'

// GET ?format=md|json: download every entry.
export async function GET(req: Request) {
  const { supabase, user, plan, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!limitsFor(plan).export) return Response.json({ error: 'Export is part of Pro.' }, { status: 403 })

  const format = new URL(req.url).searchParams.get('format') === 'json' ? 'json' : 'md'

  // Paged so a long journal doesn't hit the default row cap.
  const entries: DreamEntry[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('dream_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('dream_date', { ascending: false })
      .order('logged_at', { ascending: false })
      .range(from, from + 999)
    if (error) return Response.json({ error: "Couldn't export right now. Try again." }, { status: 500 })
    entries.push(...((data ?? []) as DreamEntry[]))
    if (!data || data.length < 1000) break
  }

  const today = new Date().toISOString().slice(0, 10)
  const body = format === 'json' ? toJson(entries) : toMarkdown(entries, today)
  return new Response(body, {
    headers: {
      'Content-Type': format === 'json' ? 'application/json; charset=utf-8' : 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="dream-journal-${today}.${format}"`,
      'Cache-Control': 'no-store',
    },
  })
}
