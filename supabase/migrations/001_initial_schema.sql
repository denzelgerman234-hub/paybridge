create extension if not exists pgcrypto;
create schema if not exists app_private;

create type public.badge_tier as enum ('trainee','associate','senior','expert','master');
create type public.disbursement_status as enum ('pending','sent','verified','failed','proof_rejected');
create type public.onboarding_step as enum ('profile','training','quiz','interview','bank','payout');
create type public.payout_method as enum ('paypal','bank_transfer','zelle','cashapp','wire');
create type public.gig_status as enum ('open','accepted','funded','in_progress','completed','cancelled');
create type public.funding_status as enum ('unfunded','funding_pending','funded','funding_confirmed','disbursement_in_progress','awaiting_verification','verified_complete','settled','funding_failed','disbursement_failed','proof_rejected','compliance_hold','disputed','suspended');
create type public.funding_event_type as enum ('deposit','withdrawal','refund');
create type public.commission_status as enum ('earned','pending_settlement','settled','withdrawn');
create type public.account_health_status as enum ('healthy','warning','flagged','suspended');
create type public.compliance_action as enum ('warning','flag','suspension','termination','clearance');
create type public.gig_application_status as enum ('submitted','under_review','accepted','declined');
create type public.kyc_status as enum ('not_started','submitted','in_review','verified','rejected');
create type public.worker_bank_account_type as enum ('checking','savings','business_checking');
create type public.worker_bank_account_status as enum ('pending_review','verified','needs_attention');
create type public.thread_status as enum ('open','closed');
create type public.operation_sender_role as enum ('worker','operations','system');
create type public.support_sender_role as enum ('worker','support');
create type public.support_ticket_type as enum ('general','incident');
create type public.support_ticket_status as enum ('open','in_progress','resolved');
create type public.support_ticket_priority as enum ('normal','urgent');
create type public.legal_document_type as enum ('worker_agreement','irs_w9','aml_acknowledgment','ofac_compliance','code_of_conduct');
create type public.storage_bucket_name as enum ('kyc-documents','transaction-proofs','account-documents');
create type public.storage_entity_type as enum ('worker_profile','worker_disbursement','worker_gig');

create or replace function public.is_admin() returns boolean language sql stable as $$
  select coalesce((auth.jwt()->'app_metadata'->>'role')='admin',false)
      or coalesce((auth.jwt()->'app_metadata'->>'admin')::boolean,false);
$$;

create or replace function app_private.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end;
$$;

create table public.worker_profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, phone text not null, country text not null, avatar_url text,
  badge public.badge_tier not null default 'trainee',
  total_gigs_completed integer not null default 0 check(total_gigs_completed>=0),
  total_disbursed numeric(12,2) not null default 0 check(total_disbursed>=0),
  total_earned numeric(12,2) not null default 0 check(total_earned>=0),
  rating numeric(3,1) not null default 0 check(rating>=0 and rating<=5),
  onboarding_step public.onboarding_step not null default 'profile',
  onboarding_completed boolean not null default false,
  account_health public.account_health_status not null default 'healthy',
  kyc_status public.kyc_status not null default 'not_started',
  address_line1 text,address_city text,address_state text,address_zip text,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index worker_profiles_health_idx on public.worker_profiles(account_health);
create trigger worker_profiles_updated before update on public.worker_profiles for each row execute function app_private.set_updated_at();

create or replace function app_private.handle_new_user() returns trigger language plpgsql security definer set search_path=public,auth as $$
begin
  insert into public.worker_profiles(id,full_name,phone,country)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name','New Worker'),coalesce(new.raw_user_meta_data->>'phone',''),coalesce(new.raw_user_meta_data->>'country',''))
  on conflict(id) do nothing;
  return new;
end;
$$;
revoke all on function app_private.handle_new_user() from public,anon,authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function app_private.handle_new_user();

