-- =============================================================================
-- IEDC Hub — Roster lifecycle (year rollover & passout) WITHOUT yearly UPDATEs
-- =============================================================================
-- Strategy: store an IMMUTABLE anchor (admission_year + program_length) and
-- DERIVE current year + active status. Nothing has to be rewritten each July.
--
-- Apply this as a revision to schema.sql:
--   - students: replace `year int` with `admission_year int` (+ program_length)
--   - profiles: drop the stored `year` and `is_active`, derive them in a view
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Academic-year helper: when does "the new year" start?
-- ----------------------------------------------------------------------------
-- College academic year flips in July. So for any date, the academic year is
-- the calendar year if month >= 7, else previous calendar year.
-- (AY 2024 means July 2024 .. June 2025.)
create or replace function academic_year(d date default current_date)
returns int
language sql
immutable
as $$
  select case when extract(month from d) >= 7
              then extract(year from d)::int
              else extract(year from d)::int - 1
         end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Derive current study year from the immutable admission_year.
--    Year 1 in the admission AY, +1 each AY after.
-- ----------------------------------------------------------------------------
create or replace function current_study_year(admission_year int)
returns int
language sql
stable
as $$
  select academic_year() - admission_year + 1;
$$;

-- ----------------------------------------------------------------------------
-- 3. STUDENTS: store the anchor, not the year.
-- ----------------------------------------------------------------------------
-- If migrating an existing students table that has `year`:
--   alter table students add column admission_year int;
--   update students set admission_year = academic_year() - year + 1;  -- one-time
--   alter table students drop column year;
-- For a fresh setup, define it directly:
alter table students
  add column if not exists admission_year  int,
  add column if not exists program_length  int not null default 4; -- B.Tech = 4

-- Backfill from old `year` column if it still exists, then we can drop it.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'students' and column_name = 'year') then
    update students
      set admission_year = academic_year() - year + 1
      where admission_year is null;
    alter table students drop column year;
  end if;
end $$;

alter table students
  alter column admission_year set not null;

-- ----------------------------------------------------------------------------
-- 4. STUDENTS view with derived year + status (query THIS, not the raw table)
-- ----------------------------------------------------------------------------
create or replace view students_current as
select
  s.*,
  current_study_year(s.admission_year)                       as year,
  current_study_year(s.admission_year) > s.program_length    as is_alumni,
  current_study_year(s.admission_year) between 1 and s.program_length as is_current
from students s;

-- ----------------------------------------------------------------------------
-- 5. PROFILES: drop stored `year` / `is_active`, derive them too.
-- ----------------------------------------------------------------------------
-- The account no longer duplicates year/active state — it inherits the anchor
-- from the roster via student_id. (Keep `is_active` only if you want a manual
-- override, e.g. banning someone before they pass out — see note at bottom.)
alter table profiles
  drop column if exists year,
  drop column if exists is_active;

-- A profile carries an optional manual de-activation flag ONLY for the
-- exceptional case (ban / leave of absence). Default null = "follow the roster".
alter table profiles
  add column if not exists manual_active boolean; -- null = derive from roster

-- The view the app reads. year + is_active are always live, never stale.
create or replace view profiles_current as
select
  p.*,
  sc.admission_year,
  sc.program_length,
  sc.year,
  -- active = manual override if set, else "still a current student"
  coalesce(p.manual_active, sc.is_current) as is_active,
  sc.is_alumni
from profiles p
join students_current sc on sc.student_id = p.student_id;
