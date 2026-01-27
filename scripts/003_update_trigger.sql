-- Update trigger function to handle username conflicts
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  -- Get username from metadata or generate a unique one
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'player_' || substr(md5(new.id::text || now()::text), 1, 10)
  );
  
  insert into public.profiles (id, username, age, skill_level, avatar_url)
  values (
    new.id,
    v_username,
    coalesce((new.raw_user_meta_data ->> 'age')::integer, null),
    coalesce(nullif(new.raw_user_meta_data ->> 'skill_level', ''), 'iniciante'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
exception when unique_violation then
  -- If username already exists, add random suffix
  insert into public.profiles (id, username, age, skill_level, avatar_url)
  values (
    new.id,
    v_username || '_' || substr(md5(random()::text), 1, 4),
    coalesce((new.raw_user_meta_data ->> 'age')::integer, null),
    coalesce(nullif(new.raw_user_meta_data ->> 'skill_level', ''), 'iniciante'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
