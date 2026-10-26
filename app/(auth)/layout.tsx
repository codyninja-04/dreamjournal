import { SampleEntry } from '@/components/marketing/SampleEntry'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex items-center justify-center px-6 py-16">{children}</div>
      <div className="relative hidden flex-col justify-center overflow-hidden border-l border-line/70 bg-deep/40 px-14 lg:flex">
        <div className="max-w-md">
          <p className="label">What you get back</p>
          <p className="heading mt-3 text-3xl leading-snug">Not what your dream &ldquo;means&rdquo;. What keeps coming back, and when.</p>
          <SampleEntry className="mt-10 animate-drift" />
        </div>
      </div>
    </div>
  )
}
