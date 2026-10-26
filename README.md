# DreamJournal

A dream journal for people who want to spot real patterns over time, without the mystical interpretation.

Log a dream the moment you wake, by voice or text. Claude pulls out the summary, emotions, symbols, people and setting, asks a question or two while you still remember, and tells you which parts have shown up before. Over a few weeks the patterns page shows what keeps coming back, how your dreams have felt week by week, and how that lines up with sleep quality and whatever you noted about your life at the time.

You won't find a symbol dictionary here. You'll get things like "exams came up in 5 of your last 20 dreams, four of them during the deadline you noted", not "a snake means betrayal".

## Stack

- Next.js 14 (App Router), TypeScript strict, Tailwind, installable as a PWA
- Supabase: Postgres with RLS, full text search on entries, Google OAuth
- Claude for dream structuring and pattern analysis (forced tool calls, so the output is always valid)
- OpenAI Whisper for voice notes
- Recharts for the weekly emotion chart
- Vitest for the pure logic in `lib/`

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in the keys
npm run dev
```

1. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql` in the SQL editor.
2. Turn on the Google provider under Authentication, and add `http://localhost:3000/auth/callback` (plus your production URL) to the redirect URLs.
3. Add `ANTHROPIC_API_KEY` for structuring and patterns, and `OPENAI_API_KEY` for voice logging. The app still works without them: dreams save as plain text and you fill in the details yourself.

| Variable | What it's for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Only used to delete an account |
| `ANTHROPIC_API_KEY` | Dream structuring and pattern analysis |
| `OPENAI_API_KEY` | Whisper transcription for voice logs |
| `CLAUDE_MODEL` | Optional, defaults to `claude-sonnet-5-5` |
| `ENFORCE_PRO` | `true` locks voice, patterns, search and export behind Pro |

## How it fits together

- **Log** (`/log`): voice or text capture. The raw dream is saved first, then Claude structures it, so a failed API call never loses a dream. Typed drafts are kept in local storage until saved. The review step shows echoes (symbols seen in earlier dreams), follow up questions whose answers get folded back into the dream, and fields for sleep quality, lucidity and life context.
- **Journal** (`/journal`): entries grouped by month, full text search, one tap filters by emotion, symbol or lucid dreams.
- **Entry** (`/entries/[id]`): read, edit, re-run the details, delete, and see other dreams that share a symbol.
- **Patterns** (`/patterns`): based on the last 20 structured dreams. Logging stats, recurring elements with an occurrence strip, the weekly tone chart, a sleep vs dream tone comparison, and Claude's grounded observation.
- **Settings**: plan, Markdown and JSON export, clear the journal, delete the account.

A few decisions worth knowing about:

- Labels (emotions, symbols, people) are normalised to lowercase and Claude is given the dreamer's existing labels, so "exam" stays "exam" instead of drifting into "test" and "examination". That's what makes the counts mean something.
- Recurring element frequencies are recounted from the entries in `lib/patterns/stats.ts`. Claude groups synonyms and writes the notes, but never gets the final say on a number.
- Daily caps on Claude and Whisper calls apply to every plan, so a stuck client can't run up the bill.
- Voice audio goes straight to Whisper and is never stored.

## Scripts

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Plans

Free covers unlimited text logging and the journal. Pro ($5/month) adds voice logging, pattern analysis, full search and export. Billing isn't wired up yet, so leave `ENFORCE_PRO` off and everything stays unlocked. When billing lands, it sets `profiles.plan` with the service role, since users can read their plan but never change it.
