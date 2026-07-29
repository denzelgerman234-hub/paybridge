-- Fix signup 500 caused by handle_new_user() using an invalid conflict target.
-- worker_applications.worker_id is protected by a partial unique index, so the
-- trigger must include the matching WHERE clause in ON CONFLICT.

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
  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Worker'
  );
  profile_phone   := coalesce(nullif(trim(new.raw_user_meta_data->>'phone'),   ''), '');
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

  app_city    := coalesce(nullif(trim(new.raw_user_meta_data->>'city'),       ''), '');
  app_occ     := coalesce(nullif(trim(new.raw_user_meta_data->>'occupation'), ''), '');
  app_why     := coalesce(nullif(trim(new.raw_user_meta_data->>'why'),        ''), '');
  app_bank    := coalesce(nullif(trim(new.raw_user_meta_data->>'bank'),       ''), '');
  app_notes   := new.raw_user_meta_data->>'app_notes';

  begin
    select array_agg(elem)
    into   app_methods
    from   jsonb_array_elements_text(new.raw_user_meta_data->'methods') as elem;
  exception when others then
    app_methods := '{}';
  end;
  app_methods := coalesce(app_methods, '{}');

  if app_city <> '' or app_occ <> '' or app_why <> '' or app_bank <> '' then
    insert into public.worker_applications(
      worker_id, full_name, email, phone, country,
      city, occupation, why, bank, methods, notes
    )
    values(
      new.id, profile_name, coalesce(new.email, ''), profile_phone, profile_country,
      app_city, app_occ, app_why, app_bank, app_methods, app_notes
    )
    on conflict (worker_id) where worker_id is not null do nothing;
  end if;

  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public, anon, authenticated;