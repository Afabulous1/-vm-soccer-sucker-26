-- Migration 006: Track B sabotage power-ups
-- Adds 'sabotage' and 'punto_bandito' to the powerup_type enum
-- and seeds them (1× each) for all existing users.

-- 1. Extend the enum
ALTER TYPE powerup_type ADD VALUE IF NOT EXISTS 'sabotage';
ALTER TYPE powerup_type ADD VALUE IF NOT EXISTS 'punto_bandito';

-- 2. Seed the new powers for existing users (skip if already present)
INSERT INTO user_powerups (user_id, powerup_type, quantity, updated_at)
SELECT
  p.user_id,
  vals.pt,
  1,
  now()
FROM profiles p
CROSS JOIN (VALUES ('sabotage'::powerup_type), ('punto_bandito'::powerup_type)) AS vals(pt)
ON CONFLICT (user_id, powerup_type) DO NOTHING;

-- 3. Update initialize_user_powerups() so new sign-ups also get the powers
CREATE OR REPLACE FUNCTION public.initialize_user_powerups(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_powerups (user_id, powerup_type, quantity) VALUES
    (p_user_id, 'double_or_nothing', 3),
    (p_user_id, 'taktikgeniet',      3),
    (p_user_id, 'sexpoangaren',      3),
    (p_user_id, 'forsakringen',      2),
    (p_user_id, 'tidsmaskinen',      2),
    (p_user_id, 'joker',             1),
    (p_user_id, 'sabotage',          1),
    (p_user_id, 'punto_bandito',     1)
  ON CONFLICT (user_id, powerup_type) DO NOTHING;

  INSERT INTO suggestion_stats (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 4. Grant execute to authenticated role (consistent with migration 004)
GRANT EXECUTE ON FUNCTION public.initialize_user_powerups(uuid) TO authenticated;
