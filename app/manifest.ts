import type { MetadataRoute } from 'next'

// Installable so the log screen can live on the home screen, one tap from bed.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DreamJournal',
    short_name: 'Dreams',
    description: 'Log dreams on waking and see the patterns over time.',
    start_url: '/log',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1E1B4B',
    theme_color: '#1E1B4B',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [{ name: 'Log a dream', url: '/log' }],
  }
}
