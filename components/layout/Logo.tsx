import Link from 'next/link'

export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#312E81" />
      <path d="M40.5 15.5a17 17 0 1 0 8 24.6A14 14 0 0 1 40.5 15.5z" fill="#A5B4FC" />
      <circle cx="45" cy="20" r="1.8" fill="#F5CF9C" />
      <circle cx="50" cy="29" r="1.1" fill="#E0E7FF" />
    </svg>
  )
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-ink">
      <LogoMark />
      <span className="font-serif text-[1.15rem] tracking-tight">DreamJournal</span>
    </Link>
  )
}
