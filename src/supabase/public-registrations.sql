-- =============================================================================
-- IEDC Hub — Public (guest) event registration
-- =============================================================================
-- Run AFTER all other files (schema, roster-lifecycle, rls, views,
-- view-security, certificates-module, migrations-dashboard).
--
-- WHY: students without an account can register for events from the public
-- site using their roster student ID + on-file email. Their registration is
-- stored in the SAME event_registrations table, keyed by student_id with a
-- NULL profile_id. When the student later creates an account, those rows are
-- "claimed" (profile_id filled in) so points, history and certificates flow
-- into their dashboard automatically.
--
--   * Account holders:   profile_id = auth user, student_id = their roster id
--   * Guests:            profile_id = NULL,      student_id = roster id
--
-- Certificates still require a profile (certificates.profile_id NOT NULL), so a
-- guest's certificate becomes available only once they create their account.
--
-- All guest writes go through server code using the service-role client after
-- validating student_id + email against the roster. No anon RLS is opened.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. event_registrations: add student_id, allow NULL profile_id
-- ----------------------------------------------------------------------------
alter table event_registrations
  add column if not exists student_id text references students (student_id) on delete cascade;

-- Backfill student_id for existing (account) registrations.
update event_registrations r
  set student_id = p.student_id
  from profiles p
  where p.id = r.profile_id
    and r.student_id is null;

alter table event_registrations
  alter column student_id set not null;

alter table event_registrations
  alter column profile_id drop not null;

-- One registration per student per event, whether guest or account.
-- (The original unique (event_id, profile_id) stays; NULLs don't collide.)
create unique index if not exists uq_event_reg_event_student
  on event_registrations (event_id, student_id);

create index if not exists idx_event_reg_student on event_registrations (student_id);

-- Where the registration came from — useful for staff + analytics.
alter table event_registrations
  add column if not exists source text not null default 'account'
    check (source in ('account', 'public'));

-- ----------------------------------------------------------------------------
-- 2. Fill student_id automatically for account registrations
-- ----------------------------------------------------------------------------
-- The dashboard inserts { event_id, profile_id } only. Derive student_id from
-- the profile so existing app code keeps working unchanged. If a client tries
-- to pass a student_id that doesn't match their profile, it's overwritten.
create or replace function set_registration_student_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_id is not null then
    select student_id into new.student_id
      from profiles where id = new.profile_id;
  end if;
  if new.student_id is null then
    raise exception 'registration requires a student_id';
  end if;
  return new;
end $$;

drop trigger if exists trg_reg_student_id on event_registrations;
create trigger trg_reg_student_id
  before insert or update of profile_id on event_registrations
  for each row execute function set_registration_student_id();

-- ----------------------------------------------------------------------------
-- 3. Stats trigger: ignore guest rows (no profile to recompute)
-- ----------------------------------------------------------------------------
create or replace function trg_recompute_profile_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    if old.profile_id is not null then
      perform recompute_profile_stats(old.profile_id);
    end if;
    return old;
  else
    if new.profile_id is not null then
      perform recompute_profile_stats(new.profile_id);
    end if;
    if (tg_op = 'UPDATE'
        and old.profile_id is not null
        and new.profile_id is distinct from old.profile_id) then
      perform recompute_profile_stats(old.profile_id);
    end if;
    return new;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Claim guest registrations when a profile is created
-- ----------------------------------------------------------------------------
-- Runs on profile insert (signup). Links every guest registration for that
-- student to the new profile; the stats trigger above then recomputes points.
-- Participation certificates for already-completed events are issued in app
-- code (completeSignup) so the logic lives next to the existing auto-issue rule.
create or replace function claim_guest_registrations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update event_registrations
    set profile_id = new.id
    where student_id = new.student_id
      and profile_id is null;
  return new;
end $$;

drop trigger if exists trg_claim_guest_regs on profiles;
create trigger trg_claim_guest_regs
  after insert on profiles
  for each row execute function claim_guest_registrations();

-- One-time: claim any guest rows for students who already have a profile.
update event_registrations r
  set profile_id = p.id
  from profiles p
  where r.profile_id is null
    and p.student_id = r.student_id;

-- ----------------------------------------------------------------------------
-- 5. RLS: existing policies already scope by profile_id = auth.uid() or staff
-- ----------------------------------------------------------------------------
-- Guest rows (profile_id NULL) are invisible to students and visible to the
-- event owner / admins through reg_coord_select / reg_admin_all. Students
-- inserting from the dashboard still must use their own profile_id
-- (reg_insert_self), and the trigger above pins student_id to that profile.
-- No anon policies are added: public writes use the service-role client.
-- =============================================================================
