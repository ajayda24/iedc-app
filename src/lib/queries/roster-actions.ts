'use server'

// Server Actions for the student roster (admin only). Every action re-checks
// requireAdmin() as the real security boundary; RLS (students_admin_all) is the
// backstop. Writes go through the admin's own authenticated client — an admin
// passes the RLS policy, so no service-role client is needed here.
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/queries'
import {
  upsertStudent,
  upsertStudents,
  deleteStudent,
  type RosterInput,
} from './roster'
import type { Department } from '@/lib/supabase/database.types'

const DEPARTMENTS: Department[] = ['CS', 'IT', 'EC', 'EEE', 'ME', 'PT', 'EP']

export interface ActionResult {
  ok: boolean
  error?: string
}

// Basic email shape check — good enough to catch typos; the DB unique index and
// signup OTP are the real gates.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate + normalise one roster record. Returns a string on failure (the
// error message) so callers can short-circuit.
function validate(raw: {
  student_id?: unknown
  name?: unknown
  email?: unknown
  department?: unknown
  year?: unknown
}): RosterInput | string {
  const student_id = String(raw.student_id ?? '').trim()
  if (!student_id) return 'Student ID is required.'

  const name = String(raw.name ?? '').trim()
  if (!name) return 'Name is required.'

  const email = String(raw.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return `Invalid email for ${student_id}.`

  const department = String(raw.department ?? '').trim().toUpperCase() as Department
  if (!DEPARTMENTS.includes(department)) {
    return `Invalid department for ${student_id} (use one of ${DEPARTMENTS.join(', ')}).`
  }

  const year = Number(raw.year)
  if (!Number.isInteger(year) || year < 1 || year > 5) {
    return `Invalid year for ${student_id} (1–5).`
  }

  return { student_id, name, email, department, year }
}

// Add / update one student from the manual form.
export async function addStudentAction(input: {
  student_id: string
  name: string
  email: string
  department: string
  year: number
}): Promise<ActionResult> {
  await requireAdmin()
  const parsed = validate(input)
  if (typeof parsed === 'string') return { ok: false, error: parsed }

  try {
    await upsertStudent(parsed)
  } catch (err) {
    // Surface the unique-email collision distinctly — it's the common failure.
    const msg = err instanceof Error ? err.message : ''
    if (/duplicate key|unique/i.test(msg) && /email/i.test(msg)) {
      return { ok: false, error: 'That email is already used by another student.' }
    }
    return { ok: false, error: 'Could not save the student. Try again.' }
  }

  revalidatePath('/dashboard/roster')
  return { ok: true }
}

// Bulk import from a parsed Excel/CSV sheet. `rows` come from the client parser
// (SheetJS); we re-validate every row here — the client is never trusted.
export async function importStudentsAction(
  rows: {
    student_id?: unknown
    name?: unknown
    email?: unknown
    department?: unknown
    year?: unknown
  }[]
): Promise<ActionResult & { imported?: number; skipped?: number }> {
  await requireAdmin()

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: 'No rows found in the file.' }
  }
  if (rows.length > 2000) {
    return { ok: false, error: 'Too many rows (max 2000 per import).' }
  }

  const valid: RosterInput[] = []
  const errors: string[] = []
  for (const r of rows) {
    // Skip fully blank rows silently (trailing spreadsheet rows).
    if (
      !r.student_id &&
      !r.name &&
      !r.email &&
      !r.department &&
      r.year === undefined
    ) {
      continue
    }
    const parsed = validate(r)
    if (typeof parsed === 'string') errors.push(parsed)
    else valid.push(parsed)
  }

  if (errors.length > 0) {
    // Fail the whole batch on any bad row — a half-applied import is confusing.
    return {
      ok: false,
      error: `${errors.length} row(s) invalid. First: ${errors[0]}`,
    }
  }

  // De-dupe within the file by student_id (last wins) so upsert doesn't choke on
  // duplicate keys in a single statement.
  const byId = new Map<string, RosterInput>()
  for (const v of valid) byId.set(v.student_id, v)
  const deduped = [...byId.values()]

  try {
    await upsertStudents(deduped)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (/duplicate key|unique/i.test(msg) && /email/i.test(msg)) {
      return {
        ok: false,
        error: 'An email in the file is already used by another student.',
      }
    }
    return { ok: false, error: 'Import failed. No changes were saved.' }
  }

  revalidatePath('/dashboard/roster')
  return {
    ok: true,
    imported: deduped.length,
    skipped: valid.length - deduped.length,
  }
}

// Remove a roster row. Does not delete an existing account (profiles key on
// student_id, not this row's uuid).
export async function deleteStudentAction(id: string): Promise<ActionResult> {
  await requireAdmin()
  try {
    await deleteStudent(id)
  } catch {
    return { ok: false, error: 'Could not remove the student.' }
  }
  revalidatePath('/dashboard/roster')
  return { ok: true }
}
