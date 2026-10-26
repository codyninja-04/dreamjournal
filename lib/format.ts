// Dates in this app are plain calendar days (yyyy-mm-dd) for the night the dream
// happened. Parse them as UTC midnight so formatting never slides a day.
export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
}

export function toDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// The browser's own calendar day. Someone logging at 7am wants that date, not
// whatever UTC thinks it is.
export function localToday(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day)
  d.setUTCDate(d.getUTCDate() + n)
  return toDay(d)
}

export function formatDay(day: string, opts: { weekday?: boolean; year?: boolean } = {}): string {
  return parseDay(day).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: opts.weekday ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    year: opts.year ? 'numeric' : undefined,
  })
}

export function formatMonth(day: string): string {
  return parseDay(day).toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' })
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

export function timesWord(n: number): string {
  if (n === 1) return 'once'
  if (n === 2) return 'twice'
  return `${n} times`
}

export function excerpt(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${cut.slice(0, space > max * 0.6 ? space : max)}…`
}
