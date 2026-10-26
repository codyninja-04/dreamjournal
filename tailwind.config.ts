import type { Config } from 'tailwindcss'

// Palette from the spec: deep indigo night, a lighter indigo surface, periwinkle
// for actions and pale lavender text. The rest are steps between those, plus
// three soft tones for how a dream felt.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#1E1B4B',
        deep: '#15133A',
        surface: '#312E81',
        raised: '#2A2770',
        line: '#3D3A8C',
        strong: '#5450AE',
        ink: '#E0E7FF',
        muted: '#A9AEDB',
        faint: '#7D80B9',
        primary: { DEFAULT: '#818CF8', bright: '#A5B4FC', dark: '#6366F1', ink: '#16133F' },
        dawn: { DEFAULT: '#F5CF9C', soft: '#F5CF9C1F' },
        calm: { DEFAULT: '#7DD3C0', soft: '#7DD3C01F' },
        unease: { DEFAULT: '#F0A6C8', soft: '#F0A6C81F' },
        mixed: { DEFAULT: '#C4B5FD', soft: '#C4B5FD1F' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(224, 231, 255, 0.04) inset, 0 12px 32px -18px rgba(5, 4, 30, 0.7)',
        glow: '0 0 0 1px rgba(129, 140, 248, 0.35), 0 0 48px -8px rgba(129, 140, 248, 0.45)',
      },
      keyframes: {
        'rise-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        breathe: { '0%, 100%': { transform: 'scale(1)', opacity: '0.55' }, '50%': { transform: 'scale(1.18)', opacity: '0' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        drift: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      animation: {
        'rise-in': 'rise-in 0.35s ease-out both',
        breathe: 'breathe 1.8s ease-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        drift: 'drift 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
