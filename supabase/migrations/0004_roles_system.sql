-- FSG role system. Roles are stored separately from user-editable profile metadata.
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','moderator','admin','owner')),
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now()
);

create table if not exists public.role_audit_log (
  id bigint generated always as identity primary key,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  old_role text check (old_role in ('user','moderator','admin','owner')),
  new_role text not null check (new_role in ('user','moderator','admin','owner')),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
alter table public.role_audit_log enable row level security;

-- Users can read their own role. Owners/admins can read the role directory.
drop policy if exists "Read own role or roles as staff" on public.user_roles;
create policy "Read own role" on public.user_roles
for select to authenticated using (user_id = auth.uid());

-- Audit history is visible only to the owner.
drop policy if exists "Owner reads role audit" on public.role_audit_log;
create policy "Owner reads role audit" on public.role_audit_log
for select to authenticated using (
  exists (select 1 from public.user_roles me where me.user_id = auth.uid() and me.role = 'owner')
);

-- Resolve the Discord account ID from the authenticated identity, not editable user metadata.
create or replace function public.is_fsg_owner_identity()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.identities i
    where i.user_id = auth.uid()
      and i.provider = 'discord'
      and i.provider_id = '1241276773711482961'
  );
$$;

-- Bootstrap the owner role on sign-in / explicit RPC call, based on the verified Discord identity.
create or replace function public.sync_fsg_owner_role()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_fsg_owner_identity() then
    return coalesce((select role from public.user_roles where user_id = auth.uid()), 'user');
  end if;

  insert into public.user_roles(user_id, role, assigned_by)
  values (auth.uid(), 'owner', auth.uid())
  on conflict (user_id) do update
    set role = 'owner', assigned_by = auth.uid(), assigned_at = now()
    where public.user_roles.role <> 'owner';

  return 'owner';
end;
$$;

create or replace function public.get_my_fsg_role()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare result text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if public.is_fsg_owner_identity() then
    perform public.sync_fsg_owner_role();
  end if;
  select role into result from public.user_roles where user_id = auth.uid();
  return coalesce(result, 'user');
end;
$$;

-- Only the owner can grant/revoke staff roles. The owner account itself cannot be demoted through this RPC.
create or replace function public.set_fsg_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare old_role text;
begin
  if auth.uid() is null or public.get_my_fsg_role() <> 'owner' then
    raise exception 'Only the project owner can change roles';
  end if;
  if new_role not in ('user','moderator','admin') then
    raise exception 'Invalid role';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'The owner role cannot be changed here';
  end if;

  select role into old_role from public.user_roles where user_id = target_user_id;
  insert into public.user_roles(user_id, role, assigned_by)
  values (target_user_id, new_role, auth.uid())
  on conflict (user_id) do update
    set role = excluded.role, assigned_by = auth.uid(), assigned_at = now();

  insert into public.role_audit_log(target_user_id, old_role, new_role, changed_by)
  values (target_user_id, old_role, new_role, auth.uid());
end;
$$;

revoke all on function public.is_fsg_owner_identity() from public;
revoke all on function public.sync_fsg_owner_role() from public;
revoke all on function public.get_my_fsg_role() from public;
revoke all on function public.set_fsg_user_role(uuid, text) from public;
grant execute on function public.get_my_fsg_role() to authenticated;
grant execute on function public.set_fsg_user_role(uuid, text) to authenticated;
