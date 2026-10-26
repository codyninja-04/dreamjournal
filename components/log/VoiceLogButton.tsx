'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Five minutes is plenty for a dream, and keeps the upload small.
const MAX_SECONDS = 300

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m))
}

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type State = 'idle' | 'asking' | 'recording'

// One big button. Tap to start, tap to stop. The ring around it follows your
// voice so you can tell the mic is actually hearing you, eyes half open.
export function VoiceLogButton({ onRecorded, disabled }: { onRecorded: (audio: Blob) => void; disabled?: boolean }) {
  const [state, setState] = useState<State>('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const ring = useRef<HTMLSpanElement | null>(null)
  const raf = useRef<number | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const teardown = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    if (raf.current) cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    audioCtx.current?.close().catch(() => {})
    timer.current = null
    raf.current = null
    stream.current = null
    audioCtx.current = null
  }, [])

  useEffect(() => teardown, [teardown])

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop()
  }, [])

  useEffect(() => {
    if (seconds >= MAX_SECONDS) stop()
  }, [seconds, stop])

  async function start() {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError("This browser can't record audio. Type it out instead.")
      return
    }
    setState('asking')
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      stream.current = media
      const mimeType = pickMime()
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
      chunks.current = []
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: rec.mimeType || mimeType || 'audio/webm' })
        teardown()
        setState('idle')
        setSeconds(0)
        if (blob.size > 0) onRecorded(blob)
        else setError("That recording came out empty. Give it another go.")
      }
      recorder.current = rec
      rec.start(1000)
      setState('recording')
      setSeconds(0)
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000)
      meter(media)
    } catch (e) {
      teardown()
      setState('idle')
      const denied = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
      setError(denied ? 'Microphone access is blocked. Allow it in your browser settings, or type it out.' : "Couldn't start the microphone. Type it out instead.")
    }
  }

  function meter(media: MediaStream) {
    try {
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(media).connect(analyser)
      audioCtx.current = ctx
      const data = new Uint8Array(analyser.fftSize)
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (const v of data) sum += ((v - 128) / 128) ** 2
        const level = Math.min(1, Math.sqrt(sum / data.length) * 4)
        if (ring.current) ring.current.style.transform = `scale(${1 + level * 0.35})`
        raf.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // The level ring is a nicety. Recording works without it.
    }
  }

  const recording = state === 'recording'

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid h-44 w-44 place-items-center">
        {recording && (
          <>
            <span ref={ring} aria-hidden className="absolute inset-3 rounded-full bg-primary/20 transition-transform duration-75" />
            <span aria-hidden className="absolute inset-3 animate-breathe rounded-full border border-primary/50" />
          </>
        )}
        {!recording && <span aria-hidden className="absolute inset-3 rounded-full bg-primary/10 blur-xl" />}
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={disabled || state === 'asking'}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          className={`relative grid h-32 w-32 place-items-center rounded-full transition active:scale-95 disabled:opacity-50 ${
            recording ? 'bg-dawn text-deep shadow-[0_0_60px_-10px_rgba(245,207,156,0.7)]' : 'bg-primary text-primary-ink shadow-glow hover:bg-primary-bright'
          }`}
        >
          {recording ? (
            <span className="h-8 w-8 rounded-md bg-deep" aria-hidden />
          ) : (
            <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-3 h-6 font-mono text-sm tabular-nums text-muted" aria-live="polite">
        {recording ? `${clock(seconds)} · tap to finish` : state === 'asking' ? 'Waiting for the mic…' : 'Tap and talk'}
      </p>
      {recording && seconds >= MAX_SECONDS - 30 && <p className="mt-1 text-xs text-dawn">Stops at {clock(MAX_SECONDS)}</p>}
      {error && (
        <p role="alert" className="mt-2 max-w-xs text-center text-sm text-unease">
          {error}
        </p>
      )}
    </div>
  )
}
