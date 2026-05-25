-- ============================================================
-- VM Soccer Sucker 26 — Explicit Data API Grants (idempotent)
--
-- Required from May 30, 2026: new Supabase projects (and all
-- existing projects from Oct 30) require explicit GRANTs for
-- tables in the public schema to be accessible via the Data
-- API (supabase-js / PostgREST / GraphQL).
--
-- Run this migration after unpausing the project.
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
GRANT SELECT
  ON public.profiles TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.profiles TO service_role;

-- ── matches ─────────────────────────────────────────────────
GRANT SELECT
  ON public.matches TO anon;

GRANT SELECT
  ON public.matches TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.matches TO service_role;

-- ── bets ────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.bets TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.bets TO service_role;

-- ── leaderboard_cache ───────────────────────────────────────
GRANT SELECT
  ON public.leaderboard_cache TO anon;

GRANT SELECT
  ON public.leaderboard_cache TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.leaderboard_cache TO service_role;

-- ── trash_talk ──────────────────────────────────────────────
GRANT SELECT
  ON public.trash_talk TO anon;

GRANT SELECT, INSERT, DELETE
  ON public.trash_talk TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.trash_talk TO service_role;

-- ── user_powerups ───────────────────────────────────────────
GRANT SELECT
  ON public.user_powerups TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.user_powerups TO service_role;

-- ── suggestion_stats ────────────────────────────────────────
GRANT SELECT
  ON public.suggestion_stats TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.suggestion_stats TO service_role;
