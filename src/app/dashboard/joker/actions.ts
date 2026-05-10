"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function executeJoker(victimUserId: string, betId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inte inloggad" };
  if (victimUserId === user.id) return { error: "Du kan inte stjäla från dig själv" };

  // 1. Check thief has joker
  const { data: inv } = await supabase
    .from("user_powerups")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("powerup_type", "joker")
    .single();

  if (!inv || inv.quantity < 1) return { error: "Du har ingen Joker kvar" };

  // 2. Fetch the target bet — must be a correct match bet with positive points
  const { data: bet } = await supabase
    .from("bets")
    .select("id, user_id, points_awarded, bet_type, bet_value, match_id")
    .eq("id", betId)
    .eq("user_id", victimUserId)
    .eq("bet_category", "match")
    .eq("is_correct", true)
    .single();

  if (!bet) return { error: "Gissningen hittades inte eller är inte en vinst" };
  if (!bet.points_awarded || bet.points_awarded <= 0)
    return { error: "Den gissningen har inga poäng att stjäla (redan stulen?)" };

  const stolen = bet.points_awarded;

  // 3. Zero out victim's bet points (mark as stolen: is_correct stays true, points→0)
  const { error: zeroErr } = await supabase
    .from("bets")
    .update({ points_awarded: 0 })
    .eq("id", betId);

  if (zeroErr) return { error: `Kunde inte stjäla: ${zeroErr.message}` };

  // 4. Create joker_steal entry for thief (synthetic bet row as the ledger entry)
  const { error: stealErr } = await supabase.from("bets").insert({
    user_id: user.id,
    bet_type: "joker_steal",
    bet_category: "match",
    match_id: bet.match_id,
    bet_value: {
      stolen_from: victimUserId,
      original_bet_id: betId,
      original_bet_type: bet.bet_type,
    },
    points_wager: stolen,
    is_correct: true,
    points_awarded: stolen,
    locked_at: new Date().toISOString(),
  });

  if (stealErr) {
    // Roll back the zero
    await supabase.from("bets").update({ points_awarded: stolen }).eq("id", betId);
    return { error: `Kunde inte registrera stölden: ${stealErr.message}` };
  }

  // 5. Decrement joker quantity
  await supabase
    .from("user_powerups")
    .update({ quantity: inv.quantity - 1 })
    .eq("user_id", user.id)
    .eq("powerup_type", "joker");

  // 6. Sync both users' points_total from bets
  for (const uid of [user.id, victimUserId]) {
    const { data: userBets } = await supabase
      .from("bets")
      .select("points_awarded")
      .eq("user_id", uid)
      .not("points_awarded", "is", null);
    const total = (userBets ?? []).reduce((s, b) => s + (b.points_awarded ?? 0), 0);
    await supabase.from("profiles").update({ points_total: total }).eq("user_id", uid);
  }

  redirect("/dashboard?joker=success");
}

export async function getVictimWinningBets(victimUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bets } = await supabase
    .from("bets")
    .select("id, bet_type, points_awarded, match_id, bet_value")
    .eq("user_id", victimUserId)
    .eq("bet_category", "match")
    .eq("is_correct", true)
    .gt("points_awarded", 0)
    .order("points_awarded", { ascending: false });

  if (!bets?.length) return [];

  // Fetch match names for context
  const matchIds = Array.from(new Set(bets.map((b) => b.match_id).filter(Boolean)));
  const { data: matches } = await supabase
    .from("matches")
    .select("id, home_team, away_team, home_score, away_score")
    .in("id", matchIds as string[]);

  const matchMap = new Map((matches ?? []).map((m) => [m.id, m]));

  return bets.map((b) => ({
    id: b.id,
    betType: b.bet_type,
    pointsAwarded: b.points_awarded as number,
    match: matchMap.get(b.match_id ?? "") ?? null,
  }));
}
