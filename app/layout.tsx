import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const serif = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: { default: 'DreamJournal', template: '%s · DreamJournal' },
  description:
    'Log a dream the moment you wake, by voice or text. Over time DreamJournal shows you what keeps coming back, and how it lines up with what is going on in your life. No mystical interpretation.',
  applicationName: 'DreamJournal',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  appleWebApp: { capable: true, title: 'DreamJournal', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: '#1E1B4B',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
