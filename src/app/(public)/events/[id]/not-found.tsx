import Link from 'next/link'
import Icon from '@/components/landing/Icon'

export default function EventNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo/10 text-indigo">
        <Icon name="calendar" className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold">Event not found</h1>
      <p className="mt-2 text-ink-soft">
        This event may have been removed, or the link is incorrect.
      </p>
      <Link
        href="/events"
        className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
      >
        Browse events
        <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  )
}
