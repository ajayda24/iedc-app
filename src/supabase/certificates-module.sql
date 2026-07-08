-- =============================================================================
-- IEDC Hub — Certificate module
-- =============================================================================
-- Run AFTER schema.sql, roster-lifecycle.sql, rls.sql, views.sql, view-security.sql.
--
-- What this adds:
--   1. events.certificate_template   -> which code template an event's certs use
--   2. certificates.serial           -> human-readable public verification code
--   3. certificate_public            -> a security-DEFINER view exposing ONLY the
--                                       fields needed to render/verify a cert to
--                                       ANYONE (anon), without opening profiles or
--                                       the certificates table itself. This mirrors
--                                       the "public_leaderboard" pattern documented
--                                       in view-security.sql.
--
-- Certificates are CODE-DESIGNED (JSX/Tailwind templates), not uploaded files.
-- `certificate_url` is repurposed to hold the canonical /certificates/<id> path;
-- it may stay null and the app can derive the path from the id.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. events.certificate_template
-- ----------------------------------------------------------------------------
-- Nullable. When null, the app falls back to a category default, then 'aurora'.
alter table events
  add column if not exists certificate_template text;

-- ----------------------------------------------------------------------------
-- 2. certificates.serial — stable public verification code
-- ----------------------------------------------------------------------------
-- Format: IEDC-<YYYY>-<6 hex>, derived from issued_at + id. Generated once on
-- insert by a trigger so it's immutable and printable on the certificate.
alter table certificates
  add column if not exists serial text unique;

create or replace function set_certificate_serial()
returns trigger
language plpgsql
as $$
begin
  if new.serial is null then
    new.serial :=
      'IEDC-'
      || to_char(coalesce(new.issued_at, now()), 'YYYY')
      || '-'
      || upper(substr(replace(new.id::text, '-', ''), 1, 6));
  end if;
  return new;
end $$;

drop trigger if exists trg_cert_serial on certificates;
create trigger trg_cert_serial
  before insert on certificates
  for each row execute function set_certificate_serial();

-- Backfill any existing rows that predate the trigger.
update certificates
  set serial =
    'IEDC-'
    || to_char(issued_at, 'YYYY')
    || '-'
    || upper(substr(replace(id::text, '-', ''), 1, 6))
  where serial is null;

create index if not exists idx_certificates_serial on certificates (serial);

-- ----------------------------------------------------------------------------
-- 3. certificate_public — anon-readable verification view
-- ----------------------------------------------------------------------------
-- security_invoker = false  -> runs as the view OWNER, bypassing RLS on
-- certificates / profiles / events. That's intentional and SAFE here because we
-- hand-pick only non-sensitive columns (no email, phone, student_id, points).
-- A certificate is a public credential; exposing "who, what event, when, type"
-- is the whole point of a shareable verify link.
create or replace view certificate_public
  with (security_invoker = false) as
select
  c.id,
  c.serial,
  c.certificate_type,
  c.issued_at,
  p.name            as recipient_name,
  p.id              as recipient_id,
  p.avatar          as recipient_avatar,
  e.id              as event_id,
  e.title           as event_title,
  e.category        as event_category,
  e.start_date      as event_date,
  e.certificate_template
from certificates c
  join profiles p on p.id = c.profile_id
  left join events e on e.id = c.event_id;

-- Anyone (logged in or not) may read the public view.
grant select on certificate_public to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Notes
-- ----------------------------------------------------------------------------
-- * The base `certificates` table keeps its existing RLS (owner/staff only) from
--   rls.sql — we did NOT widen it. Public access flows exclusively through the
--   narrow `certificate_public` view.
-- * Look up a certificate for the public page by `serial` OR `id`:
--     select * from certificate_public where serial = $1 or id::text = $1;
-- * Signatory name/role and the org logo are app-level config for now (passed
--   into the template); wire them to an events/org settings table later.
