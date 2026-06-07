-- Migration 008: Party track power-up allocations
-- Group stage: every player gets 10 sabotage + 10 punto_bandito.
-- Knockout stage: admin clicks "Grant knockout powers" in the admin panel (+5 each).

-- 1. Bump all existing users to at least 10 of each party power
--    (GREATEST preserves anyone who somehow has more)
UPDATE public.user_powerups
SET    quantity    = GREATEST(quantity, 10),
       updated_at  = now()
WHERE  powerup_type IN ('sabotage', 'punto_bandito');

-- 2. Update initialize_user_powerups so new sign-ups also get 10
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
    (p_user_id, 'sabotage',          10),
    (p_user_id, 'punto_bandito',     10)
  ON CONFLICT (user_id, powerup_type) DO NOTHING;

  INSERT INTO suggestion_stats (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;
