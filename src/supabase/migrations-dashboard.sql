-- =============================================================================
-- IEDC Hub — Dashboard permission model migration
-- =============================================================================
-- Run AFTER schema.sql, roster-lifecycle.sql, views.sql, rls.sql.
-- (view-security.sql is independent of this and can run before or after.)
--
-- WHY: the original rls.sql grants coordinators and admins IDENTICAL write
-- power via is_staff(). The real model is narrower:
--
--   coordinator = a student who ALSO organizes events. They can:
--     - create + publish their OWN events
--     - edit/delete their OWN event ONLY when an admin has UNLOCKED it
--       (events.edit_locked = false)
--     - mark attendance for their OWN events
--     - enter/update scores for their OWN events
--     - send notifications
--     - (read) basic analytics
--   coordinator CANNOT: issue certificates, manage the roster, manage roles,
--     touch events/scores/attendance they don't own.
--
--   admin = everything, unrestricted, over all rows. Also toggles edit_locked
--     and issues certificates.
--
-- Coordinators still participate in events as students — the existing
-- reg_insert_self / reg_update_self_cancel policies already cover that and are
-- left in place.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 0. Role helpers for the coordinator tier
-- ----------------------------------------------------------------------------
-- schema.sql already provides current_user_role(), is_staff(), is_admin().
-- Add a coordinator-specific helper for readability.
create or replace function is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_user_role() = 'coordinator', false);
$$;

-- True when the current user created the given event. security definer so the
-- lookup isn't itself blocked by RLS on events.
create or replace function owns_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from events e
    where e.id = p_event_id
      and e.created_by = auth.uid()
  );
$$;

-- Returns the caller's own student_id (from their profile). security definer
-- so it can be used inside the students RLS policy WITHOUT recursing into the
-- profiles policies. Mirrors current_user_role().
create or replace function current_user_student_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select student_id from profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 0b. FIX: let a user read THEIR OWN roster row.
-- ----------------------------------------------------------------------------
-- BUG this fixes: profiles_current is a security_invoker view that INNER JOINs
-- students_current -> students. The only students policy was admin-only
-- (students_admin_all), so a non-admin reading profiles_current got 0 rows —
-- the join produced nothing — and the whole app (getProfile) broke with a
-- login<->dashboard redirect loop.
--
-- Fix: a user may SELECT the single students row linked to their profile.
-- This exposes only their own roster record, not the whole roster.
drop policy if exists students_select_self on students;
create policy students_select_self on students
  for select using (student_id = current_user_student_id());

-- (students_admin_all still covers full admin management of the roster.)

-- ----------------------------------------------------------------------------
-- 1. events.edit_locked — admin-controlled edit/delete gate
-- ----------------------------------------------------------------------------
-- Locked by default: on creation a coordinator can publish but not later edit
-- or delete until an admin unlocks it. Admins are never blocked by this flag.
alter table events
  add column if not exists edit_locked boolean not null default true;

-- ============================================================================
-- 2. EVENTS — replace the blanket staff write policy
-- ============================================================================
-- Drop the old "any staff can do anything" policy.
drop policy if exists events_staff_write on events;

-- SELECT stays as defined in rls.sql (events_select: non-draft, or staff see
-- drafts). Coordinators are staff for is_staff(), so they still see drafts —
-- keep that. (If you want coordinators to see ONLY their own drafts, narrow
-- events_select separately.)

-- Admin: full control over every event.
drop policy if exists events_admin_all on events;
create policy events_admin_all on events
  for all using (is_admin()) with check (is_admin());

-- Coordinator INSERT: may create events, but only as themselves
-- (created_by = auth.uid()). They cannot backfill someone else as the owner.
drop policy if exists events_coord_insert on events;
create policy events_coord_insert on events
  for insert
  with check (
    is_coordinator()
    and created_by = auth.uid()
  );

-- Coordinator UPDATE: only their OWN event. The row-level gate is ownership.
-- The lock (edit_locked) is enforced at COLUMN granularity by the trigger
-- below, NOT here — because a coordinator must be able to change `status`
-- (publish/cancel) even while locked, but must NOT change any other column
-- while locked. A single RLS policy can't express "this column always, those
-- columns only when unlocked", and permissive policies OR together, so we keep
-- exactly ONE owner UPDATE policy and let the trigger split by column.
drop policy if exists events_coord_publish on events;   -- remove earlier drafts
drop policy if exists events_coord_update on events;
create policy events_coord_update on events
  for update
  using (
    is_coordinator()
    and created_by = auth.uid()
  )
  with check (
    is_coordinator()
    and created_by = auth.uid()
    -- ownership can't be reassigned by the coordinator
  );

-- Coordinator DELETE: only their own event, and only while UNLOCKED.
-- (DELETE has no per-column concern, so the lock lives directly in the policy.)
drop policy if exists events_coord_delete on events;
create policy events_coord_delete on events
  for delete
  using (
    is_coordinator()
    and created_by = auth.uid()
    and edit_locked = false
  );

