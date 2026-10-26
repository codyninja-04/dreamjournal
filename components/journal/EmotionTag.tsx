import Link from 'next/link'
import { valenceOf } from '@/lib/patterns/labels'

const TONES = {
  positive: 'border-calm/30 bg-calm-soft text-calm',
  negative: 'border-unease/30 bg-unease-soft text-unease',
  neutral: 'border-mixed/25 bg-mixed-soft text-mixed',
} as const

// Emotions get a soft tint by how they feel. Symbols and people stay plain,
// they're facts about the dream rather than a mood.
export function EmotionTag({ emotion, href, onRemove }: { emotion: string; href?: string; onRemove?: () => void }) {
  const cls = `chip ${TONES[valenceOf(emotion)]}`
  if (href) {
    return (
      <Link href={href} className={`${cls} transition hover:brightness-125`}>
        {emotion}
      </Link>
    )
  }
  return (
    <span className={cls}>
      {emotion}
      {onRemove && <RemoveButton label={emotion} onClick={onRemove} />}
    </span>
  )
}

export function LabelTag({ label, href, onRemove }: { label: string; href?: string; onRemove?: () => void }) {
  if (href) {
    return (
      <Link href={href} className="chip transition hover:border-strong hover:text-ink">
        {label}
      </Link>
    )
  }
  return (
    <span className="chip text-ink/85">
      {label}
      {onRemove && <RemoveButton label={label} onClick={onRemove} />}
    </span>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`Remove ${label}`} className="-mr-1 rounded-full p-0.5 opacity-60 transition hover:bg-white/10 hover:opacity-100">
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  )
}
