import { Logo } from './Logo'
import { NavLinks } from './nav'

// Phone chrome: a slim top bar and a thumb reachable bottom bar. Most dreams
// get logged one handed, half awake, so the log tab sits first.
export function Header() {
  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b border-line/60 bg-bg/85 px-4 py-3 backdrop-blur md:hidden"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Logo href="/log" />
      </header>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line/60 bg-deep/90 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <NavLinks variant="bottom" />
      </nav>
    </>
  )
}
