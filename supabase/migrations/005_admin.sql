-- ============================================================
-- VM Soccer Sucker 26 — Admin Outcomes + Match Extensions (idempotent)
--
-- Adds:
--   • admin_outcomes  — stores correct answers for turnering + kaos bets,
--                       set by admin via /admin UI or auto-computed from
--                       match data. Admin values always override API values.
--   • yellow_card_count on matches — filled by sync-results.ts
--   • admin_locked     on matches  — when true, sync-results.ts skips this
--                                    match (admin override wins)
-- ============================================================

-- ── Extend matches ───────────────────────────────────────────────────────────
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS yellow_card_count INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS admin_locked       BOOLEAN NOT NULL DEFAULT false;

-- ── admin_outcomes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_outcomes (
  bet_type   TEXT        PRIMARY KEY,
  value_json JSONB       NOT NULL DEFAULT '{}',
  -- 'admin' = set by admin in UI, 'api' = auto-computed from match data
  source     TEXT        NOT NULL DEFAULT 'admin',
  notes      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

ALTER TABLE public.admin_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role manages admin_outcomes" ON public.admin_outcomes;
CREATE POLICY "service_role manages admin_outcomes"
  ON public.admin_outcomes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated reads admin_outcomes" ON public.admin_outcomes;
CREATE POLICY "authenticated reads admin_outcomes"
  ON public.admin_outcomes FOR SELECT TO authenticated
  USING (true);

-- ── Grants for new table ─────────────────────────────────────────────────────
GRANT SELECT
  ON public.admin_outcomes TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.admin_outcomes TO service_role;

-- ── updated_at trigger ───────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS admin_outcomes_updated_at ON public.admin_outcomes;
CREATE TRIGGER admin_outcomes_updated_at
  BEFORE UPDATE ON public.admin_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
