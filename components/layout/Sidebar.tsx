import { Logo } from './Logo'
import { NavLinks } from './nav'

// Desktop navigation. On phones the Header and the bottom bar take over.
export function Sidebar({ name, plan }: { name: string; plan: string }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line/70 bg-deep/40 px-4 py-6 md:flex">
      <div className="px-2">
        <Logo href="/log" />
      </div>
      <nav className="mt-10 flex flex-col gap-1">
        <NavLinks variant="side" />
      </nav>
      <div className="mt-auto rounded-xl border border-line/70 bg-raised/50 p-3">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs capitalize text-faint">{plan} plan</p>
        <form action="/auth/signout" method="post" className="mt-2">
          <button className="text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline">Sign out</button>
        </form>
      </div>
    </aside>
  )
}
