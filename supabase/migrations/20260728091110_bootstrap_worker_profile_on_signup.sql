create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_phone text;
  profile_country text;
begin
  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Worker'
  );

  profile_phone := coalesce(nullif(trim(new.raw_user_meta_data->>'phone'), ''), '');
  profile_country := coalesce(nullif(trim(new.raw_user_meta_data->>'country'), ''), '');

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

  insert into public.notification_preferences(worker_id)
  values(new.id)
  on conflict (worker_id) do nothing;

  insert into public.worker_security_settings(worker_id)
  values(new.id)
  on conflict (worker_id) do nothing;

  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();
