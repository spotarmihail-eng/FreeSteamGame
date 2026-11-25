-- FSG profile foundation: customization, privacy, showcase configuration and comments.
alter table public.profiles
  add column if not exists profile_slug text unique,
  add column if not exists profile_settings jsonb not null default '{}'::jsonb,
  add column if not exists invisible boolean not null default false,
  add column if not exists custom_status text not null default '' check (char_length(custom_status) <= 80),
  add column if not exists show_level boolean not null default true,
  add column if not exists show_experience boolean not null default true,
  add column if not exists show_exact_experience boolean not null default false,
  add column if not exists show_friends boolean not null default true,
  add column if not exists show_inventory boolean not null default false,
  add column if not exists show_comments boolean not null default true,
  add column if not exists comments_allowed text not null default 'everyone' check (comments_allowed in ('everyone','friends','nobody')),
  add column if not exists last_seen_at timestamptz;

create table if not exists public.profile_comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.profile_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_comments enable row level security;

drop policy if exists "Profiles are visible when public or self" on public.profiles;
create policy "Profiles are visible when public or self" on public.profiles
  for select to anon, authenticated using (profile_public = true or id = auth.uid());

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Visible profile comments are readable" on public.profile_comments;
create policy "Visible profile comments are readable" on public.profile_comments
  for select to anon, authenticated using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.profile_public = true and p.show_comments = true)
    or profile_id = auth.uid()
  );

drop policy if exists "Signed-in users add profile comments" on public.profile_comments;
create policy "Signed-in users add profile comments" on public.profile_comments
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = profile_id and p.profile_public = true and p.show_comments = true
        and p.comments_allowed = 'everyone'
    )
  );

drop policy if exists "Authors or profile owners delete comments" on public.profile_comments;
create policy "Authors or profile owners delete comments" on public.profile_comments
  for delete to authenticated using (author_id = auth.uid() or profile_id = auth.uid());

create index if not exists profile_comments_profile_created_idx
  on public.profile_comments (profile_id, created_at desc);

-- XP remains server-authoritative: only the trusted badge-crafting workflow may award it.
