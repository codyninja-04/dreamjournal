import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GoogleAuth } from '@/components/layout/GoogleAuth'

export const metadata: Metadata = { title: 'Sign in' }

export default function Page() {
  return (
    <Suspense>
      <GoogleAuth mode="login" />
    </Suspense>
  )
}
