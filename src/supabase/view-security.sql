-- =============================================================================
-- IEDC Hub — View security
-- =============================================================================
-- Run AFTER schema.sql, roster-lifecycle.sql, rls.sql, views.sql.
--
-- Views can't have RLS policies. Two things make them safe instead:
--   (A) security_invoker  -> the view runs as the CALLER, so the RLS on the
--                            underlying tables (profiles, students, ...) applies.
--                            Without this, a view runs as its owner (superuser)
--                            and BYPASSES table RLS. This is the key setting.
--   (B) grants            -> control which roles may SELECT the view at all.
--
-- Requires Postgres 15+ (Supabase is fine).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- (A) Make every view run with the caller's privileges (inherit base RLS)
-- ----------------------------------------------------------------------------
alter view students_current            set (security_invoker = true);
alter view profiles_current            set (security_invoker = true);
alter view leaderboard                 set (security_invoker = true);
alter view leaderboard_top3            set (security_invoker = true);
alter view leaderboard_by_department   set (security_invoker = true);
alter view leaderboard_by_dept_year    set (security_invoker = true);
alter view department_stats            set (security_invoker = true);
alter view year_stats                  set (security_invoker = true);

-- ----------------------------------------------------------------------------
-- (B) Grants: who can read these?
-- ----------------------------------------------------------------------------
-- We only want LOGGED-IN users reading the app data. Revoke the anon role.
-- (`anon` = requests made with just the public anon key, no user session.)

-- students_current exposes roster emails -> authenticated only (RLS on students
-- further limits it to admins via security_invoker; belt and suspenders).
revoke all on students_current from anon;
grant  select on students_current to authenticated;

-- profiles + leaderboards: authenticated users only. If you want the leaderboard
-- visible on a PUBLIC page (no login), see the note at the bottom.
revoke all on profiles_current          from anon;
revoke all on leaderboard               from anon;
revoke all on leaderboard_top3          from anon;
revoke all on leaderboard_by_department from anon;
revoke all on leaderboard_by_dept_year  from anon;
revoke all on department_stats          from anon;
revoke all on year_stats                from anon;

grant select on profiles_current          to authenticated;
grant select on leaderboard               to authenticated;
grant select on leaderboard_top3          to authenticated;
grant select on leaderboard_by_department to authenticated;
grant select on leaderboard_by_dept_year  to authenticated;
grant select on department_stats          to authenticated;
grant select on year_stats                to authenticated;

-- ----------------------------------------------------------------------------
-- OPTIONAL: public (logged-out) leaderboard on your landing page
-- ----------------------------------------------------------------------------
-- If the landing page should show top students WITHOUT login, the leaderboard
-- views need to be readable by `anon`. But security_invoker means anon must also
-- be able to SELECT the underlying profiles rows — which your current RLS does
-- NOT allow (profiles_select requires auth.uid() is not null).
--
-- Safest way to expose a public leaderboard: DON'T open profiles to anon.
-- Instead create a narrow public view with security_definer that leaks ONLY the
-- ranking columns (no email/phone), e.g.:
--
--   create view public_leaderboard
--     with (security_invoker = false) as   -- runs as owner, bypasses profiles RLS
--   select name, avatar, department, year, total_points, rank
--   from leaderboard;
--   grant select on public_leaderboard to anon, authenticated;
--
-- Only expose the columns you're happy to show the whole internet.
