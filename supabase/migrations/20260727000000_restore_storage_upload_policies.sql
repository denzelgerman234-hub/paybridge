-- Restore Supabase Storage upload policies for worker-owned files.
-- This is intentionally idempotent because production may have buckets/policies
-- created manually or by an earlier migration.

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('kyc-documents', 'kyc-documents', false),
  ('transaction-proofs', 'transaction-proofs', false),
  ('account-documents', 'account-documents', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists avatars_public_read on storage.objects;
drop policy if exists avatars_owner_insert on storage.objects;
drop policy if exists avatars_owner_update on storage.objects;
drop policy if exists private_files_read on storage.objects;
drop policy if exists private_files_insert on storage.objects;
drop policy if exists private_files_update on storage.objects;

create policy avatars_public_read on storage.objects
  for select to public
  using (bucket_id = 'avatars');

create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (
        (storage.foldername(name))[1] = 'avatars'
        and (storage.foldername(name))[2] = (select auth.uid())::text
      )
    )
  );

create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (
        (storage.foldername(name))[1] = 'avatars'
        and (storage.foldername(name))[2] = (select auth.uid())::text
      )
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (
        (storage.foldername(name))[1] = 'avatars'
        and (storage.foldername(name))[2] = (select auth.uid())::text
      )
      or public.is_admin()
    )
  );

create policy private_files_read on storage.objects
  for select to authenticated
  using (
    bucket_id in ('kyc-documents', 'transaction-proofs', 'account-documents')
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

create policy private_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('kyc-documents', 'transaction-proofs', 'account-documents')
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

create policy private_files_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('kyc-documents', 'transaction-proofs', 'account-documents')
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  )
  with check (
    bucket_id in ('kyc-documents', 'transaction-proofs', 'account-documents')
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );