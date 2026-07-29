-- Fix permissions for admins updating worker profiles
grant update on public.worker_profiles to authenticated;

create or replace function public.protect_worker_profile_fields() returns trigger as $$
begin
  if not public.is_admin() then
    if new.badge is distinct from old.badge then
      raise exception 'Permission denied: cannot update badge';
    end if;
    if new.total_gigs_completed is distinct from old.total_gigs_completed then
      raise exception 'Permission denied: cannot update total_gigs_completed';
    end if;
    if new.total_disbursed is distinct from old.total_disbursed then
      raise exception 'Permission denied: cannot update total_disbursed';
    end if;
    if new.total_earned is distinct from old.total_earned then
      raise exception 'Permission denied: cannot update total_earned';
    end if;
    if new.rating is distinct from old.rating then
      raise exception 'Permission denied: cannot update rating';
    end if;
    if new.account_health is distinct from old.account_health then
      raise exception 'Permission denied: cannot update account_health';
    end if;
    if new.kyc_status is distinct from old.kyc_status then
      raise exception 'Permission denied: cannot update kyc_status';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_worker_profile_fields_trigger on public.worker_profiles;
create trigger protect_worker_profile_fields_trigger
before update on public.worker_profiles
for each row execute function public.protect_worker_profile_fields();
