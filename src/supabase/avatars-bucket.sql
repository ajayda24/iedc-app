-- =============================================================================
-- IEDC Hub — Avatars storage bucket
-- =============================================================================
-- Run in the Supabase SQL editor. Creates a PUBLIC bucket for profile avatars
-- (public read enables shareable/public profiles later) and restricts writes to
-- the owner. Objects are stored at path `{auth_uid}/avatar.webp`, so the first
-- path segment identifies the owner.
-- =============================================================================

-- Public bucket (id = name = 'avatars').
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Anyone may read (public profiles / shareable links).
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- A user may write/replace/delete ONLY objects under their own uid folder.
drop policy if exists "avatars owner write" on storage.objects;
create policy "avatars owner write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
