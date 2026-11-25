-- Free Steam Game: foundational schema.
-- Sensitive mutations (drops, trades, badge crafting, invites, roles) are intentionally
-- reserved for trusted server-side Edge Functions. Never expose service-role credentials.

create extension if not exists pgcrypto;

do $ begin create type public.app_role as enum ('user', 'moderator', 'admin', 'owner'); exception when duplicate_object then null; end $;
do $ begin create type public.presence_status as enum ('offline', 'online', 'in_game'); exception when duplicate_object then null; end $;
do $ begin create type public.friend_request_status as enum ('pending', 'accepted', 'declined', 'cancelled'); exception when duplicate_object then null; end $;
do $ begin create type public.library_status as enum ('owned', 'playing', 'completed', 'wishlist'); exception when duplicate_object then null; end $;
do $ begin create type public.promotion_status as enum ('upcoming', 'active', 'ended'); exception when duplicate_object then null; end $;
do $ begin create type public.notification_type as enum ('friend_request', 'friend_accepted', 'trade_offer', 'trade_update', 'game_invite', 'system'); exception when duplicate_object then null; end $;
do $ begin create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed'); exception when duplicate_object then null; end $;
do $ begin create type public.trade_status as enum ('pending', 'accepted', 'declined', 'cancelled', 'expired'); exception when duplicate_object then null; end $;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 32),
  display_name text check (display_name is null or char_length(display_name) <= 48),
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 500),
  steam_id text unique check (steam_id is null or steam_id ~ '^[0-9]{17}$'),
  role public.app_role not null default 'user',
  profile_public boolean not null default true,
  show_presence boolean not null default true,
  show_games boolean not null default true,
  allow_join boolean not null default false,
  allow_friend_requests boolean not null default true,
  experience bigint not null default 0 check (experience >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  steam_app_id bigint unique check (steam_app_id is null or steam_app_id > 0),
  steam_store_url text,
  cover_url text,
  is_free_to_play boolean not null default false,
  is_active boolean not null default true,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete set null,
  title text not null,
  description text not null default '',
  source_name text not null,
  source_url text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.promotion_status not null default 'active',
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table public.library_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  status public.library_status not null default 'owned',
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status public.friend_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);
create unique index friend_requests_one_pending_pair
  on public.friend_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status = 'pending';

create table public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status public.presence_status not null default 'offline',
  current_game_id uuid references public.games(id) on delete set null,
  joinable boolean not null default false,
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 minutes')
);

-- Only a hash of the invitation token is stored. Token creation/consumption is server-side.
create table public.game_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  join_target text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null default '',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('profile', 'message', 'trade', 'invite')),
  target_id uuid,
  reason text not null check (char_length(reason) between 5 and 2000),
  status public.report_status not null default 'open',
  moderator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> receiver_id)
);

-- Free Steam Game's collectible cards are deliberately separate from official Steam cards.
create table public.card_definitions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  slug text not null,
  name text not null,
  image_url text,
  rarity text not null default 'common' check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  drop_weight integer not null default 100 check (drop_weight > 0),
  created_at timestamptz not null default now(),
  unique (game_id, slug),
  unique (game_id, id)
);

create table public.user_cards (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  card_id uuid not null,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id),
  foreign key (game_id, card_id) references public.card_definitions(game_id, id) on delete cascade
);

create table public.card_trades (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  status public.trade_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '48 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create table public.card_trade_items (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.card_trades(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid not null references public.card_definitions(id) on delete restrict,
  quantity integer not null check (quantity > 0)
);

create table public.game_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  level integer not null default 0 check (level between 0 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- Every badge level consumes a fresh complete set for that one game.
create table public.badge_crafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  level_created integer not null check (level_created between 1 and 5),
  cards_consumed jsonb not null,
  created_at timestamptz not null default now()
);

create index promotions_ends_at_idx on public.promotions (ends_at);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index chat_messages_conversation_idx on public.chat_messages (sender_id, receiver_id, created_at desc);
create index card_trades_participants_idx on public.card_trades (sender_id, receiver_id, created_at desc);
create index presence_expiry_idx on public.presence (expires_at);

-- Enable RLS everywhere. Sensitive writes intentionally have no client policies yet.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','games','promotions','favorites','library_items','friend_requests',
    'friendships','blocks','presence','game_invites','notifications','reports',
    'audit_logs','chat_messages','card_definitions','user_cards','card_trades',
    'card_trade_items','game_badges','badge_crafts'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "Public games are readable" on public.games
  for select to anon, authenticated using (is_active = true);
create policy "Active promotions are readable" on public.promotions
  for select to anon, authenticated using (status = 'active' or status = 'upcoming');

create policy "Profiles are visible when public or self" on public.profiles
  for select to authenticated using (profile_public = true or id = auth.uid());
create policy "Users read own favorites" on public.favorites
  for select to authenticated using (user_id = auth.uid());
create policy "Users read own library" on public.library_items
  for select to authenticated using (user_id = auth.uid());
create policy "Users read own requests" on public.friend_requests
  for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "Users read own friendships" on public.friendships
  for select to authenticated using (user_id = auth.uid() or friend_id = auth.uid());
create policy "Users manage own blocks" on public.blocks
  for select to authenticated using (blocker_id = auth.uid());
create policy "Users read own presence" on public.presence
  for select to authenticated using (user_id = auth.uid());
create policy "Users read own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "Users read own card inventory" on public.user_cards
  for select to authenticated using (user_id = auth.uid());
create policy "Users read own badges" on public.game_badges
  for select to authenticated using (user_id = auth.uid());
create policy "Users read own crafts" on public.badge_crafts
  for select to authenticated using (user_id = auth.uid());
create policy "Trade participants read trades" on public.card_trades
  for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "Trade participants read trade items" on public.card_trade_items
  for select to authenticated using (
    exists (
      select 1 from public.card_trades tr
      where tr.id = trade_id and (tr.sender_id = auth.uid() or tr.receiver_id = auth.uid())
    )
  );
create policy "Chat participants read messages" on public.chat_messages
  for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "Users read reports they submitted" on public.reports
  for select to authenticated using (reporter_id = auth.uid());

-- No public/anon read access to presence, invites, chat, audit logs, or private inventory.
