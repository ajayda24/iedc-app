// Vertical column chart for a monthly time series. Single measure = single hue
// (sequential indigo). Values are shown on hover-free direct labels above the
// tallest few and always via the accessible table fallback in the parent card.
// One y-scale only (never dual-axis). Server-safe.

export interface ColumnPoint {
  label: string // x tick, e.g. "Jul"
  value: number
  // Optional secondary value drawn as a lighter overlay bar inside the column
  // (must be <= value; e.g. attended within registrations). Same hue family.
  overlay?: number
}

export default function Columns({
  points,
  overlayLabel,
  primaryLabel,
}: {
  points: ColumnPoint[]
  primaryLabel?: string
  overlayLabel?: string
}) {
  const max = Math.max(...points.map((p) => p.value), 1)
  const hasOverlay = points.some((p) => p.overlay != null)

  return (
    <div>
      {/* Legend — present whenever there are two series. Identity via label,
          not color alone. */}
      {hasOverlay && (primaryLabel || overlayLabel) && (
        <div className="flex items-center gap-4 mb-3 text-xs text-muted">
          {primaryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo/30" />
              {primaryLabel}
            </span>
          )}
          {overlayLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo" />
              {overlayLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex items-end gap-1.5 h-40">
        {points.map((p, i) => {
          const h = (p.value / max) * 100
          const oh = p.overlay != null ? (p.overlay / max) * 100 : 0
          return (
            <div
              key={`${p.label}-${i}`}
              className="flex-1 min-w-0 flex flex-col items-center justify-end h-full"
            >
              {/* value label above the column */}
              <span className="text-[0.65rem] font-semibold text-ink-soft tabular-nums mb-1">
                {p.value > 0 ? p.value : ''}
              </span>
              <div className="relative w-full flex justify-center h-full items-end">
                {/* primary column (lighter when an overlay is present) */}
                <div
                  className={`w-full max-w-[2rem] rounded-t-md ${
                    hasOverlay ? 'bg-indigo/25' : 'bg-indigo'
                  }`}
                  style={{ height: `${Math.max(h, p.value > 0 ? 2 : 0)}%` }}
                >
                  {/* overlay (e.g. attended) sits at the base, full-hue */}
                  {p.overlay != null && (
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[2rem] rounded-t-md bg-indigo"
                      style={{ height: `${Math.max(oh, p.overlay > 0 ? 2 : 0)}%` }}
                    />
                  )}
                </div>
              </div>
              {/* x tick */}
              <span className="text-[0.6rem] text-muted mt-1.5 truncate w-full text-center">
                {p.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
