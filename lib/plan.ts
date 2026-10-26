import type { Plan } from './types'

// Free from the spec: unlimited text logging and the basic journal. Pro adds
// voice logging, Claude pattern analysis, full text search and export. Limits
// only apply when ENFORCE_PRO is on, so the app is fully usable before billing.
export function enforcingPlans(): boolean {
  return process.env.ENFORCE_PRO === 'true'
}

export function limitsFor(plan: Plan) {
  const limited = enforcingPlans() && plan !== 'pro'
  return {
    voice: !limited,
    patterns: !limited,
    search: !limited,
    export: !limited,
  }
}

export type Limits = ReturnType<typeof limitsFor>

// Hard ceilings on paid API calls for everyone, pro included, so a stuck
// client or a runaway script can't run up the bill.
export const DAILY_STRUCTURE_CAP = 40
export const DAILY_VOICE_CAP = 20
export const DAILY_ANALYSIS_CAP = 6

// The patterns page looks at this many recent dreams, per the spec.
export const ANALYSIS_WINDOW = 20
// Below this there isn't really a pattern to talk about.
export const MIN_DREAMS_FOR_ANALYSIS = 5

export function startOfUtcDayIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}
