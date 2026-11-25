# Free Steam Game

A community platform for discovering free games, profiles, friends and game-specific collectible cards.

> Free Steam Game is not affiliated with, endorsed by, or sponsored by Valve Corporation or Steam. All trademarks belong to their respective owners.

## Status

Initial static-export frontend foundation. Authentication, database policies, card drops, trading, badge crafting, Steam data integration and moderation are not implemented yet.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase (planned: Auth, PostgreSQL, Realtime, Edge Functions)
- Discord OAuth through Supabase Auth
- GitHub Pages and PWA

GitHub Pages hosts only the static frontend. Supabase is a separately hosted backend.

## Local setup

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## GitHub Pages

In repository Settings → Pages, select **GitHub Actions** as the deployment source. The workflow builds a static export and sets `NEXT_PUBLIC_BASE_PATH` to the repository name for project Pages URLs.

## Secrets

Only the public Supabase URL and publishable/anon key may be exposed to the browser. Never put a Supabase service-role/secret key, Discord client secret or Steam Web API key in a `NEXT_PUBLIC_*` variable or commit them to Git.

## Product rules recorded

- Own Free Steam Game cards and official Steam Trading Cards are separate collections.
- Each game has its own card set; cards from different games can never be combined.
- Own card drops are random, with a planned cap of 2–3 cards per eligible game session. Session verification/integration is required before enabling drops.
- Players may trade owned cards with mutual confirmation.
- Crafting consumes the complete set permanently.
- Each own game badge has five levels. Every level requires a fresh complete set for that same game.
- Official Steam Trading Cards remain controlled by Steam; this app cannot cause official drops or craft official Steam badges.
- Purchase/achievement XP is granted only when a trustworthy source verifies the event.

These are requirements, not implemented features.

## Legal and safety

Use permitted official Steam interfaces. Do not imitate Steam login, collect Steam passwords, distribute Steam keys, bypass Steam rules, or claim to launch arbitrary games in a browser.
