// A static example of what a logged dream turns into. Used on the landing page
// and next to the sign in form, so people see the output before signing up.
export function SampleEntry({ className = '' }: { className?: string }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between border-b border-line/70 px-5 py-3">
        <span className="font-mono text-xs text-faint">Tue 14 Oct</span>
        <span className="chip border-primary/30 text-primary-bright">voice · 0:48</span>
      </div>
      <div className="space-y-4 p-5">
        <p className="font-serif text-[0.98rem] italic leading-relaxed text-ink/90">
          &ldquo;I was back in the old school hall and the exam had already started. I couldn&apos;t find my seat and my pen kept running out&hellip;&rdquo;
        </p>
        <div className="flex flex-wrap gap-1.5">
          <span className="chip border-unease/30 bg-unease-soft text-unease">anxious</span>
          <span className="chip border-unease/30 bg-unease-soft text-unease">rushed</span>
          <span className="chip">exam</span>
          <span className="chip">school hall</span>
          <span className="chip">pen</span>
        </div>
        <div className="rounded-xl border border-dawn/25 bg-dawn-soft p-3.5">
          <p className="label text-dawn/80">Seen before</p>
          <p className="mt-1 text-sm text-ink/90">
            <span className="font-medium">exam</span>, 4 times this month. All four were logged during the deadline you noted on 2 Oct.
          </p>
        </div>
      </div>
    </div>
  )
}
