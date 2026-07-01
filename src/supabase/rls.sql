-- =============================================================================
-- IEDC Hub — Row Level Security (RLS) Policies
-- =============================================================================
-- Run AFTER schema.sql.
-- Model:
--   student     -> reads most things, manages only their own registrations
--   coordinator -> manages events, registrations, scores, certificates, notifications
--   admin       -> everything, including roles & students roster
-- Counters on profiles are auto-computed, so students can't edit them directly
-- (we restrict the columns a student may update at the app layer; see note).
-- =============================================================================

alter table students            enable row level security;
alter table profiles            enable row level security;
alter table events              enable row level security;
alter table event_registrations enable row level security;
alter table event_scores        enable row level security;
alter table certificates        enable row level security;
alter table notifications       enable row level security;

-- ----------------------------------------------------------------------------
-- STUDENTS (roster)
-- ----------------------------------------------------------------------------
-- Only admins manage the roster from the client. The signup Edge Function uses
-- the service_role key, which bypasses RLS, to verify a studentId at signup.
drop policy if exists students_admin_all on students;
create policy students_admin_all on students
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------------------
-- Everyone authenticated can read profiles (needed for leaderboard, event lists).
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select using (auth.uid() is not null);

-- A user can update their OWN profile row.
-- NOTE: total_points / total_events / total_certificates / role are protected
-- by the column grants below, so even though this row is "theirs", they cannot
-- change those columns.
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Admins can do anything to any profile (e.g. change roles, deactivate).
drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- Insert: profiles are created by the signup Edge Function (service_role).
-- Allow a user to insert their own row too, as a fallback, keyed to auth.uid().
drop policy if exists profiles_insert_self on profiles;
create policy profiles_insert_self on profiles
  for insert with check (id = auth.uid());

-- Column-level protection so students can't self-promote or fake counters.
-- Revoke broad column update, then grant only the safe columns to authenticated.
revoke update on profiles from authenticated;
grant update (name, phone, avatar) on profiles to authenticated;
-- (admins go through profiles_admin_all + table owner privileges / service role)

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------
-- Anyone authenticated can read published/completed/cancelled events.
-- Staff can additionally see drafts.
drop policy if exists events_select on events;
create policy events_select on events
  for select using (
    status <> 'draft' or is_staff()
  );

-- Only staff create/update/delete events.
drop policy if exists events_staff_write on events;
create policy events_staff_write on events
  for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- EVENT REGISTRATIONS
-- ----------------------------------------------------------------------------
-- A student sees their own registrations; staff see all.
drop policy if exists reg_select on event_registrations;
create policy reg_select on event_registrations
  for select using (profile_id = auth.uid() or is_staff());

-- A student can register THEMSELVES (insert with their own profile_id),
-- only while the event is published and not past its deadline.
drop policy if exists reg_insert_self on event_registrations;
create policy reg_insert_self on event_registrations
  for insert with check (
    profile_id = auth.uid()
    and status = 'registered'
    and exists (
      select 1 from events e
      where e.id = event_id
        and e.status = 'published'
        and (e.registration_deadline is null or e.registration_deadline >= now())
    )
  );

-- A student may cancel their own registration (set status cancelled).
-- Marking attendance/absent is staff-only, enforced below.
drop policy if exists reg_update_self_cancel on event_registrations;
create policy reg_update_self_cancel on event_registrations
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and status in ('registered','cancelled'));

-- Staff manage all registrations (attendance marking, etc.)
drop policy if exists reg_staff_all on event_registrations;
create policy reg_staff_all on event_registrations
  for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- EVENT SCORES
-- ----------------------------------------------------------------------------
drop policy if exists scores_select on event_scores;
create policy scores_select on event_scores
  for select using (profile_id = auth.uid() or is_staff());

drop policy if exists scores_staff_write on event_scores;
create policy scores_staff_write on event_scores
  for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- CERTIFICATES
-- ----------------------------------------------------------------------------
drop policy if exists certs_select on certificates;
create policy certs_select on certificates
  for select using (profile_id = auth.uid() or is_staff());

drop policy if exists certs_staff_write on certificates;
create policy certs_staff_write on certificates
  for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
-- A user sees a notification if it's for everyone, their department, their year,
-- or addressed to them individually. Staff see all.
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

drop policy if exists notif_staff_write on notifications;
create policy notif_staff_write on notifications
  for all using (is_staff()) with check (is_staff());
