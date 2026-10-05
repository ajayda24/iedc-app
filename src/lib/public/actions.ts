'use server'

// =============================================================================
// Public (no-login) Server Actions
// =============================================================================
//   registerGuestAction  -> register for an event with student ID + email
//   lookupActivityAction -> list a student's registrations / pending certs
//
// Identity: the student ID must exist on the roster AND the email must match
// the roster's on-file email. Mismatches return one generic message so the
// form can't be used to discover which IDs or emails exist.
//
// Writes use the service-role client (anon has no RLS write access). Every
// field written is derived server-side; the client only sends the event id,
// student id and email.
// =============================================================================
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CertificateType,
  EventCategory,
  EventStatus,
  RegistrationStatus,
} from '@/lib/supabase/database.types'
import { getPublicEvent, isUuid } from './events'
import { allowRequest } from './rate-limit'

export type PublicActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const STUDENT_ID_RE = /^[A-Za-z0-9-]{3,32}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MISMATCH =
  "We couldn't match that student ID and email to the student roster. Use the email your college registered for you."
const SLOW_DOWN = 'Too many attempts. Please wait a few minutes and try again.'

interface RosterStudent {
  student_id: string
  name: string | null
  email: string
}

// Validate input shape, then match student ID + email against the roster.
async function verifyStudent(
  studentIdRaw: string,
  emailRaw: string
): Promise<PublicActionResult<RosterStudent>> {
  const studentId = String(studentIdRaw ?? '').trim()
  const email = String(emailRaw ?? '').trim().toLowerCase()

  if (!STUDENT_ID_RE.test(studentId)) {
    return { ok: false, error: 'Enter a valid student ID.' }
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const admin = createAdminClient()
  // Case-insensitive ID match. The regex above rules out the LIKE wildcards
  // (% and _), so ilike here is an exact case-insensitive comparison.
  const { data, error } = await admin
    .from('students')
    .select('student_id, name, email')
    .ilike('student_id', studentId)
    .maybeSingle()

  if (error) return { ok: false, error: 'Lookup failed. Please try again.' }
  const student = data as RosterStudent | null
  if (!student || student.email.trim().toLowerCase() !== email) {
    return { ok: false, error: MISMATCH }
  }
  return { ok: true, data: student }
}

function firstName(name: string | null): string | null {
  return name?.trim().split(/\s+/)[0] || null
}

// ---------------------------------------------------------------------------
// Register for an event without an account
// ---------------------------------------------------------------------------
export interface GuestRegistrationResult {
  firstName: string | null
  hasAccount: boolean
  alreadyRegistered: boolean
}

export async function registerGuestAction(input: {
  eventId: string
  studentId: string
  email: string
  // Honeypot: real users never see or fill this field.
  company?: string
}): Promise<PublicActionResult<GuestRegistrationResult>> {
  if (input.company) {
    // Pretend success to bots without writing anything.
    return {
      ok: true,
      data: { firstName: null, hasAccount: false, alreadyRegistered: false },
    }
  }
  if (!(await allowRequest('register', 12, 10 * 60_000))) {
    return { ok: false, error: SLOW_DOWN }
  }
  if (!isUuid(String(input.eventId ?? ''))) {
    return { ok: false, error: 'Event not found.' }
  }

  const verified = await verifyStudent(input.studentId, input.email)
  if (!verified.ok) return verified
  const student = verified.data

  const event = await getPublicEvent(input.eventId)
  if (!event) return { ok: false, error: 'Event not found.' }

  const admin = createAdminClient()

  // Link straight to the account if the student already has one, so it shows
  // on their dashboard immediately.
  const [{ data: profile }, { data: existing }] = await Promise.all([
    admin
      .from('profiles')
      .select('id')
      .eq('student_id', student.student_id)
      .maybeSingle(),
    admin
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', event.id)
      .eq('student_id', student.student_id)
      .maybeSingle(),
  ])
  const profileId = (profile?.id as string | undefined) ?? null
  const result = {
    firstName: firstName(student.name),
    hasAccount: !!profileId,
  }

  if (existing && existing.status !== 'cancelled') {
    return { ok: true, data: { ...result, alreadyRegistered: true } }
  }

  // Registration must be open right now (published, before deadline/start,
  // seats left). Checked after the "already registered" case so returning
  // students still get a friendly confirmation.
  if (event.state !== 'open') {
    const reason: Record<string, string> = {
      full: 'This event is full.',
      closed: 'Registration for this event has closed.',
      completed: 'This event has already taken place.',
      cancelled: 'This event was cancelled.',
    }
    return {
      ok: false,
      error: reason[event.state] ?? 'Registration is not open.',
    }
  }

  if (existing) {
    // Re-activate a previously cancelled registration.
    const { error } = await admin
      .from('event_registrations')
      .update({
        status: 'registered',
        registered_at: new Date().toISOString(),
        profile_id: profileId,
      })
      .eq('id', existing.id)
    if (error) return { ok: false, error: 'Could not register. Please try again.' }
  } else {
    const { error } = await admin.from('event_registrations').insert({
      event_id: event.id,
      student_id: student.student_id,
      profile_id: profileId,
      status: 'registered',
      source: 'public',
    })
    if (error) {
      // Lost a race with a parallel submit: treat as already registered.
      if (/duplicate|unique/i.test(error.message)) {
        return { ok: true, data: { ...result, alreadyRegistered: true } }
      }
      return { ok: false, error: 'Could not register. Please try again.' }
    }
  }

  revalidatePath(`/events/${event.id}`)
  revalidatePath('/events')
  return { ok: true, data: { ...result, alreadyRegistered: false } }
}

// ---------------------------------------------------------------------------
// Look up a student's activity (registrations + certificate availability)
// ---------------------------------------------------------------------------
export interface ActivityItem {
  eventId: string
  title: string
  category: EventCategory
  startDate: string
  venue: string | null
  eventStatus: EventStatus
  status: RegistrationStatus
  // A certificate exists (account holders) or will be issued on sign-up
  // (guests who attended a completed event).
  // Serials aren't returned: certificates are opened from the account.
  certificate:
    | { kind: 'issued'; type: CertificateType }
    | { kind: 'on-signup' }
    | null
}

export interface ActivityResult {
  firstName: string | null
  studentId: string
  hasAccount: boolean
  items: ActivityItem[]
  pendingCertificates: number
  points: number
}

export async function lookupActivityAction(input: {
  studentId: string
  email: string
  company?: string
}): Promise<PublicActionResult<ActivityResult>> {
  if (input.company) return { ok: false, error: MISMATCH }
  if (!(await allowRequest('lookup', 15, 10 * 60_000))) {
    return { ok: false, error: SLOW_DOWN }
  }

  const verified = await verifyStudent(input.studentId, input.email)
  if (!verified.ok) return verified
  const student = verified.data

  const admin = createAdminClient()
  const [{ data: profile }, { data: regs }] = await Promise.all([
    admin
      .from('profiles')
      .select('id')
      .eq('student_id', student.student_id)
      .maybeSingle(),
    admin
      .from('event_registrations')
      .select(
        'event_id, status, event:events!inner(title, category, start_date, venue, status, points)'
      )
      .eq('student_id', student.student_id)
      .neq('status', 'cancelled')
      .neq('event.status', 'draft')
      .order('registered_at', { ascending: false }),
  ])
  const profileId = (profile?.id as string | undefined) ?? null

  // Issued certificates only exist for account holders.
  const certsByEvent = new Map<string, { type: CertificateType }>()
  if (profileId) {
    const { data: certs } = await admin
      .from('certificates')
      .select('event_id, certificate_type')
      .eq('profile_id', profileId)
    for (const c of certs ?? []) {
      if (c.event_id) {
        certsByEvent.set(c.event_id as string, {
          type: c.certificate_type as CertificateType,
        })
      }
    }
  }

  type Joined = {
    event_id: string
    status: RegistrationStatus
    event: {
      title: string
      category: EventCategory
      start_date: string
      venue: string | null
      status: EventStatus
      points: number
    }
  }

  let pendingCertificates = 0
  let points = 0
  const items: ActivityItem[] = ((regs ?? []) as unknown as Joined[]).map(
    (r) => {
      const issued = certsByEvent.get(r.event_id)
      let certificate: ActivityItem['certificate'] = null
      if (issued) {
        certificate = { kind: 'issued', ...issued }
      } else if (
        !profileId &&
        r.status === 'attended' &&
        r.event.status === 'completed'
      ) {
        certificate = { kind: 'on-signup' }
        pendingCertificates += 1
      }
      if (r.status === 'attended') points += r.event.points ?? 0
      return {
        eventId: r.event_id,
        title: r.event.title,
        category: r.event.category,
        startDate: r.event.start_date,
        venue: r.event.venue,
        eventStatus: r.event.status,
        status: r.status,
        certificate,
      }
    }
  )

  return {
    ok: true,
    data: {
      firstName: firstName(student.name),
      studentId: student.student_id,
      hasAccount: !!profileId,
      items,
      pendingCertificates,
      points,
    },
  }
}
