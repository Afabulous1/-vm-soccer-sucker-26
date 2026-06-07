-- Migration 007: Party actions table for Sabotage and Punto Bandito
-- Tracks when players use party powers against each other on a specific match.

CREATE TABLE IF NOT EXISTS public.party_actions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  match_id     UUID        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  action_type  TEXT        NOT NULL CHECK (action_type IN ('sabotage', 'punto_bandito')),
  resolved     BOOLEAN     NOT NULL DEFAULT false,
  points_effect INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One sabotage AND one punto_bandito allowed per actor per match
  CONSTRAINT party_actions_unique UNIQUE (actor_id, match_id, action_type)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS party_actions_match_id_idx  ON public.party_actions (match_id);
CREATE INDEX IF NOT EXISTS party_actions_target_id_idx ON public.party_actions (target_id);
CREATE INDEX IF NOT EXISTS party_actions_actor_id_idx  ON public.party_actions (actor_id);

-- Row-level security
ALTER TABLE public.party_actions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read party actions (so you can see if you've been sabotaged)
CREATE POLICY "authenticated_read_party_actions"
  ON public.party_actions FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own actions
CREATE POLICY "authenticated_insert_own_party_actions"
  ON public.party_actions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = actor_id);

-- Service role has full access (for resolving actions during scoring)
CREATE POLICY "service_role_all_party_actions"
  ON public.party_actions FOR ALL
  TO service_role
  USING (true);

-- Grants
GRANT SELECT, INSERT ON public.party_actions TO authenticated;
GRANT ALL             ON public.party_actions TO service_role;
