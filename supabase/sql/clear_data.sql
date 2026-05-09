-- ============================================================
-- VM Soccer Sucker 26 — Clear all app data
-- Run this in the Supabase SQL Editor when you want a fresh start.
--
-- This DELETES all rows but keeps the schema, tables, and policies
-- intact. Safe to run multiple times.
--
-- ⚠️  This also deletes auth users (sign-ins). Everyone will need
--     to log in again and re-do onboarding.
-- ============================================================

-- Order matters: child tables (FK references) must be cleared first

TRUNCATE TABLE
  suggestion_stats,
  user_powerups,
  trash_talk,
  leaderboard_cache,
  bets,
  profiles,
  matches
RESTART IDENTITY CASCADE;

-- Delete all users from Supabase Auth
-- (this cascades and deletes their profiles too via ON DELETE CASCADE)
DELETE FROM auth.users;

-- Confirm
SELECT 'Klar! Databasen är tom och redo för nytt VM. ⚽' AS status;
