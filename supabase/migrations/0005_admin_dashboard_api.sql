-- Admin dashboard read API. User data is returned only to authenticated staff.
create or replace function public.get_fsg_admin_users()
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  role text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare caller_role text;
begin
  caller_role := public.get_my_fsg_role();
  if caller_role not in ('admin','owner','moderator') then
    raise exception 'Staff access required';
  end if;

  return query
    select p.id, p.username, p.display_name, p.avatar_url,
           coalesce(r.role, 'user')::text, p.created_at
    from public.profiles p
    left join public.user_roles r on r.user_id = p.id
    order by p.created_at desc
    limit 200;
end;
$$;

revoke all on function public.get_fsg_admin_users() from public;
grant execute on function public.get_fsg_admin_users() to authenticated;
