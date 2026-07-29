create table public.gig_beneficiaries (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.worker_gigs(id) on delete cascade,
  recipient_name text not null,
  amount numeric(12,2) not null check(amount > 0),
  method text not null,
  destination text not null,
  created_at timestamptz not null default now()
);

create index gig_beneficiaries_gig_idx on public.gig_beneficiaries(gig_id);

alter table public.gig_beneficiaries enable row level security;
alter table public.gig_beneficiaries force row level security;

grant select, insert, update, delete on public.gig_beneficiaries to authenticated;

create policy gig_beneficiaries_admin_read
  on public.gig_beneficiaries
  for select
  to authenticated
  using(public.is_admin());

create policy gig_beneficiaries_admin_insert
  on public.gig_beneficiaries
  for insert
  to authenticated
  with check(public.is_admin());

create policy gig_beneficiaries_admin_update
  on public.gig_beneficiaries
  for update
  to authenticated
  using(public.is_admin())
  with check(public.is_admin());

create policy gig_beneficiaries_admin_delete
  on public.gig_beneficiaries
  for delete
  to authenticated
  using(public.is_admin());
