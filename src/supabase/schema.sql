-- =============================================================================
-- IEDC Hub — Database Schema
-- =============================================================================
-- Run this in the Supabase SQL Editor (or as a migration) in order.
-- It is idempotent-ish: enums/tables use IF NOT EXISTS where possible.
--
-- Design summary:
--   students  -> pre-loaded roster (read-only source of truth for eligibility)
--   profiles  -> account, profiles.id = auth.users.id, linked to a student row
--   points/events/certificate counters on profiles are AUTO-COMPUTED by triggers
--   leaderboard exposed via SQL views
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type department as enum ('CS','IT','EC','EEE','ME','PT','EP');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('student','coordinator','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_category as enum ('workshop','bootcamp','hackathon','competition','talk','meeting');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_status as enum ('draft','published','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type registration_status as enum ('registered','attended','absent','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type certificate_type as enum ('participation','winner','runnerup','volunteer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_target as enum ('all','department','year','individual');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. updated_at helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================================
-- 3. STUDENTS — pre-loaded roster (the eligibility source of truth)
-- ============================================================================
-- Populate this with dummy/real data. A student must exist here (and have no
-- profile yet) to be allowed to create an account.
create table if not exists students (
  id           uuid primary key default gen_random_uuid(),
  student_id   text not null unique,
  name         text,
  email        text not null unique,
  department   department not null,
  year         int not null check (year between 1 and 5),
  created_at   timestamptz not null default now()
);

create index if not exists idx_students_email on students (lower(email));
create index if not exists idx_students_student_id on students (student_id);

-- ============================================================================
-- 4. PROFILES — the account (1:1 with auth.users)
-- ============================================================================
create table if not exists profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  student_id          text not null unique references students (student_id),
  name                text not null,
  email               text not null,
  phone               text,
  department          department not null,
  year                int not null check (year between 1 and 5),
  role                user_role not null default 'student',
  avatar              text,

  -- AUTO-COMPUTED counters (do not write directly; maintained by triggers)
  total_points        int not null default 0,
  total_events        int not null default 0,
  total_certificates  int not null default 0,

  is_active           boolean not null default true,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_profiles_department on profiles (department);
create index if not exists idx_profiles_year on profiles (year);
create index if not exists idx_profiles_role on profiles (role);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================================
-- 5. EVENTS
-- ============================================================================
create table if not exists events (
  id                     uuid primary key default gen_random_uuid(),
  title                  text not null,
  description            text,
  banner                 text,
  category               event_category not null,
  venue                  text,

  start_date             timestamptz not null,
  end_date               timestamptz,
  registration_deadline  timestamptz,

  max_participants       int check (max_participants is null or max_participants > 0),
  points                 int not null default 0 check (points >= 0),

  -- benefits flattened from the nested object
  benefit_attendance        boolean not null default true,
  benefit_certificate       boolean not null default false,
  benefit_activity_points   boolean not null default false,

  status                 event_status not null default 'draft',

  created_by             uuid references profiles (id) on delete set null,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint chk_event_dates check (end_date is null or end_date >= start_date)
);

create index if not exists idx_events_status on events (status);
create index if not exists idx_events_category on events (category);
create index if not exists idx_events_start_date on events (start_date);

drop trigger if exists trg_events_updated_at on events;
create trigger trg_events_updated_at
  before update on events
  for each row execute function set_updated_at();

-- ============================================================================
-- 6. EVENT REGISTRATIONS
-- ============================================================================
create table if not exists event_registrations (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references events (id) on delete cascade,
  profile_id            uuid not null references profiles (id) on delete cascade,
  status                registration_status not null default 'registered',
  registered_at         timestamptz not null default now(),
  attendance_marked_at  timestamptz,
  unique (event_id, profile_id)
);

create index if not exists idx_event_reg_event on event_registrations (event_id);
create index if not exists idx_event_reg_profile on event_registrations (profile_id);
create index if not exists idx_event_reg_status on event_registrations (status);

-- ============================================================================
-- 7. EVENT SCORES
-- ============================================================================
create table if not exists event_scores (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events (id) on delete cascade,
  profile_id  uuid not null references profiles (id) on delete cascade,
  rank        int check (rank is null or rank > 0),
  score       numeric not null default 0,
  remarks     text,
  created_at  timestamptz not null default now(),
  unique (event_id, profile_id)
);

create index if not exists idx_event_scores_event on event_scores (event_id);
create index if not exists idx_event_scores_profile on event_scores (profile_id);

-- ============================================================================
-- 8. CERTIFICATES
-- ============================================================================
create table if not exists certificates (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references profiles (id) on delete cascade,
  event_id          uuid references events (id) on delete set null,
  certificate_type  certificate_type not null default 'participation',
  certificate_url   text,
  issued_at         timestamptz not null default now()
);

create index if not exists idx_certificates_profile on certificates (profile_id);
create index if not exists idx_certificates_event on certificates (event_id);

-- ============================================================================
-- 9. NOTIFICATIONS
-- ============================================================================
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  message       text not null,
  target_type   notification_target not null default 'all',
  target_value  text, -- e.g. 'CS' for department, '3' for year, a profile_id for individual
  created_by    uuid references profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notifications_target on notifications (target_type, target_value);
create index if not exists idx_notifications_created_at on notifications (created_at desc);

-- ============================================================================
-- 10. AUTO-COMPUTE counters on profiles
-- ============================================================================
-- Recomputes total_points, total_events, total_certificates for one profile.
--   total_events       = count of registrations marked 'attended'
--   total_points       = sum of events.points for attended events
--                        + sum of event_scores.score
--   total_certificates = count of certificates
create or replace function recompute_profile_stats(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles p set
    total_events = (
      select count(*) from event_registrations r
      where r.profile_id = p_profile_id and r.status = 'attended'
    ),
    total_points = coalesce((
      select sum(e.points)
      from event_registrations r
      join events e on e.id = r.event_id
      where r.profile_id = p_profile_id and r.status = 'attended'
    ), 0) + coalesce((
      select sum(s.score) from event_scores s
      where s.profile_id = p_profile_id
    ), 0),
    total_certificates = (
      select count(*) from certificates c
      where c.profile_id = p_profile_id
    )
  where p.id = p_profile_id;
end $$;

-- Trigger wrapper: recompute for the affected profile(s)
create or replace function trg_recompute_profile_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    perform recompute_profile_stats(old.profile_id);
    return old;
  else
    perform recompute_profile_stats(new.profile_id);
    -- if profile_id changed on update, also refresh the old one
    if (tg_op = 'UPDATE' and new.profile_id is distinct from old.profile_id) then
      perform recompute_profile_stats(old.profile_id);
    end if;
    return new;
  end if;
end $$;

drop trigger if exists trg_reg_stats on event_registrations;
create trigger trg_reg_stats
  after insert or update or delete on event_registrations
  for each row execute function trg_recompute_profile_stats();

drop trigger if exists trg_scores_stats on event_scores;
create trigger trg_scores_stats
  after insert or update or delete on event_scores
  for each row execute function trg_recompute_profile_stats();

drop trigger if exists trg_certs_stats on certificates;
create trigger trg_certs_stats
  after insert or update or delete on certificates
  for each row execute function trg_recompute_profile_stats();

-- When an event's point value changes, refresh everyone who attended it.
create or replace function trg_event_points_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  if (new.points is distinct from old.points) then
    for r in
      select distinct profile_id from event_registrations
      where event_id = new.id and status = 'attended'
    loop
      perform recompute_profile_stats(r.profile_id);
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists trg_event_points on events;
create trigger trg_event_points
  after update on events
  for each row execute function trg_event_points_changed();

-- ============================================================================
-- 11. role helper (avoids RLS recursion when checking the caller's role)
-- ============================================================================
create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_user_role() in ('coordinator','admin'), false);
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_user_role() = 'admin', false);
$$;
