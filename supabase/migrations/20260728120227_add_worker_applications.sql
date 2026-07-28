-- Migration: add_worker_applications
-- Creates the worker_applications table and extends handle_new_user()
-- to seed a pending application row from signup user_metadata.

-- ─── 1. Enum ────────────────────────────────────────────────────────────────
do $$ begin
  create type public.worker_application_status as enum (
    'pending', 'in_review', 'approved', 'rejected'
  );
exception when duplicate_object then null;
end $$;

-- ─── 2. Table ────────────────────────────────────────────────────────────────
create table if not exists public.worker_applications (
  id            uuid        primary key default gen_random_uuid(),
  worker_id     uuid        references public.worker_profiles(id) on delete set null,
  full_name     text        not null,
  email         text        not null,
  phone         text        not null default '',
  country       text        not null default '',
  city          text        not null default '',
  occupation    text        not null default '',
  why           text        not null default '',
  bank          text        not null default '',
  methods       text[]      not null default '{}',
  status        public.worker_application_status not null default 'pending',
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid        references auth.users(id),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── 3. Indexes ──────────────────────────────────────────────────────────────
create unique index if not exists worker_applications_worker_idx
  on public.worker_applications(worker_id)
  where worker_id is not null;

create unique index if not exists worker_applications_email_idx
  on public.worker_applications(lower(email));

create index if not exists worker_applications_status_idx
  on public.worker_applications(status, submitted_at desc);

-- ─── 4. Updated-at trigger ───────────────────────────────────────────────────
drop trigger if exists worker_applications_updated on public.worker_applications;
create trigger worker_applications_updated
  before update on public.worker_applications
  for each row execute function app_private.set_updated_at();

-- ─── 5. RLS ──────────────────────────────────────────────────────────────────
alter table public.worker_applications enable row level security;
alter table public.worker_applications force row level security;

grant select, insert, update on public.worker_applications to authenticated;

drop policy if exists worker_applications_read           on public.worker_applications;
drop policy if exists worker_applications_worker_insert  on public.worker_applications;
drop policy if exists worker_applications_admin_update   on public.worker_applications;

create policy worker_applications_read
  on public.worker_applications
  for select
  to authenticated
  using(worker_id = (select auth.uid()) or public.is_admin());

create policy worker_applications_worker_insert
  on public.worker_applications
  for insert
  to authenticated
  with check(worker_id = (select auth.uid()));

create policy worker_applications_admin_update
  on public.worker_applications
  for update
  to authenticated
  using(public.is_admin())
  with check(public.is_admin());

-- ─── 6. Extend handle_new_user() to seed worker_applications ─────────────────
-- We replace the whole function so it is idempotent across re-runs.
create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name    text;
  profile_phone   text;
  profile_country text;
  app_city        text;
  app_occ         text;
  app_why         text;
  app_bank        text;
  app_methods     text[];
  app_notes       text;
begin
  -- Resolve profile fields from user_metadata
  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Worker'
  );
  profile_phone   := coalesce(nullif(trim(new.raw_user_meta_data->>'phone'),   ''), '');
  profile_country := coalesce(nullif(trim(new.raw_user_meta_data->>'country'), ''), '');

  -- Upsert worker_profiles
  insert into public.worker_profiles(id, full_name, phone, country)
  values(new.id, profile_name, profile_phone, profile_country)
  on conflict (id) do update
    set full_name = case
          when public.worker_profiles.full_name is null
            or trim(public.worker_profiles.full_name) = ''
            or lower(trim(public.worker_profiles.full_name)) = 'new worker'
          then excluded.full_name
          else public.worker_profiles.full_name
        end,
        phone = case
          when public.worker_profiles.phone is null or trim(public.worker_profiles.phone) = ''
          then excluded.phone
          else public.worker_profiles.phone
        end,
        country = case
          when public.worker_profiles.country is null or trim(public.worker_profiles.country) = ''
          then excluded.country
          else public.worker_profiles.country
        end;

  -- Upsert notification_preferences and security settings
  insert into public.notification_preferences(worker_id)
  values(new.id)
  on conflict (worker_id) do nothing;

  insert into public.worker_security_settings(worker_id)
  values(new.id)
  on conflict (worker_id) do nothing;

  -- Seed worker_applications from signup metadata (if application fields present)
  app_city    := coalesce(nullif(trim(new.raw_user_meta_data->>'city'),       ''), '');
  app_occ     := coalesce(nullif(trim(new.raw_user_meta_data->>'occupation'), ''), '');
  app_why     := coalesce(nullif(trim(new.raw_user_meta_data->>'why'),        ''), '');
  app_bank    := coalesce(nullif(trim(new.raw_user_meta_data->>'bank'),       ''), '');
  app_notes   := new.raw_user_meta_data->>'app_notes';

  -- Parse the JSON methods array into a text[]
  begin
    select array_agg(elem)
    into   app_methods
    from   jsonb_array_elements_text(new.raw_user_meta_data->'methods') as elem;
  exception when others then
    app_methods := '{}';
  end;
  app_methods := coalesce(app_methods, '{}');

  -- Only insert if at least one application field was provided
  if app_city <> '' or app_occ <> '' or app_why <> '' or app_bank <> '' then
    insert into public.worker_applications(
      worker_id, full_name, email, phone, country,
      city, occupation, why, bank, methods, notes
    )
    values(
      new.id, profile_name, coalesce(new.email, ''), profile_phone, profile_country,
      app_city, app_occ, app_why, app_bank, app_methods, app_notes
    )
    on conflict (worker_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();
