import Link from 'next/link'
import { Card } from '@/components/dashboard/ui'
import Icon from '@/components/landing/Icon'

export default function EventNotFound() {
  return (
    <Card className="max-w-md mx-auto text-center py-10">
      <span className="grid place-items-center w-12 h-12 rounded-2xl bg-black/5 text-muted mx-auto mb-3">
        <Icon name="calendar" className="w-6 h-6" />
      </span>
      <h1 className="font-display font-semibold text-lg">Event not found</h1>
      <p className="text-sm text-muted mt-1">
        This event may have been removed, or you don&apos;t have access to it.
      </p>
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1.5 mt-5 rounded-2xl bg-indigo text-white text-sm font-semibold px-4 py-2.5 hover:bg-indigo/90 transition-colors"
      >
        <Icon name="arrow" className="w-4 h-4 rotate-180" />
        Back to events
      </Link>
    </Card>
  )
}
