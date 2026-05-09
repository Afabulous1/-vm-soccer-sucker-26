-- ============================================================
-- VM Soccer Sucker 26 — Initial Schema
-- Run this in the Supabase SQL editor or via `supabase db push`
-- ============================================================

-- Enums
CREATE TYPE suggestion_tier AS ENUM ('safe', 'devil', 'crazy');
CREATE TYPE bet_category AS ENUM ('turnering', 'match', 'kaos');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed');
CREATE TYPE powerup_type AS ENUM (
  'double_or_nothing',
  'taktikgeniet',
  'sexpoangaren',
  'forsakringen',
  'tidsmaskinen'
);

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE profiles (
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Leaderboard: allow reading username/avatar/points/etc (not email, not user_id)
CREATE POLICY "Leaderboard data is public read"
  ON profiles FOR SELECT
  USING (true);  -- username, avatar, points only — no PII

-- ============================================================
-- matches
-- ============================================================
CREATE TABLE matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id INTEGER NOT NULL UNIQUE,
  home_team   TEXT NOT NULL,
  away_team   TEXT NOT NULL,
  kickoff_at  TIMESTAMPTZ NOT NULL,
  status      match_status NOT NULL DEFAULT 'scheduled',
  home_score  INTEGER,
  away_score  INTEGER,
  stage       TEXT NOT NULL,
  group_name  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Matches are public read (scores shown to everyone)
CREATE POLICY "Matches are publicly readable"
  ON matches FOR SELECT USING (true);

-- Only service role / edge functions can write
CREATE POLICY "Service role can insert matches"
  ON matches FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update matches"
  ON matches FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================
-- bets
-- ============================================================
CREATE TABLE bets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bet_type        TEXT NOT NULL,
  bet_category    bet_category NOT NULL,
  match_id        UUID REFERENCES matches(id) ON DELETE SET NULL,
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

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bets"
  ON bets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can place bets"
  ON bets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocked bets"
  ON bets FOR UPDATE USING (auth.uid() = user_id AND locked_at IS NULL);

CREATE POLICY "Users can delete their own unlocked bets"
  ON bets FOR DELETE USING (auth.uid() = user_id AND locked_at IS NULL);

CREATE POLICY "Service role can grade bets"
  ON bets FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================
-- leaderboard_cache
-- ============================================================
CREATE TABLE leaderboard_cache (
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

ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboard_cache FOR SELECT USING (true);

CREATE POLICY "Service role can maintain leaderboard"
  ON leaderboard_cache FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- trash_talk
-- ============================================================
CREATE TABLE trash_talk (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  avatar_key  TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trash_talk_message_length CHECK (char_length(message) BETWEEN 1 AND 80)
);

ALTER TABLE trash_talk ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trash talk is publicly readable"
  ON trash_talk FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post trash talk"
  ON trash_talk FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own trash talk"
  ON trash_talk FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- user_powerups
-- ============================================================
CREATE TABLE user_powerups (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  powerup_type powerup_type NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, powerup_type)
);

ALTER TABLE user_powerups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own powerups"
  ON user_powerups FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages powerups"
  ON user_powerups FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- suggestion_stats
-- ============================================================
CREATE TABLE suggestion_stats (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  safe_count    INTEGER NOT NULL DEFAULT 0,
  devil_count   INTEGER NOT NULL DEFAULT 0,
  crazy_count   INTEGER NOT NULL DEFAULT 0,
  safe_correct  INTEGER NOT NULL DEFAULT 0,
  devil_correct INTEGER NOT NULL DEFAULT 0,
  crazy_correct INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE suggestion_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own suggestion stats"
  ON suggestion_stats FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages suggestion stats"
  ON suggestion_stats FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Triggers: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_powerups_updated_at
  BEFORE UPDATE ON user_powerups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER suggestion_stats_updated_at
  BEFORE UPDATE ON suggestion_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leaderboard_cache_updated_at
  BEFORE UPDATE ON leaderboard_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Seed: default powerups for new users (called via edge function)
-- ============================================================
CREATE OR REPLACE FUNCTION initialize_user_powerups(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_powerups (user_id, powerup_type, quantity) VALUES
    (p_user_id, 'double_or_nothing', 3),
    (p_user_id, 'taktikgeniet',      3),
    (p_user_id, 'sexpoangaren',      3),
    (p_user_id, 'forsakringen',      2),
    (p_user_id, 'tidsmaskinen',      2)
  ON CONFLICT DO NOTHING;

  INSERT INTO suggestion_stats (user_id) VALUES (p_user_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
