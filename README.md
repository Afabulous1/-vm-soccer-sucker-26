# VM Soccer Sucker 26 ⚽

> Swedish-language World Cup 2026 betting app for friend groups — for glory and bragging rights.

Friends compete by predicting WC 2026 match results, tournament outcomes, and chaotic wildcards. No money, no ads — just ära och heder.

---

## Features

| Area | What you get |
|------|-------------|
| **Auth** | Username + password sign-up (no email required). Supabase admin API — users never see a confirmation email. |
| **Tournament bets** | 6 predictions (winner, finalists, top scorer, death group…). 1 000–5 000 p. Lock June 11. |
| **Match bets** | Per-match: 1/X/2, exact score, first scorer, yellow cards. 5–50 p. Lock at kickoff. |
| **Chaos bets** | 6 wild predictions (goalkeeper scores, Sweden to the final…). 10 000 p each. Lock June 11. |
| **Power-ups** | 5 special abilities (Double-or-Nothing, Tactician, +6-Pointer, Insurance, Time Machine). Match bets only. |
| **Live data** | Auto-synced from football-data.org twice daily via GitHub Actions (June 10 – July 19). |
| **Dashboard** | Real-time leaderboard (Total / Week / Streak tabs), recent results, upcoming matches. |
| **Spelarbänken** | Live group chat wall (Supabase Realtime, updates without page reload). |
| **Music** | Stadium crowd atmosphere (Web Audio API) + optional YouTube playlist. |
| **Onboarding** | 7-step feature guide for first-time users. |
| **Countdowns** | Big flip-clock to June 1 opening, tournament lock countdown, per-match kickoff badges. |

---

## Tech Stack

```
Frontend    Next.js 14 (App Router) + TypeScript + Tailwind CSS
Auth / DB   Supabase (auth, Postgres, Realtime, RLS)
Deploy      Vercel (auto-deploy from main branch)
Data sync   football-data.org free API → GitHub Actions cron
```

---

## Can the GitHub Repository Be Private?

**Yes — keep it private.** All services work with private repos:

| Service | Private repo |
|---------|-------------|
| **GitHub Actions** | Free tier: 2 000 min/month. This workflow uses ~120 min/month (2 runs/day × ~1 min). |
| **Vercel Hobby** | Deploys from private GitHub repos at no cost. |
| **Supabase** | No connection to GitHub visibility. |

To make it private: GitHub repo → Settings → Danger Zone → Change visibility → Private.

---

## Prerequisites — three free accounts

