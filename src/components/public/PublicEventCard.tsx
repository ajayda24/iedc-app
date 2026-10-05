import Link from 'next/link'
import Icon from '@/components/landing/Icon'
import { CATEGORY_LABEL, dateChip, eventTime } from '@/components/dashboard/format'
import type { PublicEventCard as PublicEvent } from '@/lib/public/events'
import EventStateBadge from './EventStateBadge'

// Card for the public /events grid. Links to the public detail page, where
// students can register with their student ID + email.
export default function PublicEventCard({ event: ev }: { event: PublicEvent }) {
  const chip = dateChip(ev.start_date)
  const fewLeft =
    ev.state === 'open' && ev.spotsLeft != null && ev.spotsLeft <= 10

  return (
    <Link
      href={`/events/${ev.id}`}
      className="group glass flex flex-col overflow-hidden rounded-3xl transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-20px_rgba(40,52,92,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
    >
      <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-indigo/25 via-blue/15 to-mint/20">
        {ev.banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ev.banner}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <Icon
            name="calendar"
            className="absolute bottom-3 right-4 h-16 w-16 text-white/50"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-indigo shadow-sm">
          {CATEGORY_LABEL[ev.category]}
        </span>
        <div className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/95 text-indigo shadow-sm">
          <span className="font-display text-sm font-bold leading-none">
            {chip.day}
          </span>
          <span className="text-[0.6rem] font-semibold">{chip.mon}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="line-clamp-2 font-display text-[1.05rem] font-semibold leading-snug text-ink transition-colors group-hover:text-indigo">
          {ev.title}
        </h3>

        <div className="space-y-1.5 text-sm text-ink-soft">
          <p className="flex items-center gap-2">
            <Icon name="clock" className="h-4 w-4 shrink-0 text-muted" />
            {eventTime(ev.start_date)}
          </p>
          {ev.venue && (
            <p className="flex items-center gap-2">
              <Icon name="compass" className="h-4 w-4 shrink-0 text-muted" />
              <span className="truncate">{ev.venue}</span>
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3">
          <EventStateBadge state={ev.state} />
          <span className="text-xs font-medium text-muted">
            {fewLeft
              ? `${ev.spotsLeft} spot${ev.spotsLeft === 1 ? '' : 's'} left`
              : ev.points > 0
                ? `${ev.points} activity pts`
                : ''}
          </span>
        </div>
      </div>
    </Link>
  )
}
