// Hand-maintained types for the IEDC Hub schema.
// Regenerate with the Supabase CLI once linked:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
// Until then, keep this in sync with src/supabase/*.sql.

export type Department = 'CS' | 'IT' | 'EC' | 'EEE' | 'ME' | 'PT' | 'EP'
export type UserRole = 'student' | 'coordinator' | 'admin'
export type EventCategory =
  | 'workshop'
  | 'bootcamp'
  | 'hackathon'
  | 'competition'
  | 'talk'
  | 'meeting'
export type EventStatus = 'draft' | 'published' | 'completed' | 'cancelled'
export type RegistrationStatus =
  | 'registered'
  | 'attended'
  | 'absent'
  | 'cancelled'
export type CertificateType =
  | 'participation'
  | 'winner'
  | 'runnerup'
  | 'volunteer'
export type NotificationTarget = 'all' | 'department' | 'year' | 'individual'

export interface Student {
  id: string
  student_id: string
  name: string | null
  email: string
  department: Department
  admission_year: number
  program_length: number
  created_at: string
}

export interface Profile {
  id: string
  student_id: string
  name: string
  email: string
  phone: string | null
  department: Department
  role: UserRole
  avatar: string | null
  bio: string | null
  github: string | null
  linkedin: string | null
  website: string | null
  total_points: number
  total_events: number
  total_certificates: number
  manual_active: boolean | null
  created_at: string
  updated_at: string
}

// The `profiles_current` view — profile + derived year / is_active.
export interface ProfileCurrent extends Profile {
  admission_year: number
  program_length: number
  year: number
  is_active: boolean
  is_alumni: boolean
}

export interface EventRow {
  id: string
  title: string
  description: string | null
  banner: string | null
  category: EventCategory
  venue: string | null
  start_date: string
  end_date: string | null
  registration_deadline: string | null
  max_participants: number | null
  points: number
  benefit_attendance: boolean
  benefit_certificate: boolean
  benefit_activity_points: boolean
  status: EventStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  profile_id: string
  status: RegistrationStatus
  registered_at: string
  attendance_marked_at: string | null
}

export interface EventScore {
  id: string
  event_id: string
  profile_id: string
  rank: number | null
  score: number
  remarks: string | null
  created_at: string
}

export interface Certificate {
  id: string
  profile_id: string
  event_id: string | null
  certificate_type: CertificateType
  certificate_url: string | null
  issued_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  target_type: NotificationTarget
  target_value: string | null
  created_by: string | null
  created_at: string
}

// --- View shapes -----------------------------------------------------------
export interface LeaderboardRow {
  id: string
  student_id: string
  name: string
  avatar: string | null
  department: Department
  year: number
  total_points: number
  total_events: number
  total_certificates: number
  rank: number
}

// A row of the monthly (resetting) leaderboard. `month` is the first day of the
// calendar month (YYYY-MM-DD). Points here are derived from that month's events
// only — distinct from the all-time totals on LeaderboardRow.
export interface MonthlyLeaderboardRow {
  id: string
  student_id: string
  name: string
  avatar: string | null
  department: Department
  year: number
  month: string
  month_points: number
  month_events: number
  rank: number
}

// A single top-3 placement a user achieved in a given month — the data behind
// the "[Month] Winner / 2nd / 3rd" badges on a viewed profile.
export interface MonthlyPlacement {
  month: string
  rank: number
  month_points: number
  month_events: number
}

export interface DepartmentStat {
  department: Department
  student_count: number
  total_points: number
  avg_points: number
  total_events: number
  total_certificates: number
}

export interface YearStat {
  year: number
  student_count: number
  total_points: number
  avg_points: number
  total_events: number
  total_certificates: number
}
