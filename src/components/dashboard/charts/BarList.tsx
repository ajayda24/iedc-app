// Horizontal bar list — the workhorse for magnitude comparisons (points per
// dept, registrations per category, top events…). Sequential single hue: bars
// are all indigo, magnitude read by length, with the value direct-labeled at the
// row end so identity/reading never rests on color alone (satisfies the low-
// contrast pastel's relief requirement). Server-safe, no client JS.

export interface BarItem {
  label: string
  value: number
  // Optional secondary muted value shown after the label (e.g. "· 3 events").
  sub?: string
  // Optional href to make the row a link (e.g. top events → overview).
  href?: string
}

export default function BarList({
  items,
  valueFormat = (v) => String(v),
  emptyLabel = 'No data yet.',
}: {
  items: BarItem[]
  valueFormat?: (v: number) => string
  emptyLabel?: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>
  }
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => {
        const pct = Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)
        return (
          <li key={`${item.label}-${i}`} className="text-sm">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="font-medium text-ink-soft truncate min-w-0">
                {item.label}
                {item.sub && (
                  <span className="text-muted font-normal"> · {item.sub}</span>
                )}
              </span>
              <span className="font-display font-semibold tabular-nums shrink-0">
                {valueFormat(item.value)}
              </span>
            </div>
            {/* Track + fill. 4px rounded data-end, thin (8px) mark. */}
            <div className="h-2 rounded-full bg-black/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo"
                style={{ width: `${pct}%` }}
                role="presentation"
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
