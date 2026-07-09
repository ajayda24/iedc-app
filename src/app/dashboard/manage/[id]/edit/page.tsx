import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/auth/queries'
import { getEvent } from '@/lib/queries'
import { Card } from '@/components/dashboard/ui'
import Icon from '@/components/landing/Icon'
import EventForm from '@/components/dashboard/EventForm'

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [, { id }] = await Promise.all([requireStaff(), params])
  const event = await getEvent(id)
  if (!event) notFound()

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link
          href="/dashboard/manage"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-indigo transition-colors"
        >
          <Icon name="arrow" className="w-4 h-4 rotate-180" />
          Back to events
        </Link>
        <h1 className="font-display font-bold text-2xl sm:text-3xl mt-2">
          Edit event
        </h1>
      </div>
      <Card>
        <EventForm event={event} />
      </Card>
    </div>
  )
}
