alter table public.notifications
  add column if not exists cleared_at timestamptz;

grant update(read, cleared_at) on public.notifications to authenticated;