1. **Supabase** → [supabase.com](https://supabase.com) (free: 1 project, 500 MB DB)
2. **football-data.org** → [football-data.org/client/register](https://www.football-data.org/client/register) (free: 10 req/min, no daily cap)
3. **Vercel** → [vercel.com](https://vercel.com) (free Hobby tier, connects to GitHub)

---

## End-to-End Setup Guide

### 1. Clone and install

```bash
git clone https://github.com/your-username/vm-soccer-sucker-26.git
cd vm-soccer-sucker-26
npm install
```

### 2. Create a Supabase project

1. [app.supabase.com](https://app.supabase.com) → **New project**
2. Name it anything, choose **eu-west-1 (Frankfurt)** for best Sweden latency
3. Wait ~2 min for provisioning
4. **SQL Editor** → paste and run `supabase/migrations/001_initial_schema.sql`
5. **Project Settings → API** — copy these three values:

   | Setting | Used as |
   |---------|---------|
   | Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
   | `anon` public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` ⚠️ keep secret |

### 3. Get a football-data.org API key

1. Register at [football-data.org/client/register](https://www.football-data.org/client/register)
2. Check your email for the API key
3. Note it as `FOOTBALL_DATA_API_KEY`
4. Free tier limit: 10 req/min. The sync scripts auto-throttle with a 6-second delay.

### 4. Run locally

```bash
cp .env.local.example .env.local
# Edit .env.local — fill in values from steps 2 and 3
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel

1. Push repo to GitHub
2. [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Framework: **Next.js** (auto-detected)
4. Add **Environment Variables** in Vercel (Settings → Environment Variables):

   | Variable | Where to get it | Scope |
   |----------|----------------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings → API | All |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings → API | All |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API | Production only |
   | `NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID` | YouTube playlist URL (optional) | All |

   > `FOOTBALL_DATA_API_KEY` is **not** needed in Vercel — it's only used by GitHub Actions.

5. **Deploy** → Vercel builds and gives you a production URL

### 6. Add GitHub Secrets (for auto-sync)

The workflow at `.github/workflows/sync-tournament.yml` runs twice daily.
Add secrets at: GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|-------------|-------|
| `SUPABASE_URL` | Same as `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `FOOTBALL_DATA_API_KEY` | football-data.org API key |

> The secret must be named `SUPABASE_URL` (no `NEXT_PUBLIC_` prefix) because GitHub secret names only support alphanumeric characters and underscores.

### 7. (Optional) Add YouTube background music

1. Find a football playlist on YouTube (search "FIFA World Cup songs", "football stadium music", "no copyright football music")
2. Open the playlist → copy the URL: `youtube.com/playlist?list=XXXXXXXXXXX`
3. Copy the ID after `?list=` (e.g. `PLfoo123bar`)
4. Add `NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID=PLfoo123bar` in Vercel environment variables → Redeploy

Users cycle through: **Off → Stadium crowd noise (Web Audio) → YouTube music → Off**

### 8. Invite your friends

Share the Vercel URL. Each person:
1. Opens the URL
2. Creates an account (username + password only, no email needed)
3. Picks an avatar and display name
4. Gets a 7-step onboarding guide automatically

---

## Running sync scripts manually

```bash
# Fetch all WC 2026 fixtures (run once before tournament starts)
npm run sync:matches

# Update scores for recently finished matches
npm run sync:results

# Re-score all evaluated bets + rebuild leaderboard
npm run score:bets

# Sync player names for the bet dropdowns (run once in June when squads are confirmed)
npm run sync:players
```

All scripts read from `.env.local` locally. In GitHub Actions they read from repository secrets.

---

## Key Dates

| Date | Event |
|------|-------|
| **1 June 2026 00:00 CEST** | Betting window opens — all bet forms unlock |
| **11 June 2026 17:00 UTC** | Tournament & Chaos bets lock permanently |
| **11 June 2026 onwards** | Match bets lock individually at each kickoff |
| **10 June – 19 July** | GitHub Actions syncs data twice daily (06:00 + 18:00 UTC) |
| **19 July 2026** | WC Final — last scoring run |

---

## Scoring Reference

### Match bets (lock at kickoff)
| Bet type | Points |
|----------|--------|
| Correct 1/X/2 | 10 p |
| Exact score | 50 p |
| First scorer | 30 p |
| Both teams score | 5 p |
| Yellow cards exact | 8 p |
| Yellow cards ±1 | 4 p |

### Tournament bets (lock June 11)
| Bet | Points |
|-----|--------|
| WC winner | 5 000 p |
| Top scorer | 4 000 p |
| Both finalists correct | 3 000 p |
| Total goals (exact 2 000p · ±2: 1 000p · ±5: 500p) | up to 2 000 p |
| Death group | 1 500 p |
| Most red cards team | 1 000 p |

### Chaos bets (10 000 p each, lock June 11)
Goalkeeper scores · Coach sent off · 0-3 comeback in knockout · Final on penalties with 3+ misses · Sweden to the final · Most dramatic player on camera

### Power-ups (match bets only)
| Power-up | Effect |
|----------|--------|
| Dubbel-eller-inget | 2× points if correct, 0 if wrong |
| Taktikgeniet | 50% if right side, 0 if completely wrong |
| 6-Poängaren | +600 p bonus added on top |
| Försäkringen | 50% points back if wrong |
| Tidsmaskinen | Change a locked guess after kickoff (once per bet) |

---

## Architecture

```
Browser
  └── Next.js 14 on Vercel
        ├── /dashboard        leaderboard, results, chat
        ├── /bets/turnering   tournament predictions
        ├── /bets/match/[id]  per-match betting form
        ├── /bets/kaos        chaos predictions
        └── /auth             username + password auth

Supabase
  ├── Auth    admin API — create users, no email confirmation
  ├── Postgres
  │   ├── profiles            user info + avatar
  │   ├── bets                all predictions
  │   ├── matches             WC fixture + score data
  │   ├── leaderboard_cache   pre-computed rankings
  │   ├── trash_talk          group chat messages
  │   └── user_powerups       power-up inventory
  └── Realtime  live chat subscriptions (no polling)

GitHub Actions (cron 06:00 + 18:00 UTC · June 10 – July 19 only)
  ├── sync:matches    fetch fixture list → upsert matches table
  ├── sync:results    fetch scores → update matches + first_scorer
  └── score:bets      evaluate bets → update points + leaderboard_cache
```

---

## Project Structure

```
src/
├── app/
│   ├── auth/               sign in / sign up
│   ├── onboarding/         avatar + username pick
│   ├── dashboard/          main hub (leaderboard, chat)
│   └── bets/
│       ├── turnering/      tournament predictions
│       ├── match/[id]/     per-match form + power-ups
│       └── kaos/           chaos predictions
├── components/             shared UI (BottomNav, BigCountdown, etc.)
├── lib/
│   ├── bets.ts             bet definitions + point values
│   ├── scoring.ts          pure scoring functions
│   └── teams.ts            WC 2026 teams + player list
└── types/database.ts       Supabase TypeScript types

scripts/
├── _client.ts              shared Supabase + API helpers
├── sync-matches.ts
├── sync-results.ts
├── sync-players.ts
└── score-bets.ts

supabase/migrations/
└── 001_initial_schema.sql
```

---

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — **never** expose it in client-side code or commit it to git
- `NEXT_PUBLIC_*` variables are safe to expose (protected by RLS policies on the database)
- `.env.local` is in `.gitignore` — verify before every commit
- All server actions re-validate the authenticated session before touching data
- Row Level Security policies ensure users can only read/write their own bets

---

## License

Personal project — built for one friend group, for ära och heder. Not licensed for redistribution.
