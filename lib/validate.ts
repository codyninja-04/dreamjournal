// Small input parsers for the API routes. Each throws a BadInput with a message
// that's safe to show the user as is.
export class BadInput extends Error {}

export function str(v: unknown, field: string, opts: { max: number; required?: boolean }): string | null {
  if (v == null || (typeof v === 'string' && v.trim() === '')) {
    if (opts.required) throw new BadInput(`${field} is required`)
    return null
  }
  if (typeof v !== 'string') throw new BadInput(`${field} should be text`)
  const s = v.trim()
  if (s.length > opts.max) throw new BadInput(`${field} is too long (max ${opts.max} characters)`)
  return s
}

export function num(v: unknown, field: string, opts: { min?: number; max?: number; required?: boolean } = {}): number | null {
  if (v == null || v === '') {
    if (opts.required) throw new BadInput(`${field} is required`)
    return null
  }
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  if (!Number.isFinite(n)) throw new BadInput(`${field} should be a number`)
  if (opts.min != null && n < opts.min) throw new BadInput(`${field} can't be below ${opts.min}`)
  if (opts.max != null && n > opts.max) throw new BadInput(`${field} can't be above ${opts.max}`)
  return n
}

export function oneOf<T extends string>(v: unknown, field: string, options: readonly T[]): T {
  if (typeof v === 'string' && (options as readonly string[]).includes(v)) return v as T
  throw new BadInput(`${field} isn't one of ${options.join(', ')}`)
}

export function bool(v: unknown): boolean {
  return v === true || v === 'true'
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadInput('Send a JSON object')
  return body as Record<string, unknown>
}

// Wrap route bodies so a BadInput turns into a 400 with its message.
export function badRequest(e: unknown): Response {
  if (e instanceof BadInput) return Response.json({ error: e.message }, { status: 400 })
  throw e
}
