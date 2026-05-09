# VM Soccer Sucker 26 ⚽🇸🇪

A fun Swedish-language football World Cup 2026 gamification web app for a friend group.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/Auth/DB**: Supabase (auth, postgres, realtime)
- **Deployment**: Vercel (auto-deploy from `main`)
- **Football data**: football-data.org API
- **Music**: YouTube IFrame API

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials.
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the Supabase SQL editor.
3. `npm install`
4. `npm run dev` → open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.local.example` for all required variables.
Never commit `.env.local` or any secret keys.
