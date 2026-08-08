-- Add push_compliance preference column so compliance/account-health
-- and badge-upgrade notifications can reach the in-app bell, not just email.
alter table public.notification_preferences
  add column if not exists push_compliance boolean not null default true;
