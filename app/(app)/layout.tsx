import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { displayName, requireUser } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, plan } = await requireUser()

  return (
    <div className="flex min-h-screen">
      <Sidebar name={displayName(user)} plan={plan} />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="mx-auto max-w-4xl px-4 pb-28 pt-6 sm:px-6 md:pb-16 md:pt-12">{children}</main>
      </div>
    </div>
  )
}
