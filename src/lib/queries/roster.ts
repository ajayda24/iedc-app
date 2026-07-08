import 'server-only'

// Student roster (the `students` table) — the source of truth for who may sign
// up. Admin-only (RLS: students_admin_all). Signup verifies a student_id here
// and sends the OTP to the on-file email, so email is required + unique.
//
// The table stores an immutable `admission_year` anchor, NOT the current study
// year (see roster-lifecycle.sql). The current "year 1..5" the admin enters is
// converted to admission_year on write, and read back via the students_current
// view which derives `year` live. This is why nothing has to be rewritten each
// July — a year-3 student automatically becomes year-4 next academic year.
import { createClient } from '@/lib/supabase/server'
import type { Department, Student } from '@/lib/supabase/database.types'

// A roster row as the admin sees it: the stored anchor plus the derived current
// year and lifecycle flags (from the students_current view).
export interface RosterStudent extends Student {
  year: number
  is_alumni: boolean
  is_current: boolean
}

// Shape the add/import forms produce — the admin thinks in "current year", not
// admission year.
export interface RosterInput {
  student_id: string
  name: string
  email: string
  department: Department
  year: number // current study year, 1..5
}

// College academic year flips in July: month >= 7 -> current calendar year,
// else previous. Mirrors the SQL academic_year() so client-entered year maps to
// the same admission_year the DB would derive.
export function academicYear(d = new Date()): number {
  const y = d.getFullYear()
  return d.getMonth() + 1 >= 7 ? y : y - 1
}

// current year N  ->  admission_year anchor
export function admissionYearFromYear(year: number, d = new Date()): number {
  return academicYear(d) - year + 1
}

// All roster rows with derived year, most-recent admissions first then name.
export async function listRoster(): Promise<RosterStudent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students_current')
    .select('*')
    .order('admission_year', { ascending: false })
    .order('name', { ascending: true })
  if (error) throw error
  return (data as RosterStudent[]) ?? []
}

// Rows the admin write path produces: the raw table columns, year already
// converted to admission_year.
type StudentUpsertRow = {
  student_id: string
  name: string
  email: string
  department: Department
  admission_year: number
}

function toRow(input: RosterInput): StudentUpsertRow {
  return {
    student_id: input.student_id,
    name: input.name,
    email: input.email,
    department: input.department,
    admission_year: admissionYearFromYear(input.year),
  }
}

// Upsert one student, keyed by student_id (re-adding a known ID updates it).
export async function upsertStudent(input: RosterInput): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .upsert(toRow(input), { onConflict: 'student_id' })
  if (error) throw error
}

// Bulk upsert (Excel import). Deduped by student_id by the caller. Returns the
// number of rows written.
export async function upsertStudents(rows: RosterInput[]): Promise<number> {
  if (rows.length === 0) return 0
  const supabase = await createClient()
  const { error } = await supabase
    .from('students')
    .upsert(rows.map(toRow), { onConflict: 'student_id' })
  if (error) throw error
  return rows.length
}

// Remove a roster row by its uuid. Note: this does NOT delete an existing
// account/profile (profiles reference student_id, not this row's id).
export async function deleteStudent(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}
