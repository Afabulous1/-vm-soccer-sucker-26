-- Fix 4 group-stage kickoff times that were incorrectly set to 23:00 UTC
-- instead of 17:00 UTC (19:00 CEST). Bets are untouched.
-- Affected: match 11 (Jun 14), 23 (Jun 17), 35 (Jun 20), 47 (Jun 23).

UPDATE public.matches SET kickoff_at = '2026-06-14T17:00:00Z', updated_at = now()
  WHERE external_id = 11;

UPDATE public.matches SET kickoff_at = '2026-06-17T17:00:00Z', updated_at = now()
  WHERE external_id = 23;

UPDATE public.matches SET kickoff_at = '2026-06-20T17:00:00Z', updated_at = now()
  WHERE external_id = 35;

UPDATE public.matches SET kickoff_at = '2026-06-23T17:00:00Z', updated_at = now()
  WHERE external_id = 47;
