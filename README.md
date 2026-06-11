# VM Soccer Sucker 26 ⚽

> Swedish-language World Cup 2026 prediction app for friend groups — for glory and bragging rights.

Friends compete by predicting WC 2026 results across two tracks: Football Fan (match + tournament bets) and Party Player (wild chaos predictions + sabotage powers). No money, no ads — just ära och heder.

---

## Two Tracks — Pick Your Camp

### ⚽ Fotbollsfansen — Football Fan Track
For people who follow football and want to prove they know their stuff.
- **Turneringsgissningar** — VM-vinnare, finalister, skyttekung, dödsgrupp (lock June 11)
- **Matchgissningar** — 1-X-2 result + total goals per match (lock 15 min before kickoff)
- All 72 group stage matches + knockout rounds available to bet on from June 8

### 🔥 Party-spelaren — Party Track
For everyone — zero football knowledge required.
- **Party Predictions** — 6 crazy yes/no scenarios (goalkeeper scores, 0-3 comeback etc.) — 10 000p each (lock June 11)
- **Sabotage** 🧊 — freeze a rival's winning bet during the tournament
- **Punto Bandito** 🦊 — steal points from the current round leader

You can play both tracks for maximum points.

---

## Features

| Area | What you get |
|------|-------------|
| **Auth** | Username + password sign-up (no email required) |
| **Fan Track: Tournament** | 6 predictions · 1 000–5 000 p · lock June 11 |
| **Fan Track: Match bets** | 1-X-2 + total goals · 100+50 p · lock at kickoff |
| **Party Track** | 6 wild yes/no predictions · 10 000 p each · lock June 11 |
| **Party powers** | Sabotage (freeze rival) + Punto Bandito (steal points) |
| **Power-ups** | 8 abilities total: Double-or-Nothing, Tactician, +6-Pointer, Insurance, Time Machine, Joker, Sabotage, Punto Bandito |
| **Joker** | Steal any player's match win points — activates at semi-finals |
| **Taunts** | Random Swedish smack-talk when you make a choice |
| **Live data** | Auto-synced from football-data.org twice daily via GitHub Actions |
| **Dashboard** | Leaderboard (Total / Week / Streak), recent results, upcoming matches |
| **Chat** | Live group chat wall (Spelarbänken) via Supabase Realtime |
| **Admin panel** | Score bets, set outcomes, override match results at `/admin` |
| **Simulation console** | Test every feature at `/dev` — time travel, seed matches, grant powers |

---

## Key Dates

| Date | Event |
|------|-------|
| **8 June 2026 00:00 CEST** | Betting window opens — all bet forms unlock |
| **11 June 2026 17:00 UTC** | Tournament & Party Predictions lock permanently |
| **11 June 2026 onwards** | Match bets lock individually 15 min before each kickoff |
| **10 June – 19 July** | GitHub Actions syncs data twice daily (06:00 + 18:00 UTC) |
| **8 July 2026** | Joker card activates (semi-final phase) |
| **19 July 2026** | WC Final — last scoring run |

---

## Tech Stack

```
Frontend    Next.js 14 (App Router) + TypeScript + Tailwind CSS
Auth / DB   Supabase (auth, Postgres, Realtime, RLS)
Deploy      Vercel (auto-deploy from main branch)
Data sync   football-data.org free API → GitHub Actions cron
```

---

## How All the Pieces Fit Together

### Supabase — database & auth
- Stores everything: users, bets, match data, chat, leaderboard, admin outcomes
- No email confirmation — uses the admin API directly
- Realtime subscriptions power live chat without page reloads
- RLS ensures users can only read/edit their own bets

### Vercel — hosts the website
- Auto-deploys every push to `main`
- Server Actions run as serverless functions
- Friends reach the app via the Vercel URL

### GitHub Actions — scheduled data sync
- Runs at 06:00 and 18:00 UTC, June 10 – July 19
- Fetches match results → scores bets → rebuilds leaderboard

### football-data.org — match data source
- Free API: 10 req/min, auto-throttled
- Only GitHub Actions calls it — never the frontend

---

## Operator Checklist

### Before June 8 — Setup (do this once)
- [ ] Create Supabase project → run all migrations in order (001–006)
- [ ] Reload schema cache: Dashboard → Project Settings → API → Reload schema cache
- [ ] Deploy to Vercel → add the 4 environment variables
- [ ] Add the 3 GitHub Secrets for Actions
- [ ] Go to `/dev` → click "Seeda ALLA 72 gruppspelsmatcher" to seed all fixtures
- [ ] Share the Vercel URL with your friends

