import type {
  EventCategory,
  EventStatus,
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

// "Thursday, July 3, 2026"
export function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// A start–end time span. Same-day: "9:00 AM – 11:00 AM". Spans days or no end:
// falls back to the start time only.
export function timeRange(startIso: string, endIso: string | null): string {
  const start = eventTime(startIso)
  if (!endIso) return start
  const s = new Date(startIso)
  const e = new Date(endIso)
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate()
  return sameDay ? `${start} – ${eventTime(endIso)}` : start
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

// Ordinal academic year for display, e.g. 1 -> "1st Year", 3 -> "3rd Year".
export function yearLabel(year: number): string {
  const suffix =
    year % 10 === 1 && year % 100 !== 11
      ? 'st'
      : year % 10 === 2 && year % 100 !== 12
        ? 'nd'
        : year % 10 === 3 && year % 100 !== 13
          ? 'rd'
          : 'th'
  return `${year}${suffix} Year`
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  hackathon: 'Hackathon',
  competition: 'Competition',
  talk: 'Talk',
  meeting: 'Meeting',
}

export const EVENT_STATUS: Record<
  EventStatus,
  { label: string; tint: 'indigo' | 'mint' | 'peach' | 'muted' }
> = {
  draft: { label: 'Draft', tint: 'muted' },
  published: { label: 'Published', tint: 'indigo' },
  completed: { label: 'Completed', tint: 'mint' },
  cancelled: { label: 'Cancelled', tint: 'peach' },
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
