-- Tighten worker-facing RLS and grants so workers cannot mutate review,
-- compliance, ledger, or status fields by calling PostgREST directly.

revoke delete on all tables in schema public from authenticated;

alter table public.worker_profiles force row level security;
alter table public.training_progress force row level security;
alter table public.quiz_attempts force row level security;
alter table public.interview_slots force row level security;
alter table public.notification_preferences force row level security;
alter table public.worker_security_settings force row level security;
alter table public.worker_bank_accounts force row level security;
alter table public.worker_kyc_submissions force row level security;
alter table public.worker_documents force row level security;
alter table public.worker_signed_documents force row level security;
alter table public.worker_gigs force row level security;
alter table public.gig_applications force row level security;
alter table public.operation_threads force row level security;
alter table public.operation_messages force row level security;
alter table public.worker_disbursements force row level security;
alter table public.disbursement_proofs force row level security;
alter table public.funding_events force row level security;
alter table public.commission_ledger force row level security;
alter table public.commission_payouts force row level security;
alter table public.account_health_checks force row level security;
alter table public.compliance_reviews force row level security;
alter table public.notifications force row level security;
alter table public.admin_notifications force row level security;
alter table public.audit_events force row level security;
alter table public.support_tickets force row level security;
alter table public.support_chat_threads force row level security;
alter table public.support_chat_messages force row level security;
alter table public.storage_objects force row level security;

revoke insert on public.worker_profiles from authenticated;
revoke update on public.worker_profiles from authenticated;
grant update(full_name, phone, country, avatar_url, address_line1, address_city, address_state, address_zip, onboarding_step, onboarding_completed)
  on public.worker_profiles to authenticated;

revoke update on public.worker_bank_accounts from authenticated;
grant update(bank_name, account_label, account_type, account_last4, routing_last4, is_primary)
  on public.worker_bank_accounts to authenticated;

revoke insert on public.disbursement_proofs from authenticated;
grant insert(disbursement_id, worker_id, proof_url, transaction_id, notes)
  on public.disbursement_proofs to authenticated;

revoke insert on public.commission_payouts from authenticated;
grant insert(worker_id, amount, method, destination)
  on public.commission_payouts to authenticated;

revoke update on public.notifications from authenticated;
grant update(read) on public.notifications to authenticated;

drop policy if exists training_progress_all on public.training_progress;
create policy training_progress_read on public.training_progress
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy training_progress_insert on public.training_progress
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy training_progress_update on public.training_progress
  for update to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin())
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists quiz_attempts_all on public.quiz_attempts;
create policy quiz_attempts_read on public.quiz_attempts
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy quiz_attempts_insert on public.quiz_attempts
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists interview_slots_all on public.interview_slots;
create policy interview_slots_read on public.interview_slots
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy interview_slots_insert on public.interview_slots
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy interview_slots_update on public.interview_slots
  for update to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin())
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists notification_preferences_all on public.notification_preferences;
create policy notification_preferences_read on public.notification_preferences
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy notification_preferences_insert on public.notification_preferences
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy notification_preferences_update on public.notification_preferences
  for update to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin())
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists worker_security_settings_all on public.worker_security_settings;
create policy worker_security_settings_read on public.worker_security_settings
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_security_settings_insert on public.worker_security_settings
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_security_settings_update on public.worker_security_settings
  for update to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin())
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists worker_bank_accounts_all on public.worker_bank_accounts;
create policy worker_bank_accounts_read on public.worker_bank_accounts
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_bank_accounts_insert on public.worker_bank_accounts
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_bank_accounts_update on public.worker_bank_accounts
  for update to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin())
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists worker_kyc_submissions_all on public.worker_kyc_submissions;
create policy worker_kyc_submissions_read on public.worker_kyc_submissions
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_kyc_submissions_insert on public.worker_kyc_submissions
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_kyc_submissions_admin_update on public.worker_kyc_submissions
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists worker_documents_all on public.worker_documents;
create policy worker_documents_read on public.worker_documents
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_documents_insert on public.worker_documents
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_documents_admin_update on public.worker_documents
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists worker_signed_documents_all on public.worker_signed_documents;
create policy worker_signed_documents_read on public.worker_signed_documents
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_signed_documents_insert on public.worker_signed_documents
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy worker_signed_documents_update on public.worker_signed_documents
  for update to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin())
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists gig_applications_all on public.gig_applications;
create policy gig_applications_read on public.gig_applications
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy gig_applications_insert on public.gig_applications
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy gig_applications_admin_update on public.gig_applications
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists operation_threads_admin_all on public.operation_threads;
create policy operation_threads_admin_insert on public.operation_threads
  for insert to authenticated
  with check(public.is_admin());
