-- FSG 0008: create a public profile for every new Auth user and backfill existing users.
-- Profile creation is performed by a trusted trigger, never by a client-supplied user ID.

create or replace function public.handle_new_fsg_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_username text;
  safe_username text;
  raw_display_name text;
  raw_avatar_url text;
begin
  raw_username := coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'global_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, ''), '@', 1),
    'player'
  );

  safe_username := left(
    coalesce(nullif(regexp_replace(lower(raw_username), '[^a-z0-9_-]', '', 'g'), ''), 'player'),
    22
  ) || '-' || left(replace(new.id::text, '-', ''), 8);

  raw_display_name := left(coalesce(
    new.raw_user_meta_data ->> 'global_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    raw_username,
    'Игрок'
  ), 48);

  raw_avatar_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, safe_username, raw_display_name, raw_avatar_url)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_fsg_profile on auth.users;
create trigger on_auth_user_created_fsg_profile
after insert on auth.users
for each row execute function public.handle_new_fsg_auth_user();

revoke all on function public.handle_new_fsg_auth_user() from public, anon, authenticated;

-- Backfill Auth users that were created before the trigger existed.
insert into public.profiles (id, username, display_name, avatar_url)
select
  u.id,
  left(
    coalesce(
      nullif(regexp_replace(lower(coalesce(
        u.raw_user_meta_data ->> 'user_name',
        u.raw_user_meta_data ->> 'preferred_username',
        u.raw_user_meta_data ->> 'username',
        u.raw_user_meta_data ->> 'global_name',
        u.raw_user_meta_data ->> 'name',
        split_part(coalesce(u.email, ''), '@', 1),
        'player'
      )), '[^a-z0-9_-]', '', 'g'), ''),
      'player'
    ),
    22
  ) || '-' || left(replace(u.id::text, '-', ''), 8),
  left(coalesce(
    u.raw_user_meta_data ->> 'global_name',
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'user_name',
    u.raw_user_meta_data ->> 'preferred_username',
    'Игрок'
  ), 48),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (id) do nothing;
