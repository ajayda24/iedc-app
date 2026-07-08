'use server'

// Server Actions for the Manage Events page (coordinator + admin — both are
// is_staff() in RLS, so no per-role split here). Every action re-checks staff
// via requireStaff() as the real security boundary; RLS is the backstop.
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStaff } from '@/lib/auth/queries'
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  type EventInput,
} from './events'
import { markAttendance } from './registrations'
import { createClient } from '@/lib/supabase/server'
import type {
  EventCategory,
  EventStatus,
  RegistrationStatus,
} from '@/lib/supabase/database.types'

const CATEGORIES: EventCategory[] = [
  'workshop',
  'bootcamp',
  'hackathon',
  'competition',
  'talk',
  'meeting',
]
const STATUSES: EventStatus[] = ['draft', 'published', 'completed', 'cancelled']

export interface ActionResult {
  ok: boolean
  error?: string
}

// Parse the shared create/edit form into an EventInput. Returns a string when
// validation fails (used as the error message).
function parseForm(fd: FormData): EventInput | string {
  const title = (fd.get('title') as string)?.trim()
  if (!title) return 'Title is required.'

  const category = fd.get('category') as EventCategory
  if (!CATEGORIES.includes(category)) return 'Pick a valid category.'

  const startDate = fd.get('start_date') as string
  if (!startDate) return 'Start date is required.'

  const status = (fd.get('status') as EventStatus) || 'draft'
  if (!STATUSES.includes(status)) return 'Invalid status.'

  const text = (k: string) => {
    const v = (fd.get(k) as string)?.trim()
    return v ? v : null
  }
  const dt = (k: string) => {
    const v = fd.get(k) as string
    return v ? new Date(v).toISOString() : null
  }
  const int = (k: string) => {
    const v = (fd.get(k) as string)?.trim()
    if (!v) return null
    const n = Number(v)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }

  const end = dt('end_date')
  const start = new Date(startDate).toISOString()
  if (end && end < start) return 'End date must be after the start date.'

  return {
    title,
    description: text('description'),
    banner: text('banner'),
    category,
    venue: text('venue'),
    start_date: start,
    end_date: end,
    registration_deadline: dt('registration_deadline'),
    max_participants: int('max_participants'),
    points: int('points') ?? 0,
    benefit_attendance: fd.get('benefit_attendance') === 'on',
    benefit_certificate: fd.get('benefit_certificate') === 'on',
    benefit_activity_points: fd.get('benefit_activity_points') === 'on',
    status,
  }
}

// Create — redirects to the manage list on success, else returns the error.
export async function createEventAction(fd: FormData): Promise<ActionResult> {
  await requireStaff()
  const parsed = parseForm(fd)
  if (typeof parsed === 'string') return { ok: false, error: parsed }
  try {
    await createEvent(parsed)
  } catch {
    return { ok: false, error: 'Could not create the event. Try again.' }
  }
  revalidatePath('/dashboard/manage')
  redirect('/dashboard/manage')
}

// Update — same shape, keyed by id.
export async function updateEventAction(
  id: string,
  fd: FormData
): Promise<ActionResult> {
  await requireStaff()
  const parsed = parseForm(fd)
  if (typeof parsed === 'string') return { ok: false, error: parsed }
  try {
    await updateEvent(id, parsed)
  } catch {
    return { ok: false, error: 'Could not save changes. Try again.' }
  }
  revalidatePath('/dashboard/manage')
  revalidatePath(`/dashboard/manage/${id}/edit`)
  redirect('/dashboard/manage')
}

// Status transition (publish / unpublish / complete / cancel) from the list.
export async function setEventStatusAction(
  id: string,
  status: EventStatus
): Promise<ActionResult> {
  await requireStaff()
  if (!STATUSES.includes(status)) return { ok: false, error: 'Invalid status.' }
  try {
    await updateEvent(id, { status })
  } catch {
    return { ok: false, error: 'Could not update status.' }
  }
  revalidatePath('/dashboard/manage')
  return { ok: true }
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  await requireStaff()
  try {
    await deleteEvent(id)
  } catch {
    return { ok: false, error: 'Could not delete the event.' }
  }
  revalidatePath('/dashboard/manage')
  return { ok: true }
}

// Mark one registration attended/absent (staff attendance view). `eventId` is
// used to revalidate the right page and to gate auto-certificate issuance.
//
// Side effect (only for a COMPLETED event): marking Present auto-issues a
// 'participation' certificate to the attendee; marking Absent auto-revokes any
// participation certificate they held for this event. Winner/runner-up/volunteer
// certs are never auto-touched — they stay under manual control on the overview.
export async function markAttendanceAction(
  registrationId: string,
  eventId: string,
  status: Extract<RegistrationStatus, 'attended' | 'absent'>
): Promise<ActionResult> {
  await requireStaff()
  if (status !== 'attended' && status !== 'absent') {
    return { ok: false, error: 'Invalid attendance status.' }
  }

  const supabase = await createClient()

  // Resolve the attendee behind this registration up front — needed to sync the
  // participation certificate, and to make sure the registration belongs to the
  // event we were told to revalidate.
  const { data: reg } = await supabase
    .from('event_registrations')
    .select('profile_id, event_id')
    .eq('id', registrationId)
    .maybeSingle()
  if (!reg || reg.event_id !== eventId) {
    return { ok: false, error: 'Registration not found.' }
  }

  try {
    await markAttendance(registrationId, status)
  } catch {
    return { ok: false, error: 'Could not update attendance.' }
  }

  // Auto-sync the participation certificate — best effort. Attendance is already
  // saved; a certificate hiccup shouldn't fail the whole action, so we don't
  // surface these errors, but we log them for debugging.
  const event = await getEvent(eventId)
  if (event?.status === 'completed') {
    try {
      await syncParticipationCertificate(supabase, eventId, reg.profile_id, status)
    } catch (err) {
      console.error('participation cert auto-sync failed', err)
    }
  }

  revalidatePath(`/dashboard/manage/${eventId}/overview`)
  return { ok: true }
}

// Ensure the participation certificate matches attendance for one attendee of a
// completed event. Present -> create if missing; Absent -> delete if present.
// Only ever touches 'participation' certs, so a manually-issued winner/runner-up
// is left untouched when someone is flipped to Absent.
async function syncParticipationCertificate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  profileId: string,
  status: 'attended' | 'absent'
): Promise<void> {
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('event_id', eventId)
    .eq('profile_id', profileId)
    .eq('certificate_type', 'participation')
    .maybeSingle()

  if (status === 'attended') {
    if (!existing) {
      const { error } = await supabase.from('certificates').insert({
        event_id: eventId,
        profile_id: profileId,
        certificate_type: 'participation',
      })
      if (error) throw error
    }
  } else if (existing) {
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', existing.id)
    if (error) throw error
  }
}
