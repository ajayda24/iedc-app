'use server'

// =============================================================================
// Auth flow — 3-step signup + login/logout (Server Actions)
// =============================================================================
// Signup:
//   1. requestSignupOtp(studentId)  -> verify roster, send OTP to ON-FILE email
//   2. verifySignupOtp(email, code) -> verify OTP, establish session
//   3. completeSignup(password)     -> set password, create profile from roster
//
// The user never supplies their own email/dept/year: the roster (students) is
// the source of truth, read via the service-role admin client which bypasses
// RLS. The client only ever sends the studentId and the OTP code.
// =============================================================================
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const head = local.slice(0, 2)
  return `${head}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`
}

// ---------------------------------------------------------------------------
// STEP 1 — verify studentId against the roster, send OTP to the on-file email.
// ---------------------------------------------------------------------------
export async function requestSignupOtp(
  studentId: string
): Promise<ActionResult<{ email: string; emailHint: string }>> {
  const id = studentId.trim()
  if (!id) return { ok: false, error: 'Student ID is required.' }

  const admin = createAdminClient()

  // 1. Must exist on the roster.
  const { data: student, error: rosterErr } = await admin
    .from('students')
    .select('email')
    .eq('student_id', id)
    .maybeSingle()

  if (rosterErr) return { ok: false, error: 'Lookup failed. Try again.' }
  if (!student) {
    return { ok: false, error: 'Student ID not found in the roster.' }
  }

  // 2. Must not already have an account.
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('student_id', id)
    .maybeSingle()

  if (existing) {
    return {
      ok: false,
      error: 'An account already exists for this student. Please log in.',
    }
  }

  // 3. Send OTP to the ON-FILE email. shouldCreateUser creates the auth user.
  const supabase = await createClient()
  const { error: otpErr } = await supabase.auth.signInWithOtp({
    email: student.email,
    options: { shouldCreateUser: true },
  })
  if (otpErr) return { ok: false, error: otpErr.message }

  // Return the real email (the next step needs it) plus a masked hint to show.
  // The email came from the roster, not the client — it can't be redirected.
  return {
    ok: true,
    data: { email: student.email, emailHint: maskEmail(student.email) },
  }
}

// ---------------------------------------------------------------------------
// STEP 2 — verify the 6-digit code, establishing a session.
// ---------------------------------------------------------------------------
export async function verifySignupOtp(
  email: string,
  token: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: token.trim(),
    type: 'email',
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: undefined }
}

// ---------------------------------------------------------------------------
// STEP 3 — set a password and create the profile from roster data.
// Requires an active session from step 2.
// ---------------------------------------------------------------------------
export async function completeSignup(
  password: string,
  phone?: string
): Promise<ActionResult> {
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return { ok: false, error: 'Session expired. Restart signup.' }
  }

  // Set the password on the authenticated user.
  const { error: pwErr } = await supabase.auth.updateUser({ password })
  if (pwErr) return { ok: false, error: pwErr.message }

  // Create the profile from the roster (admin client, spoof-proof).
  const admin = createAdminClient()

  const { data: student, error: rosterErr } = await admin
    .from('students')
    .select('student_id, name, email, department')
    .eq('email', user.email)
    .maybeSingle()

  if (rosterErr || !student) {
    return { ok: false, error: 'Roster record not found for this account.' }
  }

  // Idempotent: if a profile already exists (e.g. retried step), succeed.
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error: insErr } = await admin.from('profiles').insert({
      id: user.id,
      student_id: student.student_id,
      name: student.name ?? '',
      email: student.email,
      phone: phone?.trim() || null,
      department: student.department,
      role: 'student',
    })
    if (insErr) return { ok: false, error: insErr.message }
  }

  return { ok: true, data: undefined }
}

// ---------------------------------------------------------------------------
// LOGIN (password) — after signup is complete.
// ---------------------------------------------------------------------------
export async function login(
  email: string,
  password: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: undefined }
}

// Login by studentId instead of email: resolve the email from the roster first.
export async function loginWithStudentId(
  studentId: string,
  password: string
): Promise<ActionResult> {
  const admin = createAdminClient()
  const { data: student } = await admin
    .from('students')
    .select('email')
    .eq('student_id', studentId.trim())
    .maybeSingle()

  if (!student) return { ok: false, error: 'Invalid student ID or password.' }
  return login(student.email, password)
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
export async function logout(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
