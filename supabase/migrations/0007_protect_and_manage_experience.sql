-- FSG 0007: protect profile XP and expose owner-only XP controls.
-- The admin UI calls grant_fsg_user_xp(target_user_id, xp_amount, level_count).

create table if not exists public.experience_audit_log (
  id bigint generated always as identity primary key,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null check (amount > 0),
  old_experience bigint not null,
  new_experience bigint not null,
  reason text not null check (reason in ('owner_manual_add', 'owner_level_up')),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

alter table public.experience_audit_log enable row level security;

drop policy if exists "Owner reads experience audit" on public.experience_audit_log;
create policy "Owner reads experience audit"
on public.experience_audit_log
for select to authenticated
using (public.get_my_fsg_role() = 'owner');

grant select on public.experience_audit_log to authenticated;

-- RLS limits rows, not individual columns, so enforce XP integrity in the database.
create or replace function public.guard_profile_experience()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'INSERT' and new.experience <> 0 then
      raise exception 'Experience can only be assigned by trusted server code';
    end if;

    if tg_op = 'UPDATE' and new.experience is distinct from old.experience then
      raise exception 'Experience can only be changed by the project owner';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_experience on public.profiles;
create trigger guard_profile_experience
before insert or update of experience on public.profiles
for each row execute function public.guard_profile_experience();

revoke all on function public.guard_profile_experience() from public, anon, authenticated;

-- One RPC serves both owner controls already present in src/app/admin/page.tsx.
-- Exactly one of xp_amount or level_count must be provided.
create or replace function public.grant_fsg_user_xp(
  target_user_id uuid,
  xp_amount bigint,
  level_count integer
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_xp bigint;
  new_xp bigint;
  amount_to_add bigint;
  remaining bigint;
  step_size bigint := 100;
  current_level bigint := 0;
begin
  if auth.uid() is null or public.get_my_fsg_role() <> 'owner' then
    raise exception 'Only the project owner can manage experience';
  end if;

  if (xp_amount is null and level_count is null)
     or (xp_amount is not null and level_count is not null) then
    raise exception 'Provide either xp_amount or level_count';
  end if;

  if xp_amount is not null then
    if xp_amount < 1 or xp_amount > 1000000000 then
      raise exception 'XP amount must be between 1 and 1,000,000,000';
    end if;
    amount_to_add := xp_amount;
  else
    if level_count < 1 or level_count > 100 then
      raise exception 'Level count must be between 1 and 100';
    end if;

    select experience into old_xp
    from public.profiles
    where id = target_user_id
    for update;

    if not found then
      raise exception 'Profile not found';
    end if;

    remaining := old_xp;

    while remaining >= step_size loop
      remaining := remaining - step_size;
      current_level := current_level + 1;
      if mod(current_level, 10) = 0 then
        step_size := step_size + 100;
      end if;
    end loop;

    amount_to_add := step_size - remaining;

    for i in 2..level_count loop
      current_level := current_level + 1;
      if mod(current_level, 10) = 0 then
        step_size := step_size + 100;
      end if;
      amount_to_add := amount_to_add + step_size;
    end loop;
  end if;

  if old_xp is null then
    select experience into old_xp
    from public.profiles
    where id = target_user_id
    for update;
  end if;

  if not found then
    raise exception 'Profile not found';
  end if;

  if old_xp > 9000000000000000000 - amount_to_add then
    raise exception 'XP amount is too large';
  end if;

  new_xp := old_xp + amount_to_add;

  update public.profiles
  set experience = new_xp
  where id = target_user_id;

  insert into public.experience_audit_log
    (target_user_id, amount, old_experience, new_experience, reason, changed_by)
  values
    (target_user_id, amount_to_add, old_xp, new_xp,
     case when xp_amount is not null then 'owner_manual_add' else 'owner_level_up' end,
     auth.uid());

  return new_xp;
end;
$$;

revoke all on function public.grant_fsg_user_xp(uuid, bigint, integer) from public, anon;
grant execute on function public.grant_fsg_user_xp(uuid, bigint, integer) to authenticated;
