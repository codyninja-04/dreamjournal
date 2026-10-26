import Link from 'next/link'
import { LogoMark } from '@/components/layout/Logo'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-sm animate-rise-in text-center">
        <LogoMark className="mx-auto h-12 w-12" />
        <h1 className="heading mt-6 text-3xl">Nothing here</h1>
        <p className="mt-3 text-muted">That page or entry doesn&apos;t exist. If it was a dream you deleted, it&apos;s gone for good.</p>
        <Link href="/" className="btn-primary mt-6">
          Go home
        </Link>
      </div>
    </main>
  )
}