### June 8 — Betting opens automatically
- No action needed — the app unlocks at midnight CEST
- Friends can now place all bets (both tracks, all 72 matches visible)

### June 11, 17:00 UTC — VM starts, tournament bets lock
- No action needed — tournament + party bets lock automatically
- Match bets keep working match-by-match until kickoff

### June 10 onward — GitHub Actions takes over
- Automatic — runs twice daily through July 19
- If scores look wrong: run `npm run sync:results` manually
- If leaderboard isn't updating: run `npm run score:bets` manually

### Admin panel (`/admin`)
- Score match bets after each game
- Set correct answers for tournament/party bets
- Override locked match results if needed

### July 19 — WC Final
- Verify final scores synced
- Run `/admin` → score all remaining bets
- Reveal the leaderboard 🏆

---

## Admin Panel — Operator Reference

The admin panel at `/admin` is the control center for scoring, overrides, and corrections. Only the operator needs access — no player-facing features are here.

### How the scoring pipeline works

```
football-data.org API
      │
      ▼
sync:matches   (fixtures: teams, kickoff, stage)
sync:results   (scores, first_scorer, cards — started matches only)
      │
      ▼
matches table  (source of truth for scoring)
      │
      ▼
score:bets     (evaluates unevaluated bets → leaderboard rebuild)
```

GitHub Actions runs steps 2–4 automatically at 06:00 and 18:00 UTC. Use the admin panel for anything the automation can't handle.

---

### Correcting a match result

Use this when the API gave wrong data (wrong first scorer, missing cards, etc.) or when a match was replayed / result amended.

1. Open `/admin` → scroll to **MATCHÖVERSTYRING**
2. Click the match row to expand it
3. Edit the fields that are wrong (score, first scorer, card counts, status)
4. Check **Admin-låst** — this prevents `sync:matches` and `sync:results` from overwriting your correction on the next cron run
5. Click **SPARA OVERRIDE**
6. If bets were already scored with the wrong data: click **NOLLSTÄLL SPEL FÖR DENNA MATCH** (requires confirmation)
   - This resets `is_correct` and `points_awarded` to `null` for all match bets, and marks party actions (sabotage/punto_bandito) as unresolved
7. Scroll back up to **SNABBPOÄNGSÄTTNING** → click **MATCHSPEL** to re-score with the corrected data

> **Note:** `admin_locked = true` is sticky — the cron job skips that match forever until you uncheck it. Remember to uncheck once the correct data is in the API.

---

### Correcting a tournament or kaos outcome

Use this when you set the wrong winner, top scorer, or yes/no answer, and bets have already been scored.

1. Open `/admin` → find the relevant card under **TURNERINGSGISSNINGAR** or **KAOSGISSNINGAR**
2. Select the correct value and click **SPARA**
3. Under **TURNERING + KAOS** in **SNABBPOÄNGSÄTTNING**: click **NOLLSTÄLL ALLA TURNERING/KAOS-SPEL** (requires confirmation)
   - Resets `is_correct` and `points_awarded` to `null` for all tournament and kaos bets
4. Click **TURNERING + KAOS** to re-score with the corrected outcome

---

### Correcting a specific bet manually (Supabase SQL)

For one-off fixes that don't fit the UI (e.g. a single bet that was graded wrong due to a data quirk):

```sql
-- Inspect the bet
SELECT id, user_id, bet_type, bet_value, is_correct, points_awarded
FROM bets
WHERE id = '<bet-uuid>';

-- Manually correct points
UPDATE bets
SET is_correct = true,
    points_awarded = 100
WHERE id = '<bet-uuid>';

-- Rebuild leaderboard after manual edits (run this last)
-- (trigger via /admin → any scoring button, or npm run score:bets locally)
```

---

### Fixture sync behaviour

| Script | What it syncs | Respects admin_locked? |
|--------|--------------|------------------------|
| `sync:matches` | Teams, kickoff, stage, **and** scores/status | **Yes** — skips score/status for locked matches |
| `sync:results` | Scores, first_scorer, cards (started matches only) | **Yes** — skips locked matches entirely |
| `score:bets` | Evaluates unevaluated bets, rebuilds leaderboard | N/A |

Running `sync:matches` manually is safe to re-run at any time — it's an upsert and will not overwrite admin-locked match scores.

---

### Manual sync commands

