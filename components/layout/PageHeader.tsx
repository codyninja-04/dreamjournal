export function PageHeader({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="label mb-2">{eyebrow}</p>}
        <h1 className="heading text-3xl sm:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
