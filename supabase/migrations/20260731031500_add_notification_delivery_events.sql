create table if not exists public.notification_delivery_events(
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  channel text not null check(channel in ('email','sms')),
  preference_key text not null check(preference_key in (
    'email_new_gig',
    'email_disbursement',
    'email_fee_record',
    'email_compliance',
    'sms_disbursement',
    'push_new_gig',
    'push_disbursement'
  )),
  title text not null,
  body text not null,
  href text,
  status text not null default 'queued' check(status in ('queued','sent','failed','skipped')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_delivery_events_worker_idx
  on public.notification_delivery_events(worker_id, created_at desc);

create index if not exists notification_delivery_events_status_idx
  on public.notification_delivery_events(status, created_at)
  where status = 'queued';

alter table public.notification_delivery_events enable row level security;

grant select, insert, update on public.notification_delivery_events to authenticated;

drop policy if exists notification_delivery_events_read on public.notification_delivery_events;
create policy notification_delivery_events_read
  on public.notification_delivery_events
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists notification_delivery_events_insert on public.notification_delivery_events;
create policy notification_delivery_events_insert
  on public.notification_delivery_events
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists notification_delivery_events_update_admin on public.notification_delivery_events;
create policy notification_delivery_events_update_admin
  on public.notification_delivery_events
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop trigger if exists notification_delivery_events_updated on public.notification_delivery_events;
create trigger notification_delivery_events_updated
  before update on public.notification_delivery_events
  for each row execute function app_private.set_updated_at();