create policy operation_threads_admin_update on public.operation_threads
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists worker_disbursements_update on public.worker_disbursements;
create policy worker_disbursements_admin_update on public.worker_disbursements
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists disbursement_proofs_all on public.disbursement_proofs;
create policy disbursement_proofs_read on public.disbursement_proofs
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy disbursement_proofs_insert on public.disbursement_proofs
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy disbursement_proofs_admin_update on public.disbursement_proofs
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists funding_events_admin_all on public.funding_events;
create policy funding_events_admin_insert on public.funding_events
  for insert to authenticated
  with check(public.is_admin());
create policy funding_events_admin_update on public.funding_events
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists commission_ledger_admin_all on public.commission_ledger;
create policy commission_ledger_admin_insert on public.commission_ledger
  for insert to authenticated
  with check(public.is_admin());
create policy commission_ledger_admin_update on public.commission_ledger
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists commission_payouts_all on public.commission_payouts;
create policy commission_payouts_read on public.commission_payouts
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy commission_payouts_insert on public.commission_payouts
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy commission_payouts_admin_update on public.commission_payouts
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists account_health_checks_all on public.account_health_checks;
create policy account_health_checks_read on public.account_health_checks
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy account_health_checks_admin_insert on public.account_health_checks
  for insert to authenticated
  with check(public.is_admin());
create policy account_health_checks_admin_update on public.account_health_checks
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists notifications_all on public.notifications;
create policy notifications_read on public.notifications
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy notifications_insert on public.notifications
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy notifications_update_read_state on public.notifications
  for update to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin())
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists admin_notifications_admin_all on public.admin_notifications;
create policy admin_notifications_admin_read on public.admin_notifications
  for select to authenticated
  using(public.is_admin());
create policy admin_notifications_admin_insert on public.admin_notifications
  for insert to authenticated
  with check(public.is_admin());
create policy admin_notifications_admin_update on public.admin_notifications
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());

drop policy if exists audit_events_read on public.audit_events;
drop policy if exists audit_events_insert on public.audit_events;
create policy audit_events_read on public.audit_events
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy audit_events_admin_insert on public.audit_events
  for insert to authenticated
  with check(public.is_admin());

drop policy if exists support_tickets_all on public.support_tickets;
create policy support_tickets_read on public.support_tickets
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy support_tickets_insert on public.support_tickets
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy support_tickets_update on public.support_tickets
  for update to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin())
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists support_chat_threads_all on public.support_chat_threads;
create policy support_chat_threads_read on public.support_chat_threads
  for select to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());
create policy support_chat_threads_insert on public.support_chat_threads
  for insert to authenticated
  with check(worker_id = (select auth.uid()) or public.is_admin());
create policy support_chat_threads_update on public.support_chat_threads
  for update to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin())
  with check(worker_id = (select auth.uid()) or public.is_admin());

drop policy if exists storage_objects_all on public.storage_objects;
create policy storage_objects_read on public.storage_objects
  for select to authenticated
  using(owner_id = (select auth.uid()) or public.is_admin());
create policy storage_objects_insert on public.storage_objects
  for insert to authenticated
  with check(owner_id = (select auth.uid()) or public.is_admin());
create policy storage_objects_admin_update on public.storage_objects
  for update to authenticated
  using(public.is_admin())
  with check(public.is_admin());