create table public.training_progress(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,module_id text not null,completed boolean not null default false,completed_at timestamptz,unique(worker_id,module_id));
create table public.quiz_attempts(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,score integer not null check(score>=0),passed boolean not null default false,completed_at timestamptz not null default now());
create table public.interview_slots(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,scheduled_at timestamptz not null,status text not null default 'scheduled' check(status in('scheduled','completed','cancelled','no_show')),notes text);
create table public.notification_preferences(id uuid primary key default gen_random_uuid(),worker_id uuid not null unique references public.worker_profiles(id) on delete cascade,email_new_gig boolean not null default true,email_disbursement boolean not null default true,email_fee_record boolean not null default true,email_compliance boolean not null default true,sms_disbursement boolean not null default false,push_new_gig boolean not null default true,push_disbursement boolean not null default true);
create table public.worker_security_settings(id uuid primary key default gen_random_uuid(),worker_id uuid not null unique references public.worker_profiles(id) on delete cascade,two_factor_enabled boolean not null default false,two_factor_method text check(two_factor_method is null or two_factor_method='totp'),two_factor_enabled_at timestamptz,updated_at timestamptz not null default now());
create trigger worker_security_settings_updated before update on public.worker_security_settings for each row execute function app_private.set_updated_at();

create table public.worker_bank_accounts(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,bank_name text not null,account_label text not null,account_type public.worker_bank_account_type not null,account_last4 text not null check(account_last4~'^[0-9]{4}$'),routing_last4 text not null check(routing_last4~'^[0-9]{4}$'),is_primary boolean not null default false,status public.worker_bank_account_status not null default 'pending_review',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index worker_bank_accounts_worker_idx on public.worker_bank_accounts(worker_id);
create unique index worker_bank_accounts_primary_idx on public.worker_bank_accounts(worker_id) where is_primary;
create trigger worker_bank_accounts_updated before update on public.worker_bank_accounts for each row execute function app_private.set_updated_at();

create table public.worker_kyc_submissions(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,id_document_type text not null check(id_document_type in('id_card','drivers_license','passport','state_id')),id_document_file_name text not null,id_document_url text,tax_id_type text not null check(tax_id_type in('ssn','itin','ein')),tax_id_last4 text not null check(tax_id_last4~'^[0-9]{4}$'),status public.kyc_status not null default 'submitted',submitted_at timestamptz not null default now(),reviewed_at timestamptz,review_note text);
create index worker_kyc_submissions_worker_idx on public.worker_kyc_submissions(worker_id);
create table public.worker_documents(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,type text not null check(type in('id_card','passport','drivers_license','proof_of_address','selfie','other')),url text not null,verified boolean not null default false,uploaded_at timestamptz not null default now());
create table public.worker_signed_documents(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,document_type public.legal_document_type not null,document_version text not null default '1.0',signed_at timestamptz not null default now(),signature text not null,w9_name text,w9_business_name text,w9_tax_classification text,w9_address text,w9_city_state_zip text,w9_tax_id_type text check(w9_tax_id_type is null or w9_tax_id_type in('ssn','ein')),w9_tax_id_last4 text check(w9_tax_id_last4 is null or w9_tax_id_last4~'^[0-9]{4}$'),unique(worker_id,document_type));
create table public.worker_gigs(id uuid primary key default gen_random_uuid(),worker_id uuid references public.worker_profiles(id),client_name text not null,client_contact text,total_principal numeric(12,2) not null check(total_principal>0),commission_rate numeric(5,2) not null default 10 check(commission_rate>=0 and commission_rate<=100),commission_amount numeric(12,2) generated always as (total_principal*commission_rate/100) stored,recipient_count integer not null check(recipient_count>0),disbursement_methods text[] not null default '{}',badge_required public.badge_tier,status public.gig_status not null default 'open',funding_status public.funding_status not null default 'unfunded',operations_specialist text,deadline timestamptz not null,accepted_at timestamptz,funded_at timestamptz,completed_at timestamptz,funded boolean not null default false,notes text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index worker_gigs_status_idx on public.worker_gigs(status);
create index worker_gigs_worker_idx on public.worker_gigs(worker_id);
create index worker_gigs_open_idx on public.worker_gigs(status,badge_required) where status='open';
create trigger worker_gigs_updated before update on public.worker_gigs for each row execute function app_private.set_updated_at();

create table public.gig_applications(id uuid primary key default gen_random_uuid(),gig_id uuid not null references public.worker_gigs(id) on delete cascade,worker_id uuid not null references public.worker_profiles(id) on delete cascade,worker_name text not null,status public.gig_application_status not null default 'submitted',note text not null default '',review_note text,reviewed_by uuid references auth.users(id),submitted_at timestamptz not null default now(),reviewed_at timestamptz,updated_at timestamptz not null default now(),unique(gig_id,worker_id));
create index gig_applications_status_idx on public.gig_applications(status);
create index gig_applications_worker_idx on public.gig_applications(worker_id);
create trigger gig_applications_updated before update on public.gig_applications for each row execute function app_private.set_updated_at();

create table public.operation_threads(id uuid primary key default gen_random_uuid(),gig_id uuid not null references public.worker_gigs(id) on delete cascade,worker_id uuid not null references public.worker_profiles(id) on delete cascade,specialist_name text not null,status public.thread_status not null default 'open',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(gig_id,worker_id));
create index operation_threads_worker_idx on public.operation_threads(worker_id);
create index operation_threads_gig_idx on public.operation_threads(gig_id);
create trigger operation_threads_updated before update on public.operation_threads for each row execute function app_private.set_updated_at();

create table public.operation_messages(id uuid primary key default gen_random_uuid(),thread_id uuid not null references public.operation_threads(id) on delete cascade,sender_role public.operation_sender_role not null,sender_name text not null,body text not null,created_at timestamptz not null default now());
create index operation_messages_thread_idx on public.operation_messages(thread_id,created_at);

create table public.worker_disbursements(id uuid primary key default gen_random_uuid(),gig_id uuid not null references public.worker_gigs(id) on delete cascade,worker_id uuid not null references public.worker_profiles(id) on delete cascade,recipient_name text not null,amount numeric(12,2) not null check(amount>0),method text not null,destination text not null,status public.disbursement_status not null default 'pending',transaction_id text,proof_url text,proof_file_name text,notes text,sent_at timestamptz,verified_at timestamptz,created_at timestamptz not null default now());
create index worker_disbursements_gig_idx on public.worker_disbursements(gig_id);
create index worker_disbursements_worker_idx on public.worker_disbursements(worker_id);
create index worker_disbursements_status_idx on public.worker_disbursements(status);

create table public.disbursement_proofs(id uuid primary key default gen_random_uuid(),disbursement_id uuid not null references public.worker_disbursements(id) on delete cascade,worker_id uuid not null references public.worker_profiles(id) on delete cascade,proof_url text not null,transaction_id text,notes text,submitted_at timestamptz not null default now(),reviewed_at timestamptz,reviewed_by uuid references auth.users(id),accepted boolean);
create index disbursement_proofs_disbursement_idx on public.disbursement_proofs(disbursement_id);

create table public.funding_events(id uuid primary key default gen_random_uuid(),gig_id uuid not null references public.worker_gigs(id) on delete cascade,worker_id uuid not null references public.worker_profiles(id) on delete cascade,amount numeric(12,2) not null check(amount>0),type public.funding_event_type not null,reference text not null,confirmed boolean not null default false,confirmed_at timestamptz,created_at timestamptz not null default now());
create index funding_events_worker_idx on public.funding_events(worker_id);
create index funding_events_gig_idx on public.funding_events(gig_id);

create table public.commission_ledger(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,gig_id uuid not null references public.worker_gigs(id) on delete cascade,amount numeric(12,2) not null check(amount>0),status public.commission_status not null default 'earned',settled_at timestamptz,created_at timestamptz not null default now(),unique(worker_id,gig_id));
create index commission_ledger_worker_idx on public.commission_ledger(worker_id,status);

create table public.commission_payouts(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,amount numeric(12,2) not null check(amount>0),method public.payout_method not null,destination text not null,status text not null default 'pending' check(status in('pending','processing','completed','failed')),reference text,requested_at timestamptz not null default now(),processed_at timestamptz);
create index commission_payouts_worker_idx on public.commission_payouts(worker_id);

create table public.account_health_checks(id uuid primary key default gen_random_uuid(),worker_id uuid not null unique references public.worker_profiles(id) on delete cascade,disbursement_account_type text not null check(disbursement_account_type in('dedicated','shared','unknown')),last_verified timestamptz not null default now(),next_check timestamptz not null default(now()+interval '7 days'),status public.account_health_status not null default 'healthy',notes text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create trigger account_health_checks_updated before update on public.account_health_checks for each row execute function app_private.set_updated_at();

create table public.compliance_reviews(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,action public.compliance_action not null,reason text not null,notes text,reviewed_by uuid references auth.users(id),created_at timestamptz not null default now());
create table public.notifications(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,title text not null,body text not null,href text not null default '/',read boolean not null default false,created_at timestamptz not null default now());
create index notifications_worker_idx on public.notifications(worker_id,created_at desc);
create table public.admin_notifications(id uuid primary key default gen_random_uuid(),title text not null,body text not null,href text not null default '/admin',read boolean not null default false,created_at timestamptz not null default now());
create table public.audit_events(id uuid primary key default gen_random_uuid(),worker_id uuid references public.worker_profiles(id) on delete set null,event_type text not null,entity_type text not null,entity_id uuid,summary text not null,created_at timestamptz not null default now());
create index audit_events_worker_idx on public.audit_events(worker_id,created_at desc);

create table public.support_tickets(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,subject text not null,message text not null,type public.support_ticket_type not null default 'general',status public.support_ticket_status not null default 'open',priority public.support_ticket_priority not null default 'normal',related_gig_id uuid references public.worker_gigs(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create trigger support_tickets_updated before update on public.support_tickets for each row execute function app_private.set_updated_at();
create table public.support_chat_threads(id uuid primary key default gen_random_uuid(),worker_id uuid not null references public.worker_profiles(id) on delete cascade,status public.thread_status not null default 'open',unread_for_admin boolean not null default false,unread_for_worker boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create trigger support_chat_threads_updated before update on public.support_chat_threads for each row execute function app_private.set_updated_at();
create table public.support_chat_messages(id uuid primary key default gen_random_uuid(),thread_id uuid not null references public.support_chat_threads(id) on delete cascade,sender_role public.support_sender_role not null,sender_name text not null,body text not null,created_at timestamptz not null default now());

create table public.storage_objects(id uuid primary key default gen_random_uuid(),bucket public.storage_bucket_name not null,path text not null,owner_id uuid not null references public.worker_profiles(id) on delete cascade,file_name text not null,file_type text not null,size bigint not null check(size>=0),entity_type public.storage_entity_type not null,entity_id uuid not null,created_at timestamptz not null default now(),unique(bucket,path));
insert into storage.buckets(id,name,public) values('avatars','avatars',true),('kyc-documents','kyc-documents',false),('transaction-proofs','transaction-proofs',false),('account-documents','account-documents',false) on conflict(id) do update set public=excluded.public;
-- RLS and Data API grants
alter table public.worker_profiles enable row level security;
alter table public.training_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.interview_slots enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.worker_security_settings enable row level security;
alter table public.worker_bank_accounts enable row level security;
alter table public.worker_kyc_submissions enable row level security;
alter table public.worker_documents enable row level security;
alter table public.worker_signed_documents enable row level security;
alter table public.worker_gigs enable row level security;
alter table public.gig_applications enable row level security;
alter table public.operation_threads enable row level security;
alter table public.operation_messages enable row level security;
alter table public.worker_disbursements enable row level security;
alter table public.disbursement_proofs enable row level security;
alter table public.funding_events enable row level security;
alter table public.commission_ledger enable row level security;
alter table public.commission_payouts enable row level security;
alter table public.account_health_checks enable row level security;
alter table public.compliance_reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.audit_events enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_chat_threads enable row level security;
alter table public.support_chat_messages enable row level security;
alter table public.storage_objects enable row level security;

grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;

create policy worker_profiles_read on public.worker_profiles for select to authenticated using(id=(select auth.uid()) or public.is_admin());
create policy worker_profiles_update on public.worker_profiles for update to authenticated using(id=(select auth.uid()) or public.is_admin()) with check(id=(select auth.uid()) or public.is_admin());

create policy training_progress_all on public.training_progress for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy quiz_attempts_all on public.quiz_attempts for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy interview_slots_all on public.interview_slots for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy notification_preferences_all on public.notification_preferences for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy worker_security_settings_all on public.worker_security_settings for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy worker_bank_accounts_all on public.worker_bank_accounts for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy worker_kyc_submissions_all on public.worker_kyc_submissions for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy worker_documents_all on public.worker_documents for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy worker_signed_documents_all on public.worker_signed_documents for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());

create policy worker_gigs_read on public.worker_gigs for select to authenticated using(status='open' or worker_id=(select auth.uid()) or public.is_admin());
create policy worker_gigs_admin_insert on public.worker_gigs for insert to authenticated with check(public.is_admin());
create policy worker_gigs_admin_update on public.worker_gigs for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy gig_applications_all on public.gig_applications for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());

create policy operation_threads_read on public.operation_threads for select to authenticated using(worker_id=(select auth.uid()) or public.is_admin());
create policy operation_threads_admin_all on public.operation_threads for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy operation_messages_read on public.operation_messages for select to authenticated using(public.is_admin() or exists(select 1 from public.operation_threads t where t.id=thread_id and t.worker_id=(select auth.uid())));
create policy operation_messages_insert on public.operation_messages for insert to authenticated with check(public.is_admin() or (sender_role='worker' and exists(select 1 from public.operation_threads t where t.id=thread_id and t.worker_id=(select auth.uid()))));

create policy worker_disbursements_read on public.worker_disbursements for select to authenticated using(worker_id=(select auth.uid()) or public.is_admin());
create policy worker_disbursements_insert_admin on public.worker_disbursements for insert to authenticated with check(public.is_admin());
create policy worker_disbursements_update on public.worker_disbursements for update to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy disbursement_proofs_all on public.disbursement_proofs for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy funding_events_read on public.funding_events for select to authenticated using(worker_id=(select auth.uid()) or public.is_admin());
create policy funding_events_admin_all on public.funding_events for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy commission_ledger_read on public.commission_ledger for select to authenticated using(worker_id=(select auth.uid()) or public.is_admin());
create policy commission_ledger_admin_all on public.commission_ledger for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy commission_payouts_all on public.commission_payouts for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());

create policy account_health_checks_all on public.account_health_checks for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy compliance_reviews_read on public.compliance_reviews for select to authenticated using(worker_id=(select auth.uid()) or public.is_admin());
create policy compliance_reviews_insert_admin on public.compliance_reviews for insert to authenticated with check(public.is_admin());
create policy notifications_all on public.notifications for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy admin_notifications_admin_all on public.admin_notifications for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy audit_events_read on public.audit_events for select to authenticated using(worker_id is null or worker_id=(select auth.uid()) or public.is_admin());
create policy audit_events_insert on public.audit_events for insert to authenticated with check(worker_id=(select auth.uid()) or public.is_admin());
create policy support_tickets_all on public.support_tickets for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy support_chat_threads_all on public.support_chat_threads for all to authenticated using(worker_id=(select auth.uid()) or public.is_admin()) with check(worker_id=(select auth.uid()) or public.is_admin());
create policy support_chat_messages_read on public.support_chat_messages for select to authenticated using(public.is_admin() or exists(select 1 from public.support_chat_threads t where t.id=thread_id and t.worker_id=(select auth.uid())));
create policy support_chat_messages_insert on public.support_chat_messages for insert to authenticated with check(public.is_admin() or (sender_role='worker' and exists(select 1 from public.support_chat_threads t where t.id=thread_id and t.worker_id=(select auth.uid()))));
create policy storage_objects_all on public.storage_objects for all to authenticated using(owner_id=(select auth.uid()) or public.is_admin()) with check(owner_id=(select auth.uid()) or public.is_admin());

create policy avatars_public_read on storage.objects for select to public using(bucket_id='avatars');
create policy avatars_owner_insert on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_owner_update on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy private_files_read on storage.objects for select to authenticated using(bucket_id in('kyc-documents','transaction-proofs','account-documents') and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));
create policy private_files_insert on storage.objects for insert to authenticated with check(bucket_id in('kyc-documents','transaction-proofs','account-documents') and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));
create policy private_files_update on storage.objects for update to authenticated using(bucket_id in('kyc-documents','transaction-proofs','account-documents') and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin())) with check(bucket_id in('kyc-documents','transaction-proofs','account-documents') and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));
