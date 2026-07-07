-- =============================================================================
-- IEDC Hub — Profile self-service fields (bio + socials)
-- =============================================================================
-- Run AFTER schema.sql and rls.sql. Adds the editable free-text fields shown on
-- the profile ("resume") page. All nullable, so existing rows are unaffected.
--
-- `profiles_current` is `select p.*` (roster-lifecycle.sql), so these columns
-- flow through the view automatically — no view change needed.
-- =============================================================================

alter table profiles add column if not exists bio      text;
alter table profiles add column if not exists github   text;
alter table profiles add column if not exists linkedin text;
alter table profiles add column if not exists website  text;

-- Widen the column-level update grant so a student may edit these too.
-- (Counters and role remain protected — they are simply not in this list.)
-- This REPLACES the 3-column grant in rls.sql (name, phone, avatar).
grant update (name, phone, avatar, bio, github, linkedin, website)
  on profiles to authenticated;
