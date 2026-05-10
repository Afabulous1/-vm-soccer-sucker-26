-- ============================================================
-- VM Soccer Sucker 26 — Initial Schema (idempotent)
-- Safe to re-run: uses IF NOT EXISTS, DROP IF EXISTS, CREATE OR REPLACE
-- ============================================================

-- -------------------------
-- Enums
-- -------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'suggestion_tier') THEN
    CREATE TYPE suggestion_tier AS ENUM ('safe', 'devil', 'crazy');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_category') THEN
    CREATE TYPE bet_category AS ENUM ('turnering', 'match', 'kaos');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
    CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'powerup_type') THEN
    CREATE TYPE powerup_type AS ENUM (
      'double_or_nothing',
      'taktikgeniet',
      'sexpoangaren',
      'forsakringen',
      'tidsmaskinen',
      'joker'
    );
  END IF;
END $$;

-- Add joker to existing enum if it's missing (for DBs created before joker was added)
ALTER TYPE powerup_type ADD VALUE IF NOT EXISTS 'joker';

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  avatar_key  TEXT NOT NULL,
  points_total INTEGER NOT NULL DEFAULT 0,
  suggestion_personality TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_unique UNIQUE (username),
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id),
  CONSTRAINT profiles_username_length CHECK (char_length(username) BETWEEN 1 AND 20)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Leaderboard data is public read" ON public.profiles;
CREATE POLICY "Leaderboard data is public read"
ON public.profiles FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

-- ============================================================
-- matches
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   INTEGER NOT NULL UNIQUE,
  home_team     TEXT NOT NULL,
  away_team     TEXT NOT NULL,
  kickoff_at    TIMESTAMPTZ NOT NULL,
  status        match_status NOT NULL DEFAULT 'scheduled',
  home_score    INTEGER,
  away_score    INTEGER,
  first_scorer  TEXT,
  red_card_count INTEGER,
  stage         TEXT NOT NULL,
  group_name    TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns that may not exist on older DBs
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS first_scorer TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS red_card_count INTEGER;

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Matches are publicly readable" ON public.matches;
CREATE POLICY "Matches are publicly readable"
ON public.matches FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Service role can insert matches" ON public.matches;
CREATE POLICY "Service role can insert matches"
ON public.matches FOR INSERT TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update matches" ON public.matches;
CREATE POLICY "Service role can update matches"
ON public.matches FOR UPDATE TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- bets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bet_type        TEXT NOT NULL,
  bet_category    bet_category NOT NULL,
  match_id        UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  bet_value       JSONB NOT NULL,
  points_wager    INTEGER NOT NULL,
  power_up_used   powerup_type,
  shield_used     powerup_type,
  suggestion_tier suggestion_tier,
  is_correct      BOOLEAN,
  points_awarded  INTEGER,
  locked_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bets" ON public.bets;
CREATE POLICY "Users can view their own bets"
ON public.bets FOR SELECT TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can place bets" ON public.bets;
CREATE POLICY "Users can place bets"
ON public.bets FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own unlocked bets" ON public.bets;
CREATE POLICY "Users can update their own unlocked bets"
ON public.bets FOR UPDATE TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id AND locked_at IS NULL)
WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id AND locked_at IS NULL);

DROP POLICY IF EXISTS "Users can delete their own unlocked bets" ON public.bets;
CREATE POLICY "Users can delete their own unlocked bets"
ON public.bets FOR DELETE TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id AND locked_at IS NULL);

DROP POLICY IF EXISTS "Service role can grade bets" ON public.bets;
CREATE POLICY "Service role can grade bets"
ON public.bets FOR UPDATE TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- leaderboard_cache
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  avatar_key      TEXT NOT NULL,
  points_total    INTEGER NOT NULL DEFAULT 0,
  weekly_points   INTEGER NOT NULL DEFAULT 0,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  badges          JSONB NOT NULL DEFAULT '[]',
  rank            INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON public.leaderboard_cache;
CREATE POLICY "Leaderboard is publicly readable"
ON public.leaderboard_cache FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Service role can maintain leaderboard" ON public.leaderboard_cache;
CREATE POLICY "Service role can maintain leaderboard"
ON public.leaderboard_cache FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- trash_talk
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trash_talk (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  avatar_key  TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trash_talk_message_length CHECK (char_length(message) BETWEEN 1 AND 80)
);

ALTER TABLE public.trash_talk ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trash talk is publicly readable" ON public.trash_talk;
CREATE POLICY "Trash talk is publicly readable"
ON public.trash_talk FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can post trash talk" ON public.trash_talk;
CREATE POLICY "Authenticated users can post trash talk"
ON public.trash_talk FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own trash talk" ON public.trash_talk;
CREATE POLICY "Users can delete their own trash talk"
ON public.trash_talk FOR DELETE TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

-- ============================================================
-- user_powerups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_powerups (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  powerup_type powerup_type NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, powerup_type)
);

ALTER TABLE public.user_powerups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own powerups" ON public.user_powerups;
CREATE POLICY "Users can view their own powerups"
ON public.user_powerups FOR SELECT TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role manages powerups" ON public.user_powerups;
CREATE POLICY "Service role manages powerups"
ON public.user_powerups FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- suggestion_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suggestion_stats (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  safe_count    INTEGER NOT NULL DEFAULT 0,
  devil_count   INTEGER NOT NULL DEFAULT 0,
  crazy_count   INTEGER NOT NULL DEFAULT 0,
  safe_correct  INTEGER NOT NULL DEFAULT 0,
  devil_correct INTEGER NOT NULL DEFAULT 0,
  crazy_correct INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suggestion_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own suggestion stats" ON public.suggestion_stats;
CREATE POLICY "Users can view their own suggestion stats"
ON public.suggestion_stats FOR SELECT TO authenticated
USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role manages suggestion stats" ON public.suggestion_stats;
CREATE POLICY "Service role manages suggestion stats"
ON public.suggestion_stats FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS matches_updated_at ON public.matches;
CREATE TRIGGER matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS user_powerups_updated_at ON public.user_powerups;
CREATE TRIGGER user_powerups_updated_at
BEFORE UPDATE ON public.user_powerups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS suggestion_stats_updated_at ON public.suggestion_stats;
CREATE TRIGGER suggestion_stats_updated_at
BEFORE UPDATE ON public.suggestion_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS leaderboard_cache_updated_at ON public.leaderboard_cache;
CREATE TRIGGER leaderboard_cache_updated_at
BEFORE UPDATE ON public.leaderboard_cache
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- initialize_user_powerups (called on signup via edge function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.initialize_user_powerups(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_powerups (user_id, powerup_type, quantity) VALUES
    (p_user_id, 'double_or_nothing', 3),
    (p_user_id, 'taktikgeniet',      3),
    (p_user_id, 'sexpoangaren',      3),
    (p_user_id, 'forsakringen',      2),
    (p_user_id, 'tidsmaskinen',      2),
    (p_user_id, 'joker',             1)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.suggestion_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.initialize_user_powerups(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.initialize_user_powerups(UUID) FROM anon, authenticated;
