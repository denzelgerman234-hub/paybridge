-- Add attachments support to support_chat_messages
-- Attachments are stored as a JSONB array of {url, name, type} objects

alter table public.support_chat_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;

-- Create a dedicated storage bucket for chat attachments (public so signed URLs are not needed)
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

-- RLS: any authenticated user (worker or admin) can read chat attachment files
drop policy if exists chat_attachments_read on storage.objects;
create policy chat_attachments_read on storage.objects
  for select to public
  using (bucket_id = 'chat-attachments');

-- RLS: workers can upload to their own sub-folder; admins can upload to any folder
drop policy if exists chat_attachments_insert on storage.objects;
create policy chat_attachments_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );

-- RLS: only admin can update/delete (not strictly needed but good hygiene)
drop policy if exists chat_attachments_update on storage.objects;
create policy chat_attachments_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'chat-attachments'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );
