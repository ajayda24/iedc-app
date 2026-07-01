import type {
  EventCategory,
  RegistrationStatus,
} from '@/lib/supabase/database.types'

// Short month/day for event date chips, e.g. { mon: 'JUN', day: '05' }.
export function dateChip(iso: string): { mon: string; day: string } {
  const d = new Date(iso)
  return {
    mon: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: d.toLocaleString('en-US', { day: '2-digit' }),
  }
}

// "9:00 AM · Seminar Hall"
export function eventTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  hackathon: 'Hackathon',
  competition: 'Competition',
  talk: 'Talk',
  meeting: 'Meeting',
}

export const REG_STATUS: Record<
  RegistrationStatus,
  { label: string; tint: 'indigo' | 'mint' | 'peach' | 'muted' }
> = {
  registered: { label: 'Registered', tint: 'indigo' },
  attended: { label: 'Attended', tint: 'mint' },
  absent: { label: 'Absent', tint: 'peach' },
  cancelled: { label: 'Cancelled', tint: 'muted' },
}
