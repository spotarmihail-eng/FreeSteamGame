-- Reconcile the live profiles table with the profile editor and admin API.
-- Existing profile rows and role assignments are preserved.

alter table public.profiles
  add column if not exists username text,
  add column if not exists profile_slug text,
  add column if not exists profile_settings jsonb not null default '{}'::jsonb,
  add column if not exists invisible boolean not null default false,
  add column if not exists custom_status text not null default '',
  add column if not exists show_level boolean not null default true,
  add column if not exists show_experience boolean not null default true,
  add column if not exists show_exact_experience boolean not null default false,
  add column if not exists show_friends boolean not null default true,
  add column if not exists show_inventory boolean not null default false,
  add column if not exists show_comments boolean not null default true,
  add column if not exists comments_allowed text not null default 'everyone',
  add column if not exists last_seen_at timestamptz;

-- Backfill a unique username for existing profiles, without overwriting any set value.
update public.profiles p
set username =
  left(
    coalesce(
      nullif(regexp_replace(lower(coalesce(
        u.raw_user_meta_data ->> 'user_name',
        u.raw_user_meta_data ->> 'preferred_username',
        split_part(coalesce(u.email, ''), '@', 1),
        'player'
      )), '[^a-z0-9_-]', '', 'g'), ''),
      'player'
    ),
    23
  ) || '-' || left(replace(p.id::text, '-', ''), 8)
from auth.users u
where u.id = p.id and p.username is null;

update public.profiles
set username = 'player-' || left(replace(id::text, '-', ''), 8)
where username is null;

alter table public.profiles alter column username set not null;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (username);
create unique index if not exists profiles_profile_slug_unique_idx
  on public.profiles (profile_slug)
  where profile_slug is not null;

alter table public.profiles
  drop constraint if exists profiles_comments_allowed_check;
alter table public.profiles
  add constraint profiles_comments_allowed_check
  check (comments_allowed in ('everyone', 'friends', 'nobody'));

alter table public.profiles
  drop constraint if exists profiles_custom_status_length_check;
alter table public.profiles
  add constraint profiles_custom_status_length_check
  check (char_length(custom_status) <= 80);

-- A signed-in user may create or edit only their own profile row.
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- RLS cannot restrict individual columns. Prevent clients from assigning/changing
-- the legacy profile.role field; authoritative staff roles remain in user_roles.
create or replace function public.guard_profile_role_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'INSERT' and new.role::text <> 'user' then
      raise exception 'Profile role can only be assigned by trusted server code';
    end if;
    if tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'Profile role cannot be changed from the client';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_column on public.profiles;
create trigger guard_profile_role_column
before insert or update of role on public.profiles
for each row execute function public.guard_profile_role_column();

revoke all on function public.guard_profile_role_column() from public, anon, authenticated;

-- XP is deliberately not awarded by the profile editor; trusted workflows own it.
