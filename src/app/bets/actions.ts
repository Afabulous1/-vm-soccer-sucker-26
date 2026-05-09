"use server";

import { createClient } from "@/lib/supabase/server";
import type { BetCategory, PowerupType, SuggestionTier } from "@/types/database";

interface SaveBetInput {
  betType: string;
  betCategory: BetCategory;
  matchId?: string;
  betValue: unknown;
  pointsWager: number;
  lockTime: Date;
  suggestionTier?: SuggestionTier;
  powerUpUsed?: PowerupType | null;
  shieldUsed?: PowerupType | null;
}

interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function saveBet(input: SaveBetInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Du måste vara inloggad." };

  if (new Date() >= input.lockTime) {
    return { error: "Gissningsperioden är stängd — matchen/turneringen har börjat." };
  }

  // Check for existing bet of this type for this user (+optional match)
  let query = supabase
    .from("bets")
    .select("id, locked_at")
    .eq("user_id", user.id)
    .eq("bet_type", input.betType);

  if (input.matchId) {
    query = query.eq("match_id", input.matchId);
  } else {
    query = query.is("match_id", null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing?.locked_at) {
    return { error: "Den här gissningen är låst och kan inte ändras." };
  }

  if (existing) {
    const { error } = await supabase
      .from("bets")
      .update({
        bet_value: input.betValue as never,
        suggestion_tier: (input.suggestionTier ?? null) as never,
        power_up_used: (input.powerUpUsed ?? null) as never,
        shield_used: (input.shieldUsed ?? null) as never,
      })
      .eq("id", existing.id);

    if (error) return { error: "Kunde inte uppdatera gissningen. Försök igen." };
  } else {
    const { error } = await supabase.from("bets").insert({
      user_id: user.id,
      bet_type: input.betType,
      bet_category: input.betCategory,
      match_id: input.matchId ?? null,
      bet_value: input.betValue as never,
      points_wager: input.pointsWager,
      suggestion_tier: input.suggestionTier ?? null,
      power_up_used: input.powerUpUsed ?? null,
      shield_used: input.shieldUsed ?? null,
    });

    if (error) return { error: "Kunde inte spara gissningen. Försök igen." };
  }

  // Decrement used power-ups from user_powerups inventory
  const powerUpsToDecrement: PowerupType[] = [];
  if (input.powerUpUsed) powerUpsToDecrement.push(input.powerUpUsed);
  if (input.shieldUsed) powerUpsToDecrement.push(input.shieldUsed);

  for (const puType of powerUpsToDecrement) {
    const { data: existing_pu } = await supabase
      .from("user_powerups")
      .select("quantity")
      .eq("user_id", user.id)
      .eq("powerup_type", puType)
      .maybeSingle();

    if (existing_pu && existing_pu.quantity > 0) {
      await supabase
        .from("user_powerups")
        .update({ quantity: existing_pu.quantity - 1 })
        .eq("user_id", user.id)
        .eq("powerup_type", puType);
    }
  }

  return { success: true };
}

export async function getUserBets(category: BetCategory) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("bets")
    .select("bet_type, bet_value, points_wager, locked_at, is_correct, points_awarded")
    .eq("user_id", user.id)
    .eq("bet_category", category);

  return data ?? [];
}

export async function getMatchBets(matchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("bets")
    .select("bet_type, bet_value, points_wager, locked_at, is_correct, points_awarded")
    .eq("user_id", user.id)
    .eq("match_id", matchId);

  return data ?? [];
}
