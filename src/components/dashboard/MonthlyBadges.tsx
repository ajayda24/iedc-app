import type { MonthlyPlacement } from '@/lib/supabase/database.types'
import Icon from '@/components/landing/Icon'

// "[Month] Winner / 2nd / 3rd" badges for a viewed profile. Feed it the rows
// from getProfileMonthlyPlacements(profileId) — one badge per month the user
// finished in the monthly leaderboard's top 3.
//
// Usage on a future profile page:
//   const placements = await getProfileMonthlyPlacements(profile.id)
//   <MonthlyBadges placements={placements} />

const PLACE = {
  1: { label: 'Winner', tint: 'bg-peach/15 text-peach ring-peach/30' },
  2: { label: '2nd', tint: 'bg-blue/12 text-blue ring-blue/25' },
  3: { label: '3rd', tint: 'bg-mint/15 text-mint ring-mint/30' },
} as const

// "2026-07-01" -> "July 2026"
function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function MonthlyBadges({
  placements,
  className = '',
}: {
  placements: MonthlyPlacement[]
  className?: string
}) {
  if (placements.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {placements.map((p) => {
        const place = PLACE[p.rank as 1 | 2 | 3] ?? PLACE[3]
        return (
          <span
            key={p.month}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${place.tint}`}
            title={`${p.month_points.toLocaleString()} pts`}
          >
            <Icon name={p.rank === 1 ? 'trophy' : 'medal'} className="w-4 h-4" />
            {monthLabel(p.month)} · {place.label}
          </span>
        )
      })}
    </div>
  )
}