-- ----------------------------------------------------------------------------
-- Column-level lock enforcement for coordinator UPDATEs
-- ----------------------------------------------------------------------------
-- Admins bypass this entirely. For a coordinator updating their own event:
--   - while edit_locked = true : ONLY `status` may change (publish/cancel).
--       Any change to a content column, or to edit_locked/created_by, is
--       rejected.
--   - while edit_locked = false: content columns may change freely, but the
--       coordinator still may not flip edit_locked or reassign created_by
--       (those are admin-only).
create or replace function enforce_event_edit_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins are unrestricted.
  if is_admin() then
    return new;
  end if;

  -- Coordinators may never change ownership or the lock flag themselves.
  if new.created_by is distinct from old.created_by then
    raise exception 'coordinators cannot reassign event ownership';
  end if;
  if new.edit_locked is distinct from old.edit_locked then
    raise exception 'only an admin can change edit_locked';
  end if;

  -- While locked, only `status` may change.
  if old.edit_locked then
    if (new.title                    is distinct from old.title)
       or (new.description           is distinct from old.description)
       or (new.banner                is distinct from old.banner)
       or (new.category              is distinct from old.category)
       or (new.venue                 is distinct from old.venue)
       or (new.start_date            is distinct from old.start_date)
       or (new.end_date              is distinct from old.end_date)
       or (new.registration_deadline is distinct from old.registration_deadline)
       or (new.max_participants      is distinct from old.max_participants)
       or (new.points                is distinct from old.points)
       or (new.benefit_attendance      is distinct from old.benefit_attendance)
       or (new.benefit_certificate     is distinct from old.benefit_certificate)
       or (new.benefit_activity_points is distinct from old.benefit_activity_points)
    then
      raise exception 'event is locked: only publish/cancel (status) is allowed until an admin unlocks it';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_event_edit_lock on events;
create trigger trg_event_edit_lock
  before update on events
  for each row execute function enforce_event_edit_lock();

-- ============================================================================
-- 3. EVENT REGISTRATIONS — attendance scoped to event owner
-- ============================================================================
-- Drop the blanket staff policy; students keep their self-service policies.
drop policy if exists reg_staff_all on event_registrations;

-- Admin: full control over all registrations.
drop policy if exists reg_admin_all on event_registrations;
create policy reg_admin_all on event_registrations
  for all using (is_admin()) with check (is_admin());

-- Coordinator: read registrations for their OWN events (in addition to their
-- own personal registrations covered by reg_select).
drop policy if exists reg_coord_select on event_registrations;
create policy reg_coord_select on event_registrations
  for select using (is_coordinator() and owns_event(event_id));

-- Coordinator: mark attendance (update status to attended/absent) ONLY for
-- participants of events they created.
drop policy if exists reg_coord_attendance on event_registrations;
create policy reg_coord_attendance on event_registrations
  for update
  using (is_coordinator() and owns_event(event_id))
  with check (
    is_coordinator()
    and owns_event(event_id)
    and status in ('registered','attended','absent','cancelled')
  );

-- ============================================================================
-- 4. EVENT SCORES — scoped to event owner
-- ============================================================================
drop policy if exists scores_staff_write on event_scores;

-- Admin: full control.
drop policy if exists scores_admin_all on event_scores;
create policy scores_admin_all on event_scores
  for all using (is_admin()) with check (is_admin());

-- Coordinator: read + write scores ONLY for events they created.
-- (scores_select from rls.sql already lets a student read their own scores.)
drop policy if exists scores_coord_select on event_scores;
create policy scores_coord_select on event_scores
  for select using (is_coordinator() and owns_event(event_id));

drop policy if exists scores_coord_write on event_scores;
create policy scores_coord_write on event_scores
  for all
  using (is_coordinator() and owns_event(event_id))
  with check (is_coordinator() and owns_event(event_id));

-- ============================================================================
-- 5. CERTIFICATES — admin-only issuance
-- ============================================================================
-- Coordinators must NOT issue certificates. Drop the staff write policy and
-- replace with admin-only. certs_select (own certs, or staff read) stays; but
-- "staff" there includes coordinators, which is fine for READING. If you want
-- coordinators to NOT even read others' certificates, narrow certs_select too.
drop policy if exists certs_staff_write on certificates;

drop policy if exists certs_admin_write on certificates;
create policy certs_admin_write on certificates
  for all using (is_admin()) with check (is_admin());

-- ============================================================================
-- 6. NOTIFICATIONS — coordinators + admins may write (unchanged intent)
-- ============================================================================
-- rls.sql's notif_staff_write already covers coordinator + admin via is_staff().
-- Left in place intentionally. (No change.)

-- ============================================================================
-- 7. Sanity notes
-- ============================================================================
-- After running:
--   - a coordinator creating an event: status can be set, created_by must be
--     self, edit_locked defaults true.
--   - coordinator editing/deleting: blocked unless admin sets edit_locked=false.
--   - coordinator attendance/scores: only on owned events.
--   - certificates: admin only.
-- Verify policy set with:
--   select tablename, policyname, cmd from pg_policies
--   where schemaname='public'
--     and tablename in ('events','event_registrations','event_scores',
--                       'certificates','notifications','profiles','students')
--   order by tablename, cmd, policyname;
