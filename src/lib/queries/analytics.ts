import 'server-only'

// Analytics aggregations for the staff dashboard (coordinator + admin). Reads are
// RLS-respecting; staff can see drafts + all registrations, so counts here are
// the full picture. Most figures are assembled in TS from a few broad queries
// rather than per-row round-trips.
import { createClient } from '@/lib/supabase/server'
import type {
  EventCategory,
  EventStatus,
  CertificateType,
} from '@/lib/supabase/database.types'

export interface AnalyticsKpis {
  totalEvents: number
  eventsByStatus: Record<EventStatus, number>
  totalRegistrations: number // active (non-cancelled)
  totalAttended: number
  attendanceRate: number // attended / active, 0..1
  totalCertificates: number
  totalStudents: number
  activeStudents: number
}

export interface MonthPoint {
  month: string // YYYY-MM
  events: number
  registrations: number
  attended: number
}

export interface CategoryStat {
  category: EventCategory
  events: number
  registrations: number
}

export interface TopEvent {
  id: string
  title: string
  status: EventStatus
  category: EventCategory
  start_date: string
  registrations: number
  attended: number
}

export interface CertTypeStat {
  type: CertificateType
  count: number
}

export interface AnalyticsData {
  kpis: AnalyticsKpis
  months: MonthPoint[]
  categories: CategoryStat[]
  topEvents: TopEvent[]
  certTypes: CertTypeStat[]
}

const EVENT_STATUSES: EventStatus[] = [
  'draft',
  'published',
  'completed',
  'cancelled',
]
const CERT_TYPES: CertificateType[] = [
  'participation',
  'winner',
  'runnerup',
  'volunteer',
]

// YYYY-MM key in local time (matches how events are displayed).
function ymKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// The trailing `count` months up to and including the current month, as empty
// buckets — so the trend chart shows continuous months even with gaps.
function monthBuckets(count: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

export async function getAnalytics(monthsBack = 12): Promise<AnalyticsData> {
  const supabase = await createClient()

  // Pull the raw rows we aggregate from, in parallel. These are staff-scoped by
  // RLS (all events incl. drafts, all registrations).
  const [
    { data: events },
    { data: regs },
    { data: certs },
    { count: studentCount },
    { count: activeCount },
  ] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, status, category, start_date'),
    supabase.from('event_registrations').select('event_id, status'),
    supabase.from('certificates').select('certificate_type'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student'),
    supabase
      .from('profiles_current')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('is_active', true),
  ])

  const eventRows =
    (events as {
      id: string
      title: string
      status: EventStatus
      category: EventCategory
      start_date: string
    }[]) ?? []
  const regRows =
    (regs as { event_id: string; status: string }[]) ?? []
  const certRows =
    (certs as { certificate_type: CertificateType }[]) ?? []

  // --- Registration tallies per event (active + attended) -------------------
  const activeByEvent = new Map<string, number>()
  const attendedByEvent = new Map<string, number>()
  let totalRegistrations = 0
  let totalAttended = 0
  for (const r of regRows) {
    if (r.status === 'cancelled') continue
    totalRegistrations++
    activeByEvent.set(r.event_id, (activeByEvent.get(r.event_id) ?? 0) + 1)
    if (r.status === 'attended') {
      totalAttended++
      attendedByEvent.set(r.event_id, (attendedByEvent.get(r.event_id) ?? 0) + 1)
    }
  }

  // --- KPIs -----------------------------------------------------------------
  const eventsByStatus = Object.fromEntries(
    EVENT_STATUSES.map((s) => [s, 0])
  ) as Record<EventStatus, number>
  for (const e of eventRows) eventsByStatus[e.status]++

  const kpis: AnalyticsKpis = {
    totalEvents: eventRows.length,
    eventsByStatus,
    totalRegistrations,
    totalAttended,
    attendanceRate:
      totalRegistrations > 0 ? totalAttended / totalRegistrations : 0,
    totalCertificates: certRows.length,
    totalStudents: studentCount ?? 0,
    activeStudents: activeCount ?? 0,
  }

  // --- Monthly trend --------------------------------------------------------
  const buckets = monthBuckets(monthsBack)
  const bucketSet = new Set(buckets)
  const monthMap = new Map<string, MonthPoint>(
    buckets.map((m) => [m, { month: m, events: 0, registrations: 0, attended: 0 }])
  )
  for (const e of eventRows) {
    const key = ymKey(e.start_date)
    if (!bucketSet.has(key)) continue
    const mp = monthMap.get(key)!
    mp.events++
    mp.registrations += activeByEvent.get(e.id) ?? 0
    mp.attended += attendedByEvent.get(e.id) ?? 0
  }
  const months = buckets.map((m) => monthMap.get(m)!)

  // --- By category ----------------------------------------------------------
  const catMap = new Map<EventCategory, CategoryStat>()
  for (const e of eventRows) {
    const c =
      catMap.get(e.category) ??
      { category: e.category, events: 0, registrations: 0 }
    c.events++
    c.registrations += activeByEvent.get(e.id) ?? 0
    catMap.set(e.category, c)
  }
  const categories = [...catMap.values()].sort((a, b) => b.events - a.events)

  // --- Top events by attendance (then registrations) ------------------------
  const topEvents: TopEvent[] = eventRows
    .map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      category: e.category,
      start_date: e.start_date,
      registrations: activeByEvent.get(e.id) ?? 0,
      attended: attendedByEvent.get(e.id) ?? 0,
    }))
    .sort(
      (a, b) => b.attended - a.attended || b.registrations - a.registrations
    )
    .slice(0, 8)

  // --- Certificates by type -------------------------------------------------
  const certCount = Object.fromEntries(CERT_TYPES.map((t) => [t, 0])) as Record<
    CertificateType,
    number
  >
  for (const c of certRows) certCount[c.certificate_type]++
  const certTypes = CERT_TYPES.map((t) => ({ type: t, count: certCount[t] }))

  return { kpis, months, categories, topEvents, certTypes }
}
