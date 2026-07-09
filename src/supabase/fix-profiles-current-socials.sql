-- =============================================================================
-- IEDC Hub — Fix: refresh `profiles_current` so it exposes bio + socials
-- =============================================================================
-- Symptom: the profile page never shows GitHub / LinkedIn / Website chips even
-- though the edit form saves them. Root cause: the LIVE `profiles_current` view
-- was built before bio/github/linkedin/website existed, so `select *` from the
-- app returns none of them. The base `profiles` table DOES hold the data.
--
-- Why not a plain `create or replace view`: Postgres refuses to reorder/rename
-- existing view columns ("cannot change name of view column"). The new columns
-- land mid-list, so the view must be DROPped and recreated.
--
-- `profiles_current` is depended on by 9 views and 1 RLS policy:
--   views:  leaderboard, leaderboard_top3, department_stats, year_stats,
--           leaderboard_by_department, leaderboard_by_dept_year,
--           leaderboard_monthly_base, leaderboard_monthly, leaderboard_monthly_top3
--   policy: notif_select (on notifications) — references profiles_current
-- DROP ... CASCADE removes the views (and the policy's dependency), so this
-- script recreates ALL of them and re-applies every view's security
-- (security_invoker + grants) and the RLS policy. No data is touched.
--
-- The function `profile_monthly_placements` is NOT dropped by CASCADE (it
-- resolves its view by name at call time), so it needs no recreation.
--
-- Run this ONCE in the Supabase SQL editor. Idempotent; wrapped in a
-- transaction so any failure rolls back cleanly.
-- =============================================================================

begin;

-- 1) Drop the stale view + all dependents.
drop view if exists profiles_current cascade;

-- 2) Recreate profiles_current with `p.*` (now includes bio + socials).
create view profiles_current as
select
  p.*,
  sc.admission_year,
  sc.program_length,
  sc.year,
  coalesce(p.manual_active, sc.is_current) as is_active,
  sc.is_alumni
from profiles p
join students_current sc on sc.student_id = p.student_id;

-- 3a) Leaderboard & stats views (verbatim from views.sql).
create view leaderboard as
select
  p.id, p.student_id, p.name, p.avatar, p.department, p.year,
  p.total_points, p.total_events, p.total_certificates,
  dense_rank() over (order by p.total_points desc, p.total_events desc) as rank
from profiles_current p
where p.is_active and p.role = 'student'
order by rank;

create view leaderboard_top3 as
select * from leaderboard where rank <= 3;

create view department_stats as
select
  p.department,
  count(*)                                 as student_count,
  coalesce(sum(p.total_points),0)          as total_points,
  coalesce(round(avg(p.total_points),2),0) as avg_points,
  coalesce(sum(p.total_events),0)          as total_events,
  coalesce(sum(p.total_certificates),0)    as total_certificates
from profiles_current p
where p.is_active and p.role = 'student'
group by p.department
order by total_points desc;

create view year_stats as
select
  p.year,
  count(*)                                 as student_count,
  coalesce(sum(p.total_points),0)          as total_points,
  coalesce(round(avg(p.total_points),2),0) as avg_points,
  coalesce(sum(p.total_events),0)          as total_events,
  coalesce(sum(p.total_certificates),0)    as total_certificates
from profiles_current p
where p.is_active and p.role = 'student'
group by p.year
order by p.year;

create view leaderboard_by_department as
select
  p.id, p.student_id, p.name, p.avatar, p.department, p.year, p.total_points,
  dense_rank() over (
    partition by p.department
    order by p.total_points desc, p.total_events desc
  ) as dept_rank
from profiles_current p
where p.is_active and p.role = 'student'
order by p.department, dept_rank;

create view leaderboard_by_dept_year as
select * from (
  select
    p.id, p.student_id, p.name, p.avatar, p.department, p.year, p.total_points,
    dense_rank() over (
      partition by p.department, p.year
      order by p.total_points desc, p.total_events desc
    ) as rank_in_group
  from profiles_current p
  where p.is_active and p.role = 'student'
) t
where t.rank_in_group <= 3
order by department, year, rank_in_group;

