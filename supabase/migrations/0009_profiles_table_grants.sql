-- FSG 0009: grant SQL privileges required for the profile API.
-- Row-level security policies continue to decide which rows each role can access.
grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;
