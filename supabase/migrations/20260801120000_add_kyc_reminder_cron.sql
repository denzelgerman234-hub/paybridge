-- Enable pg_cron extension if it doesn't exist
create extension if not exists pg_cron schema extensions;

-- Create the reminder logic function
create or replace function app_private.send_kyc_reminders() returns void language plpgsql security definer set search_path = public as $$
begin
  -- 1. Insert in-app notifications for workers with incomplete KYC
  insert into public.notifications (worker_id, title, body, href)
  select 
    id, 
    'Action Required: Complete Identity Verification', 
    'Hi ' || split_part(full_name, ' ', 1) || ', please complete your KYC identity verification to avoid disbursement delays and access more gigs.', 
    '/account'
  from public.worker_profiles
  where kyc_status in ('not_started', 'rejected');

  -- 2. Insert email delivery events for those who haven't opted out
  insert into public.notification_delivery_events (worker_id, channel, preference_key, title, body, href, status)
  select 
    p.id, 
    'email', 
    'email_compliance', 
    'Action Required: Complete Identity Verification', 
    'Hi ' || split_part(p.full_name, ' ', 1) || ', please complete your KYC identity verification to avoid disbursement delays and access more gigs.', 
    '/account', 
    'queued'
  from public.worker_profiles p
  left join public.notification_preferences np on np.worker_id = p.id
  where p.kyc_status in ('not_started', 'rejected')
  and coalesce(np.email_compliance, true) = true;
end;
$$;

-- Remove the job if it already exists (for idempotency)
do $$
begin
  perform cron.unschedule('send-kyc-reminders-job');
exception
  when others then null;
end;
$$;

-- Schedule it to run every 12 hours
select cron.schedule('send-kyc-reminders-job', '0 */12 * * *', 'select app_private.send_kyc_reminders()');
