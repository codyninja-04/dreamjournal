'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const NAV = [
  { href: '/log', label: 'Log', icon: 'moon' },
  { href: '/journal', label: 'Journal', icon: 'book' },
  { href: '/patterns', label: 'Patterns', icon: 'wave' },
  { href: '/settings', label: 'Settings', icon: 'cog' },
] as const

type IconName = (typeof NAV)[number]['icon']

export function NavIcon({ name, className = 'h-[18px] w-[18px]' }: { name: IconName; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...common}>
      {name === 'moon' && <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />}
      {name === 'book' && (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
          <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
        </>
      )}
      {name === 'wave' && <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0M3 18c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0M3 6c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" />}
      {name === 'cog' && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </>
      )}
    </svg>
  )
}

export function useActive() {
  const path = usePathname()
  return (href: string) => {
    if (href === '/journal') return path === '/journal' || path.startsWith('/entries/')
    return path === href || path.startsWith(`${href}/`)
  }
}

export function NavLinks({ variant }: { variant: 'side' | 'bottom' }) {
  const isActive = useActive()
  if (variant === 'bottom') {
    return (
      <>
        {NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold tracking-wide transition ${
                active ? 'text-primary-bright' : 'text-faint hover:text-ink'
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </>
    )
  }
  return (
    <>
      {NAV.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? 'bg-surface/80 text-ink' : 'text-muted hover:bg-surface/40 hover:text-ink'
            }`}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        )
      })}
    </>
  )
}
