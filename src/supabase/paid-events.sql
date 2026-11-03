-- =============================================================================
-- IEDC Hub — Paid events (UPI, no payment gateway)
-- =============================================================================
-- Run AFTER public-registrations.sql.
--
-- WHY: some events charge a registration fee. Money goes straight to one IEDC
-- member's UPI ID; the app only records proof. A student pays via a UPI link /
-- QR, then submits the 12-digit UPI transaction ID (UTR). Staff check the UTRs
-- against the receiver's GPay history and mark each one verified or rejected.
--
-- Purely additive: registration_status is untouched, so attendance, stats and
-- certificate logic keep working. Free events (fee_amount = 0) behave exactly
-- as before, with payment_status = 'not_required'.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. events: fee + who to pay
-- ----------------------------------------------------------------------------
alter table events
  add column if not exists fee_amount     int not null default 0 check (fee_amount >= 0),
  add column if not exists upi_id         text,
  add column if not exists upi_payee_name text;

alter table events drop constraint if exists chk_paid_event_upi;
alter table events
  add constraint chk_paid_event_upi check (fee_amount = 0 or upi_id is not null);

-- ----------------------------------------------------------------------------
-- 2. event_registrations: payment proof + verification
-- ----------------------------------------------------------------------------
alter table event_registrations
  add column if not exists payment_status text not null default 'not_required'
    check (payment_status in ('not_required','pending','verified','rejected')),
  add column if not exists payment_ref         text,
  add column if not exists payment_verified_at timestamptz,
  add column if not exists payment_verified_by uuid references profiles (id) on delete set null;

-- A UTR can back only one registration per event.
create unique index if not exists uq_event_reg_payment_ref
  on event_registrations (event_id, payment_ref) where payment_ref is not null;

create index if not exists idx_event_reg_payment_status
  on event_registrations (payment_status);

-- ----------------------------------------------------------------------------
-- 3. Guard: students can't verify themselves
-- ----------------------------------------------------------------------------
-- reg_update_self_cancel lets a student update their own row, which would
-- otherwise include payment_status. This trigger:
--   * on INSERT: derives payment_status from the event fee and requires a
--     well-formed UTR for paid events.
--   * on UPDATE by a non-staff user: allows only (re)submitting a UTR, which
--     resets the payment to 'pending'; any verification change is rejected.
-- The service-role client (public guest flow) has auth.uid() NULL and is
-- trusted — that server code validates input itself.
create or replace function guard_registration_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fee      int;
  v_is_staff boolean;
begin
  select fee_amount into v_fee from events where id = new.event_id;
  v_is_staff := auth.uid() is null
    or is_admin()
    or (is_coordinator() and owns_event(new.event_id));

  if tg_op = 'INSERT' then
    if coalesce(v_fee, 0) > 0 then
      if new.payment_ref is null or new.payment_ref !~ '^\d{12}$' then
        raise exception 'payment_ref must be a 12-digit UPI transaction ID';
      end if;
      if not v_is_staff or new.payment_status not in ('pending','verified') then
        new.payment_status := 'pending';
      end if;
    else
      new.payment_status := 'not_required';
      new.payment_ref := null;
    end if;
    if new.payment_status <> 'verified' then
      new.payment_verified_at := null;
      new.payment_verified_by := null;
    end if;
    return new;
  end if;

  -- UPDATE
  if v_is_staff then
    return new;
  end if;

  if new.payment_ref is distinct from old.payment_ref then
    if coalesce(v_fee, 0) = 0 then
      raise exception 'this event has no fee';
    end if;
    if new.payment_ref is null or new.payment_ref !~ '^\d{12}$' then
      raise exception 'payment_ref must be a 12-digit UPI transaction ID';
    end if;
    new.payment_status := 'pending';
    new.payment_verified_at := null;
    new.payment_verified_by := null;
  elsif new.payment_status is distinct from old.payment_status
     or new.payment_verified_at is distinct from old.payment_verified_at
     or new.payment_verified_by is distinct from old.payment_verified_by then
    raise exception 'only staff can change payment verification';
  end if;
  return new;
end $$;

drop trigger if exists trg_reg_payment_guard on event_registrations;
create trigger trg_reg_payment_guard
  before insert or update on event_registrations
  for each row execute function guard_registration_payment();
-- =============================================================================
