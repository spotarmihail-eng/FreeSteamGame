-- Small original seed catalog. These are examples, not a live Steam feed.
insert into public.games (slug, title, description, steam_app_id, steam_store_url, is_free_to_play, tags)
values
  ('dota-2', 'Dota 2', 'A competitive multiplayer action strategy game.', 570, 'https://store.steampowered.com/app/570/', true, array['MOBA','Multiplayer']),
  ('team-fortress-2', 'Team Fortress 2', 'A team-based multiplayer shooter.', 440, 'https://store.steampowered.com/app/440/', true, array['Shooter','Multiplayer']),
  ('warframe', 'Warframe', 'A cooperative online action game.', 230410, 'https://store.steampowered.com/app/230410/', true, array['Action','Co-op'])
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  steam_app_id = excluded.steam_app_id,
  steam_store_url = excluded.steam_store_url,
  is_free_to_play = excluded.is_free_to_play,
  tags = excluded.tags,
  updated_at = now();
