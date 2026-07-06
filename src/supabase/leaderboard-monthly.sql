-- =============================================================================
-- IEDC Hub — Monthly Leaderboard
-- =============================================================================
-- Run AFTER schema.sql, roster-lifecycle.sql, rls.sql, views.sql.
--
-- Design: the leaderboard "resets" every month WITHOUT touching any stored
-- counters. A student's monthly score is DERIVED on the fly by summing only the
-- points earned from events that occurred within that calendar month:
--
--   month of a point  =  date_trunc('month', events.start_date)
--   monthly points    =  sum(events.points) for attended regs in that month
--                        + sum(event_scores.score) for those same events
--
-- Because nothing is mutated, the all-time counters on `profiles`
-- (total_points / total_events / total_certificates) are untouched and remain
-- the source of truth for profiles, dashboards, etc. Past months stay fully
-- queryable — so a viewed profile can show "[Month] Winner" badges — and there
-- is NO reset job / cron to run or fail.
--
-- Requires Postgres 15+ (Supabase). All views use security_invoker so base-table
-- RLS applies to the caller; see the grants block at the bottom.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Base: per-student monthly points, for every month they earned any.
-- One row per (profile, month). `month` is the first day of that calendar month.
-- ----------------------------------------------------------------------------
create or replace view leaderboard_monthly_base as
with attended as (
  -- attended registrations joined to their event's month + base points
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
  -- bonus points from event_scores, attributed to the scored event's month
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
    sum(points)          as event_points,
    count(distinct event_id) as events_count
  from attended
  group by profile_id, month
)
select
  p.id,
  p.student_id,
  p.name,
  p.avatar,
  p.department,
  p.year,
  b.month,
  (b.event_points + coalesce(s.score_points, 0))::int as month_points,
  b.events_count::int                                 as month_events
from base_pts b
join profiles_current p on p.id = b.profile_id
left join score_pts s on s.profile_id = b.profile_id and s.month = b.month
where p.is_active and p.role = 'student';

-- ----------------------------------------------------------------------------
-- Ranked monthly leaderboard: dense rank within each month.
-- Filter by `month = date_trunc('month', now())::date` for the current board,
-- or any past month to see history.
-- ----------------------------------------------------------------------------
create or replace view leaderboard_monthly as
select
  b.*,
  dense_rank() over (
    partition by b.month
    order by b.month_points desc, b.month_events desc
  ) as rank
from leaderboard_monthly_base b
order by b.month desc, rank;

-- ----------------------------------------------------------------------------
-- Monthly podium: top 3 of each month. Used both for the current-month podium
-- and for the "[Month] Winner / 2nd / 3rd" badges shown on a viewed profile.
-- ----------------------------------------------------------------------------
create or replace view leaderboard_monthly_top3 as
select * from leaderboard_monthly where rank <= 3;

-- ----------------------------------------------------------------------------
-- Convenience function: a single profile's top-3 monthly placements, newest
-- first. Returns the month, points, and place (1/2/3) for every month the user
-- finished in the top 3 — the data behind their profile badges.
-- ----------------------------------------------------------------------------
create or replace function profile_monthly_placements(p_profile_id uuid)
returns table (
  month        date,
  rank         int,
  month_points int,
  month_events int
)
language sql
stable
security invoker
set search_path = public
as $$
  select month, rank, month_points, month_events
  from leaderboard_monthly_top3
  where id = p_profile_id
  order by month desc;
$$;

-- ----------------------------------------------------------------------------
-- Security: run as caller (inherit profiles RLS), authenticated-only.
-- ----------------------------------------------------------------------------
alter view leaderboard_monthly_base set (security_invoker = true);
alter view leaderboard_monthly      set (security_invoker = true);
alter view leaderboard_monthly_top3 set (security_invoker = true);

revoke all on leaderboard_monthly_base from anon;
revoke all on leaderboard_monthly      from anon;
revoke all on leaderboard_monthly_top3 from anon;

grant select on leaderboard_monthly_base to authenticated;
grant select on leaderboard_monthly      to authenticated;
grant select on leaderboard_monthly_top3 to authenticated;

revoke all on function profile_monthly_placements(uuid) from anon;
grant execute on function profile_monthly_placements(uuid) to authenticated;
