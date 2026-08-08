-- Enable Supabase Realtime on the notifications table so that
-- the useNotifications hook receives live push events when a new
-- notification is inserted/updated for a worker.
-- Without this, the postgres_changes subscription silently receives
-- no events, forcing workers to reload the page manually.

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;  -- already added, safe to ignore
end $$;
