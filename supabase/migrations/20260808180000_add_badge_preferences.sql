-- Add push_badge and email_badge preferences for badge updates
alter table public.notification_preferences
  add column if not exists push_badge boolean not null default true,
  add column if not exists email_badge boolean not null default true;
