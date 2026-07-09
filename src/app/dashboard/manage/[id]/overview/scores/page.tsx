import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/auth/queries'
import {
  getEvent,
  listEventRegistrations,
  scoresForEvent,
} from '@/lib/queries'
import { Card, EmptyState } from '@/components/dashboard/ui'
import { fullDate, eventTime } from '@/components/dashboard/format'
import Icon from '@/components/landing/Icon'
import ScoreRow from '@/components/dashboard/ScoreRow'

export default async function EventScoresPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [, { id }] = await Promise.all([requireStaff(), params])
  const [event, regs, scores] = await Promise.all([
    getEvent(id),
    listEventRegistrations(id),
    scoresForEvent(id),
  ])
  if (!event) notFound()

  // Scores only make sense for people who attended.
  const attendees = regs.filter((r) => r.status === 'attended')

  const scoreByProfile = new Map(scores.map((s) => [s.profile_id, s]))

  // Order: ranked first (by rank asc), then by score desc, then by name — so the
  // winner rises to the top of the list.
  const rows = attendees.slice().sort((a, b) => {
    const sa = scoreByProfile.get(a.profile_id)
    const sb = scoreByProfile.get(b.profile_id)
    const ra = sa?.rank ?? Infinity
    const rb = sb?.rank ?? Infinity
    if (ra !== rb) return ra - rb
    const va = sa?.score ?? -Infinity
    const vb = sb?.score ?? -Infinity
    if (va !== vb) return vb - va
    return (a.profile?.name ?? '').localeCompare(b.profile?.name ?? '')
  })

  return (
    <div className="space-y-5">
      {/* Back + heading */}
      <div>
        <Link
          href={`/dashboard/manage/${id}/overview`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-indigo transition-colors"
        >
          <Icon name="arrow" className="w-4 h-4 rotate-180" />
          Back to overview
        </Link>
        <h1 className="font-display font-bold text-2xl sm:text-3xl mt-2">
          Scores &amp; winners
        </h1>
        <p className="text-ink-soft mt-1">
          {event.title} · {fullDate(event.start_date)} ·{' '}
          {eventTime(event.start_date)}
        </p>
        <p className="text-sm text-muted mt-1">
          Enter a score and an optional rank (1 = winner). Scores add to the
          student&apos;s points. Winner certificates stay manual on the overview.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon="team"
            title="No attendees to score yet"
            hint="Mark students Present on the overview to score them here."
          />
        ) : (
          <ul className="divide-y divide-black/5">
            {rows.map((r) => {
              const name = r.profile?.name ?? 'Unknown student'
              const initials = name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join('')
              const s = scoreByProfile.get(r.profile_id)
              const isWinner = s?.rank === 1
              return (
                <li
                  key={r.id}
                  className={`flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5 ${
                    isWinner ? 'bg-mint/10' : ''
                  }`}
                >
                  {/* Avatar */}
                  {r.profile?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.profile.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-indigo/12 text-indigo text-sm font-semibold shrink-0">
                      {initials || '?'}
                    </span>
                  )}

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate flex items-center gap-2">
                      {name}
                      {isWinner && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-mint/20 px-2 py-0.5 text-xs font-semibold text-mint">
                          <Icon name="spark" className="w-3 h-3" />
                          Winner
                        </span>
                      )}
                      {s?.rank != null && s.rank > 1 && (
                        <span className="inline-flex items-center rounded-full bg-indigo/12 px-2 py-0.5 text-xs font-semibold text-indigo">
                          Rank {s.rank}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted truncate">
                      {r.profile?.student_id ?? '—'}
                      {r.profile?.department ? ` · ${r.profile.department}` : ''}
                    </p>
                  </div>

                  {/* Score entry */}
                  <div className="w-full sm:w-auto flex justify-end shrink-0">
                    <ScoreRow
                      eventId={id}
                      profileId={r.profile_id}
                      initialScore={s?.score ?? null}
                      initialRank={s?.rank ?? null}
                      initialRemarks={s?.remarks ?? null}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
