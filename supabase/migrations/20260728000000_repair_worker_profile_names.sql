create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.worker_profiles(id, full_name, phone, country)
  values(
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(nullif(trim(new.raw_user_meta_data->>'phone'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data->>'country'), ''), '')
  )
  on conflict (id) do update
    set full_name = case
          when worker_profiles.full_name is null
            or trim(worker_profiles.full_name) = ''
            or lower(trim(worker_profiles.full_name)) = 'new worker'
          then excluded.full_name
          else worker_profiles.full_name
        end,
        phone = case
          when worker_profiles.phone is null or trim(worker_profiles.phone) = ''
          then excluded.phone
          else worker_profiles.phone
        end,
        country = case
          when worker_profiles.country is null or trim(worker_profiles.country) = ''
          then excluded.country
          else worker_profiles.country
        end;

  return new;
end;
$$;

update public.worker_profiles profile
set full_name = coalesce(
    nullif(trim(users.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(users.raw_user_meta_data->>'name'), ''),
    split_part(users.email, '@', 1)
  ),
  phone = case
    when profile.phone is null or trim(profile.phone) = ''
    then coalesce(nullif(trim(users.raw_user_meta_data->>'phone'), ''), profile.phone)
    else profile.phone
  end,
  country = case
    when profile.country is null or trim(profile.country) = ''
    then coalesce(nullif(trim(users.raw_user_meta_data->>'country'), ''), profile.country)
    else profile.country
  end
from auth.users users
where profile.id = users.id
  and (profile.full_name is null or trim(profile.full_name) = '' or lower(trim(profile.full_name)) = 'new worker');