-- 3b) Monthly leaderboard views (verbatim from leaderboard-monthly.sql).
create view leaderboard_monthly_base as
with attended as (
  select
    r.profile_id,
    date_trunc('month', e.start_date)::date as month,
    e.id                                    as event_id,
    coalesce(e.points, 0)                   as points
  from event_registrations r
  join events e on e.id = r.event_id
  where r.status = 'attended'
),
score_pts as (
  select
    s.profile_id,
    date_trunc('month', e.start_date)::date as month,
    coalesce(sum(s.score), 0)               as score_points
  from event_scores s
  join events e on e.id = s.event_id
  group by s.profile_id, date_trunc('month', e.start_date)::date
),
base_pts as (
  select
    profile_id,
    month,
    sum(points)              as event_points,
    count(distinct event_id) as events_count
  from attended
  group by profile_id, month
)
select
  p.id, p.student_id, p.name, p.avatar, p.department, p.year,
  b.month,
  (b.event_points + coalesce(s.score_points, 0))::int as month_points,
  b.events_count::int                                 as month_events
from base_pts b
join profiles_current p on p.id = b.profile_id
left join score_pts s on s.profile_id = b.profile_id and s.month = b.month
where p.is_active and p.role = 'student';

create view leaderboard_monthly as
select
  b.*,
  dense_rank() over (
    partition by b.month
    order by b.month_points desc, b.month_events desc
  ) as rank
from leaderboard_monthly_base b
order by b.month desc, rank;

create view leaderboard_monthly_top3 as
select * from leaderboard_monthly where rank <= 3;

-- 4) Re-apply security_invoker (WITHOUT this the recreated views run as owner
--    and BYPASS RLS — critical for not leaking emails/phones).
alter view profiles_current            set (security_invoker = true);
alter view leaderboard                 set (security_invoker = true);
alter view leaderboard_top3            set (security_invoker = true);
alter view leaderboard_by_department   set (security_invoker = true);
alter view leaderboard_by_dept_year    set (security_invoker = true);
alter view department_stats            set (security_invoker = true);
alter view year_stats                  set (security_invoker = true);
alter view leaderboard_monthly_base    set (security_invoker = true);
alter view leaderboard_monthly         set (security_invoker = true);
alter view leaderboard_monthly_top3    set (security_invoker = true);

-- 5) Re-apply grants: logged-in users only, revoke anon.
revoke all on profiles_current          from anon;
revoke all on leaderboard               from anon;
revoke all on leaderboard_top3          from anon;
revoke all on leaderboard_by_department from anon;
revoke all on leaderboard_by_dept_year  from anon;
revoke all on department_stats          from anon;
revoke all on year_stats                from anon;
revoke all on leaderboard_monthly_base  from anon;
revoke all on leaderboard_monthly       from anon;
revoke all on leaderboard_monthly_top3  from anon;

grant select on profiles_current          to authenticated;
grant select on leaderboard               to authenticated;
grant select on leaderboard_top3          to authenticated;
grant select on leaderboard_by_department to authenticated;
grant select on leaderboard_by_dept_year  to authenticated;
grant select on department_stats          to authenticated;
grant select on year_stats                to authenticated;
grant select on leaderboard_monthly_base  to authenticated;
grant select on leaderboard_monthly       to authenticated;
grant select on leaderboard_monthly_top3  to authenticated;

-- 6) Recreate the RLS policy that referenced profiles_current (dropped by
--    CASCADE). Verbatim from rls.sql (notif_select on notifications).
drop policy if exists notif_select on notifications;
create policy notif_select on notifications
  for select using (
    is_staff()
    or target_type = 'all'
    or (target_type = 'department' and target_value = (
          select department::text from profiles where id = auth.uid()))
    or (target_type = 'year' and target_value = (
          select year::text from profiles_current where id = auth.uid()))
    or (target_type = 'individual' and target_value = auth.uid()::text)
  );

commit;

-- Sanity check (run separately): should list github, linkedin, website, bio.
-- select column_name from information_schema.columns
--   where table_name = 'profiles_current' order by ordinal_position;
