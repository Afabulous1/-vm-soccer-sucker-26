-- ============================================================
-- Migration 003: Tighten profiles RLS & document email storage
-- ============================================================
-- PROBLEM: "Leaderboard data is public read" used USING (true),
-- exposing user_id and suggestion_personality to anonymous users.
-- Emails are safe (they live only in auth.users, a protected system
-- table not accessible via PostgREST), but user_id leakage is
-- unnecessary. Leaderboard display data lives in leaderboard_cache,
-- which already has the correct public policy.
-- ============================================================

-- Remove the overly broad public-read policy
DROP POLICY IF EXISTS "Leaderboard data is public read" ON profiles;

-- Profiles are now fully private: only the owner can read/write their own row.
-- Leaderboard & public stats are served from leaderboard_cache instead.
-- (The four remaining policies cover own-user SELECT/INSERT/UPDATE/DELETE.)

-- Case-insensitive username uniqueness index
-- (prevents "Svensson" and "svensson" from coexisting)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_ci
  ON profiles (lower(username));

-- ============================================================
-- EMAIL SAFETY SUMMARY (no SQL needed — already enforced)
-- ============================================================
-- • User emails are stored ONLY in auth.users (Supabase system table).
-- • auth.users is NOT exposed via PostgREST. It cannot be queried
--   by any client-side code regardless of RLS.
-- • The profiles table has no email column — intentionally.
-- • The service role key (SUPABASE_SERVICE_ROLE_KEY) is the only
--   credential that can access auth.users, and it never reaches
--   the frontend.
-- • Users can request account + data deletion via /profile (GDPR).
-- ============================================================
