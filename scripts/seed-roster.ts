// Seed 10 dummy roster students via the service-role client (bypasses RLS).
//
// Run with Node 24+ (native TS) after filling .env:
//   node --env-file=.env scripts/seed-roster.ts
//
// Idempotent: upserts on student_id. Same data as src/supabase/seed.sql — use
// whichever you prefer (SQL editor vs. CLI).
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.'
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// admission_year drives derived `year`:
//   2026 -> yr1, 2025 -> yr2, 2024 -> yr3, 2023 -> yr4 (for AY 2026-27)
const students = [
  { student_id: 'KTE23CS001', name: 'Aparna Suresh',   email: 'aparna.cs23@example.edu',  department: 'CS',  admission_year: 2023 },
  { student_id: 'KTE23EC014', name: 'Rahul Nair',      email: 'rahul.ec23@example.edu',   department: 'EC',  admission_year: 2023 },
  { student_id: 'KTE24IT007', name: 'Fathima Backer',  email: 'fathima.it24@example.edu', department: 'IT',  admission_year: 2024 },
  { student_id: 'KTE24ME022', name: 'Arjun Menon',     email: 'arjun.me24@example.edu',   department: 'ME',  admission_year: 2024 },
  { student_id: 'KTE25EEE003',name: 'Sneha Thomas',    email: 'sneha.eee25@example.edu',  department: 'EEE', admission_year: 2025 },
  { student_id: 'KTE25CS045', name: 'Vishnu Prasad',   email: 'vishnu.cs25@example.edu',  department: 'CS',  admission_year: 2025 },
  { student_id: 'KTE26IT019', name: 'Anjali Krishnan', email: 'anjali.it26@example.edu',  department: 'IT',  admission_year: 2026 },
  { student_id: 'KTE26PT011', name: 'Mohammed Ashiq',  email: 'ashiq.pt26@example.edu',   department: 'PT',  admission_year: 2026 },
  { student_id: 'KTE24EP008', name: 'Gowri Lakshmi',   email: 'gowri.ep24@example.edu',   department: 'EP',  admission_year: 2024 },
  { student_id: 'KTE23ME030', name: 'Nikhil Raj',      email: 'nikhil.me23@example.edu',  department: 'ME',  admission_year: 2023 },
] as const

async function main() {
  const { error } = await admin
    .from('students')
    .upsert(students.map((s) => ({ ...s, program_length: 4 })), {
      onConflict: 'student_id',
    })

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`✓ Seeded ${students.length} roster students.`)

  const { data } = await admin
    .from('students_current')
    .select('student_id, name, department, year, is_current')
    .order('admission_year')
  console.table(data)
}

main()
