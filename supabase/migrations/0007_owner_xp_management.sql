-- Protect profile XP from direct client edits and provide owner-only XP controls.
-- XP changes are recorded for audit and can target any profile, including the owner.

create table if not exists public.fsg_xp_audit_log (
  id bigint generated always as identity primary key,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  old_experience bigint not null,
  new_experience bigint not null,
  change_type text not null check (change_type in ('grant_xp', 'grant_levels')),
  created_at timestamptz not null default now()
);

alter table public.fsg_xp_audit_log enable row level security;
revoke all on public.fsg_xp_audit_log from public, anon, authenticated;

create or replace function public.guard_profile_experience_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'INSERT' and coalesce(new.experience, 0) <> 0 then
      raise exception 'Experience can only be assigned by trusted server code';
    end if;
    if tg_op = 'UPDATE' and new.experience is distinct from old.experience then
      raise exception 'Experience cannot be changed directly by the client';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_experience_column on public.profiles;
create trigger guard_profile_experience_column
before insert or update of experience on public.profiles
for each row execute function public.guard_profile_experience_column();

revoke all on function public.guard_profile_experience_column() from public, anon, authenticated;

-- Only the verified project owner may grant XP or whole levels to any user.
-- Level progression matches the FSG profile formula: 100 XP per level,
-- with the requirement increasing by 100 XP after every 10 levels.
create or replace function public.grant_fsg_user_xp(
  target_user_id uuid,
  xp_amount bigint default null,
  level_count integer default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
  old_xp bigint;
  new_xp bigint;
  remaining_xp bigint;
  step_xp bigint;
  level_number integer;
  i integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  caller_role := public.get_my_fsg_role();
  if caller_role <> 'owner' then
    raise exception 'Only the project owner can manage user experience';
  end if;

  if (xp_amount is null) = (level_count is null) then
    raise exception 'Specify either XP amount or level count';
  end if;

  if xp_amount is not null and (xp_amount < 1 or xp_amount > 1000000000) then
    raise exception 'XP amount must be between 1 and 1000000000';
  end if;

  if level_count is not null and (level_count < 1 or level_count > 100) then
    raise exception 'Level count must be between 1 and 100';
  end if;

  select coalesce(p.experience, 0)
    into old_xp
    from public.profiles p
    where p.id = target_user_id
    for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if xp_amount is not null then
    new_xp := old_xp + xp_amount;
    insert into public.fsg_xp_audit_log(target_user_id, changed_by, old_experience, new_experience, change_type)
    values (target_user_id, auth.uid(), old_xp, new_xp, 'grant_xp');
  else
    new_xp := old_xp;
    for i in 1..level_count loop
      remaining_xp := new_xp;
      level_number := 0;
      step_xp := 100;

      while remaining_xp >= step_xp loop
        remaining_xp := remaining_xp - step_xp;
        level_number := level_number + 1;
        if level_number % 10 = 0 then
          step_xp := step_xp + 100;
        end if;
      end loop;

      new_xp := new_xp + (step_xp - remaining_xp);
    end loop;

    insert into public.fsg_xp_audit_log(target_user_id, changed_by, old_experience, new_experience, change_type)
    values (target_user_id, auth.uid(), old_xp, new_xp, 'grant_levels');
  end if;

  update public.profiles
    set experience = new_xp,
        updated_at = now()
    where id = target_user_id;

  return new_xp;
end;
$$;

revoke all on function public.grant_fsg_user_xp(uuid, bigint, integer) from public, anon;
grant execute on function public.grant_fsg_user_xp(uuid, bigint, integer) to authenticated;
