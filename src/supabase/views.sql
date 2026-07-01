-- =============================================================================
-- IEDC Hub — Leaderboard & Stats Views
-- =============================================================================
-- Run AFTER schema.sql. Views run with the querying user's privileges and
-- respect RLS on the underlying profiles table (profiles is readable by any
-- authenticated user), so the leaderboard is visible to logged-in users.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Overall student leaderboard (dense rank by points)
-- ----------------------------------------------------------------------------
create or replace view leaderboard as
select
  p.id,
  p.student_id,
  p.name,
  p.avatar,
  p.department,
  p.year,
  p.total_points,
  p.total_events,
  p.total_certificates,
  dense_rank() over (order by p.total_points desc, p.total_events desc) as rank
from profiles_current p
where p.is_active and p.role = 'student'
order by rank;

-- ----------------------------------------------------------------------------
-- Top 3 students overall
-- ----------------------------------------------------------------------------
create or replace view leaderboard_top3 as
select * from leaderboard where rank <= 3;

-- ----------------------------------------------------------------------------
-- Department-wise stats
-- ----------------------------------------------------------------------------
create or replace view department_stats as
select
  p.department,
  count(*)                       as student_count,
  coalesce(sum(p.total_points),0)        as total_points,
  coalesce(round(avg(p.total_points),2),0) as avg_points,
  coalesce(sum(p.total_events),0)        as total_events,
  coalesce(sum(p.total_certificates),0)  as total_certificates
from profiles_current p
where p.is_active and p.role = 'student'
group by p.department
order by total_points desc;

-- ----------------------------------------------------------------------------
-- Year-wise stats
-- ----------------------------------------------------------------------------
create or replace view year_stats as
select
  p.year,
  count(*)                       as student_count,
  coalesce(sum(p.total_points),0)        as total_points,
  coalesce(round(avg(p.total_points),2),0) as avg_points,
  coalesce(sum(p.total_events),0)        as total_events,
  coalesce(sum(p.total_certificates),0)  as total_certificates
from profiles_current p
where p.is_active and p.role = 'student'
group by p.year
order by p.year;

-- ----------------------------------------------------------------------------
-- Per-department leaderboard ranking (rank within each department)
-- ----------------------------------------------------------------------------
create or replace view leaderboard_by_department as
select
  p.id,
  p.student_id,
  p.name,
  p.avatar,
  p.department,
  p.year,
  p.total_points,
  dense_rank() over (
    partition by p.department
    order by p.total_points desc, p.total_events desc
  ) as dept_rank
from profiles_current p
where p.is_active and p.role = 'student'
order by p.department, dept_rank;

-- ----------------------------------------------------------------------------
-- Top 3 per department-and-year (handy for "best of each batch")
-- ----------------------------------------------------------------------------
create or replace view leaderboard_by_dept_year as
select * from (
  select
    p.id,
    p.student_id,
    p.name,
    p.avatar,
    p.department,
    p.year,
    p.total_points,
    dense_rank() over (
      partition by p.department, p.year
      order by p.total_points desc, p.total_events desc
    ) as rank_in_group
  from profiles_current p
  where p.is_active and p.role = 'student'
) t
where t.rank_in_group <= 3
order by department, year, rank_in_group;