```bash
# Re-sync all fixtures (safe to re-run)
npm run sync:matches

# Re-sync scores for live/started matches
npm run sync:results

# Score all unevaluated match bets + rebuild leaderboard
npm run score:bets
```

---

## Prerequisites

1. **Supabase** → [supabase.com](https://supabase.com) (free: 1 project, 500 MB)
2. **football-data.org** → free tier, 10 req/min
3. **Vercel** → free Hobby tier

---

## Setup Guide

### 1. Clone and install

```bash
git clone https://github.com/your-username/vm-soccer-sucker-26.git
cd vm-soccer-sucker-26
npm install
```

### 2. Supabase — run all migrations

In Supabase SQL Editor, paste and run **all files in order**:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/003_tighten_profiles_rls.sql
supabase/migrations/004_explicit_grants.sql
supabase/migrations/005_admin.sql
supabase/migrations/006_track_b_powerups.sql
```

Then: **Project Settings → API → Reload schema cache**

Copy these values:

| Setting | Used as |
|---------|---------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` ⚠️ keep secret |

### 3. Run locally

```bash
cp .env.local.example .env.local
# Fill in the Supabase values
npm run dev
# Open http://localhost:3000/dev → seed all 72 group stage fixtures
```

### 4. Deploy to Vercel

1. Push to GitHub
2. Vercel → New Project → import repo → framework: Next.js
3. Add environment variables:

| Variable | Scope |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only |
| `NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID` | All (optional) |

4. Deploy → share the URL with your friends

### 5. GitHub Secrets (for auto-sync)

Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `FOOTBALL_DATA_API_KEY` | football-data.org key |

---

## Scoring Reference

### Fan Track — Match bets (lock 15 min before kickoff)
| Bet | Points |
|-----|--------|
| 1-X-2 correct | 100 p |
| Total goals exact | 50 p |
| Total goals ±1 | 25 p |
| Total goals ±2 | 10 p |

### Fan Track — Tournament bets (lock June 11)
| Bet | Points |
|-----|--------|
| WC winner | 5 000 p |
| Top scorer | 4 000 p |
| Both finalists | 3 000 p |
| Total goals (exact) | 2 000 p |
| Death group | 1 500 p |
| Most red cards team | 1 000 p |

### Party Track — Predictions (lock June 11)
6 wild yes/no scenarios · 10 000 p each if correct

### Power-ups (match bets only)
| Power-up | Effect |
|----------|--------|
| Dubbel-eller-inget | 2× if correct, 0 if wrong |
| Taktikgeniet | 50% if right side, 0 if completely wrong |
| 6-Poängaren | +600 p bonus |
| Försäkringen | 50% back if wrong |
| Tidsmaskinen | Change a locked guess after kickoff |
| Joker (semi-final+) | Steal another player's match win |
| Sabotage | Freeze a rival's winning bet |
| Punto Bandito | Steal points from round leader |

---

## Database Schema

```
profiles            user info, avatar, total points
bets                all predictions (match + tournament + kaos)
matches             WC fixtures, scores, stage, group
leaderboard_cache   pre-computed rankings
trash_talk          group chat messages
user_powerups       power-up inventory per user
admin_outcomes      correct answers for tournament/kaos bets
suggestion_stats    safe/devil/crazy pick counters
```

---

## Architecture

```
Browser
  └── Next.js 14 on Vercel
        ├── /dashboard         leaderboard, results, chat
        ├── /bets              two-camp overview
        ├── /bets/turnering    tournament predictions (Fan)
        ├── /bets/match/[id]   per-match form + power-ups (Fan)
        ├── /bets/kaos         party predictions (Party)
        ├── /admin             scoring + outcome management
        ├── /dev               simulation console (local only)
        └── /auth              username + password auth

Supabase
  ├── Auth     admin API — no email confirmation
  ├── Postgres (7 tables, full RLS)
  └── Realtime live chat (no polling)

GitHub Actions  cron 06:00 + 18:00 UTC · June 10 – July 19
  ├── sync:matches    fixtures → matches table
  ├── sync:results    scores → matches + scoring
  └── score:bets      evaluate all bets → leaderboard
```

---

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — never expose client-side or commit to git
- `NEXT_PUBLIC_*` variables are safe (protected by RLS on the DB)
- `.env.local` is in `.gitignore`
- All server actions re-validate the authenticated session
- `/dev` and `/admin` routes should be removed or gated before making the repo public

---

## License

Personal project — built for one friend group, for ära och heder.
