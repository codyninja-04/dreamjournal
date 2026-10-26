'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ToneWeek } from '@/lib/patterns/stats'

// Validated for the dark surface (lightness band, chroma, CVD and contrast).
// Neutral is folded into "mixed" on purpose: a gray fourth band failed the
// separation checks next to both of its neighbours.
const SERIES = [
  { key: 'positive', label: 'Mostly good', color: '#1FA58A' },
  { key: 'mixed', label: 'Mixed or neutral', color: '#8B7CF0' },
  { key: 'negative', label: 'Mostly heavy', color: '#D9578F' },
] as const

const SURFACE = '#2A2770'

type Row = { label: string; weekStart: string; positive: number; mixed: number; negative: number; total: number }

export function EmotionTrendChart({ weeks }: { weeks: ToneWeek[] }) {
  const rows: Row[] = weeks.map((w) => ({
    label: w.label,
    weekStart: w.weekStart,
    positive: w.positive,
    mixed: w.mixed + w.neutral,
    negative: w.negative,
    total: w.positive + w.mixed + w.neutral + w.negative,
  }))
  const any = rows.some((r) => r.total > 0)

  return (
    <figure>
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            {s.label}
          </li>
        ))}
      </ul>

      {any ? (
        <div className="h-56 w-full" role="img" aria-label="Dreams per week, split by how they felt">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="#3D3A8C" strokeOpacity={0.5} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#7D80B9', fontSize: 11 }} interval="preserveStartEnd" minTickGap={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#7D80B9', fontSize: 11 }} width={40} />
              <Tooltip cursor={{ fill: 'rgba(129,140,248,0.08)' }} content={<TrendTooltip />} />
              {SERIES.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stackId="tone"
                  fill={s.color}
                  stroke={SURFACE}
                  strokeWidth={2}
                  radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="grid h-40 place-items-center rounded-xl border border-dashed border-line text-sm text-faint">Dreams with emotions tagged will show up here.</p>
      )}

      {any && (
        <details className="mt-3 text-xs text-faint">
          <summary className="cursor-pointer hover:text-muted">Show as a table</summary>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-faint">
                <th className="py-1 font-medium">Week of</th>
                {SERIES.map((s) => (
                  <th key={s.key} className="py-1 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono text-muted">
              {rows
                .filter((r) => r.total > 0)
                .map((r) => (
                  <tr key={r.weekStart} className="border-t border-line/50">
                    <td className="py-1 font-sans">{r.label}</td>
                    <td className="py-1 text-right">{r.positive}</td>
                    <td className="py-1 text-right">{r.mixed}</td>
                    <td className="py-1 text-right">{r.negative}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      )}
    </figure>
  )
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-line bg-deep/95 px-3 py-2.5 text-xs shadow-card backdrop-blur">
      <p className="font-medium text-ink">Week of {row.label}</p>
      {row.total === 0 ? (
        <p className="mt-1 text-faint">No tagged dreams</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-5 text-muted">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} aria-hidden />
                {s.label}
              </span>
              <span className="font-mono text-ink">{row[s.key]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
