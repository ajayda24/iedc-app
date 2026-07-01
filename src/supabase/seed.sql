-- =============================================================================
-- IEDC Hub — Roster seed (10 dummy students)
-- =============================================================================
-- Run AFTER schema.sql + roster-lifecycle.sql (needs admission_year column).
-- Idempotent: re-running upserts on student_id.
--
-- admission_year drives the derived `year` (see roster-lifecycle.sql):
--   current_study_year = academic_year(today) - admission_year + 1
-- For the 2026-27 academic year:
--   2026 -> year 1   2025 -> year 2   2024 -> year 3   2023 -> year 4
--
-- ⚠ Use REAL email addresses you control if you want to test the OTP signup
--   flow end-to-end — the OTP is sent to the email on file here.
-- =============================================================================

insert into students (student_id, name, email, department, admission_year, program_length) values
  ('IEAXEIT049', 'Ajay Daniel Trevor',   'ajaydtrevor@gmail.com',  'IT',  2023, 4)
on conflict (student_id) do update set
  name           = excluded.name,
  email          = excluded.email,
  department     = excluded.department,
  admission_year = excluded.admission_year,
  program_length = excluded.program_length;

-- Sanity check: see the derived year/status for the seeded roster.
--   select student_id, name, department, year, is_current, is_alumni
--   from students_current order by admission_year, student_id;
