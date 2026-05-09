-- ============================================================
-- Clear only bets + leaderboard — keeps users and profiles.
-- Use this to reset the competition without removing accounts.
-- ============================================================

TRUNCATE TABLE
  suggestion_stats,
  leaderboard_cache,
  bets
RESTART IDENTITY CASCADE;

-- Reset all point totals to 0
UPDATE profiles SET points_total = 0, updated_at = now();

-- Reset powerup quantities to starting values
UPDATE user_powerups SET quantity = CASE
  WHEN powerup_type IN ('double_or_nothing', 'taktikgeniet', 'sexpoangaren') THEN 3
  WHEN powerup_type IN ('forsakringen', 'tidsmaskinen') THEN 2
  ELSE 0
END, updated_at = now();

SELECT 'Klar! Alla tips är nollställda men spelarna är kvar. ⚽' AS status;
