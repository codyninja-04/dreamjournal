import Link from 'next/link'

// One recurring element: how often, the note, and a strip with one cell per
// dream in the window (oldest on the left) so you can see when it clusters.
export function RecurringElementCard({
  element,
  frequency,
  total,
  note,
  strip,
  filterLabel,
}: {
  element: string
  frequency: number
  total: number
  note?: string
  strip: boolean[]
  filterLabel?: string
}) {
  const lit = strip.some(Boolean)
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-xl capitalize text-ink">{element}</h3>
        <p className="shrink-0 font-mono text-sm text-primary-bright">
          {frequency}
          <span className="text-faint"> / {total}</span>
        </p>
      </div>
      {lit && (
        <div className="mt-3 flex gap-[3px]" aria-label={`Appeared in ${frequency} of the last ${total} dreams`} role="img">
          {strip.map((on, i) => (
            <span key={i} className={`h-4 flex-1 rounded-[3px] ${on ? 'bg-primary-bright' : 'bg-line/60'}`} />
          ))}
        </div>
      )}
      {note && <p className="mt-3 text-sm leading-relaxed text-muted">{note}</p>}
      {filterLabel && (
        <Link href={`/journal?symbol=${encodeURIComponent(filterLabel)}`} className="mt-auto pt-3 text-xs font-medium text-faint hover:text-ink">
          See these dreams →
        </Link>
      )}
    </div>
  )
}
