alter function public.is_admin() set search_path = '';
alter function app_private.set_updated_at() set search_path = '';

drop policy if exists avatars_public_read on storage.objects;
