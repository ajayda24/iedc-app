-- =============================================================================
-- IEDC Hub — Cash prize pool for events
-- =============================================================================
-- Run AFTER paid-events.sql.
--
-- WHY: competitions and hackathons often advertise a cash prize ("₹5,000 for
-- the top 3"). Display-only: the app highlights it on event cards and detail
-- pages; distributing the money stays offline. Both columns are optional and
-- independent of the registration fee.
-- =============================================================================

alter table events
  add column if not exists prize_pool    int check (prize_pool is null or prize_pool > 0),
  add column if not exists prize_winners int check (prize_winners is null or prize_winners between 1 and 20);

-- A winner count only makes sense alongside an amount.
alter table events drop constraint if exists chk_prize_winners_needs_pool;
alter table events
  add constraint chk_prize_winners_needs_pool
    check (prize_winners is null or prize_pool is not null);
-- =============================================================================
