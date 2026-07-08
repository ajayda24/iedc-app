// Single stacked bar for a categorical part-to-whole (certificate types). This
// is the ONE place we use categorical color, so the hues are the validated
// 4-slot set (indigo / sky / mint / peach, darkened to pass the CVD + lightness
// checks in light mode — the app has no dark mode). Every segment is also
// direct-labeled in the legend with its count, so identity never rests on color
// alone, and a 2px surface gap separates adjacent fills. Server-safe.

export interface Segment {
  label: string
  value: number
}

// Fixed hue order — assigned by slot, never cycled. Matches scripts/validate
// output: #5a4bd6,#2699d6,#1aa88a,#e07a4d all-pass (light).
const HUES = ['#5a4bd6', '#2699d6', '#1aa88a', '#e07a4d']

export default function SegmentedBar({
  segments,
  emptyLabel = 'None issued yet.',
}: {
  segments: Segment[]
  emptyLabel?: string
}) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total === 0) return <p className="text-sm text-muted">{emptyLabel}</p>

  return (
    <div>
      {/* Stacked bar with a 2px surface gap between segments */}
      <div className="flex gap-[2px] h-3 rounded-full overflow-hidden mb-4">
        {segments.map((seg, i) => {
          if (seg.value === 0) return null
          const pct = (seg.value / total) * 100
          return (
            <div
              key={seg.label}
              style={{ width: `${pct}%`, backgroundColor: HUES[i % HUES.length] }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              role="presentation"
            />
          )
        })}
      </div>

      {/* Legend + counts — identity + value, not color alone */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {segments.map((seg, i) => (
          <li key={seg.label} className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: HUES[i % HUES.length] }}
            />
            <span className="text-ink-soft truncate">{seg.label}</span>
            <span className="ml-auto font-display font-semibold tabular-nums">
              {seg.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
