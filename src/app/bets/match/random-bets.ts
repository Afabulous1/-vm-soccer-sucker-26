"use server";

import { createClient } from "@/lib/supabase/server";
import { getNowServer } from "@/lib/now";
import type { BetCategory } from "@/types/database";

// Goals distribution weighted around 2-3 (realistic for WC group stage)
const GOALS_POOL = [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 5];
const RESULT_POOL: Array<"home" | "draw" | "away"> = [
  "home", "home", "home", "home",   // 30% home
  "draw", "draw", "draw",            // 23% draw
  "away", "away", "away",            // 23% away
  "home", "draw", "away",            // spread the rest evenly
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function randomBetAllGroupGames(): Promise<{
  ok: boolean;
  count: number;
  message: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, count: 0, message: "Inte inloggad" };

  const now = await getNowServer();

  const [{ data: matches }, { data: existingBets }] = await Promise.all([
    supabase
      .from("matches")
      .select("id, kickoff_at, stage")
      .eq("stage", "group_stage")
      .eq("status", "scheduled"),
    supabase
      .from("bets")
      .select("match_id, bet_type")
      .eq("user_id", user.id)
      .eq("bet_category", "match"),
  ]);

  if (!matches || matches.length === 0) {
    return { ok: false, count: 0, message: "Inga öppna matcher hittades" };
  }

  // Build a set of already-bet match+type combos
  const already = new Set(
    (existingBets ?? []).map((b) => `${b.match_id}:${b.bet_type}`)
  );

  const toInsert: Array<{
    user_id: string;
    bet_type: string;
    bet_category: BetCategory;
    match_id: string;
    bet_value: unknown;
    points_wager: number;
  }> = [];

  for (const m of matches) {
    const lockDate = new Date(new Date(m.kickoff_at).getTime() - 15 * 60 * 1000);
    if (now >= lockDate) continue; // skip locked matches

    if (!already.has(`${m.id}:match_result`)) {
      toInsert.push({
        user_id: user.id,
        bet_type: "match_result",
        bet_category: "match",
        match_id: m.id,
        bet_value: { result: pick(RESULT_POOL) },
        points_wager: 100,
      });
    }

    if (!already.has(`${m.id}:total_goals_match`)) {
      toInsert.push({
        user_id: user.id,
        bet_type: "total_goals_match",
        bet_category: "match",
        match_id: m.id,
        bet_value: { count: pick(GOALS_POOL) },
        points_wager: 50,
      });
    }
  }

  if (toInsert.length === 0) {
    return { ok: true, count: 0, message: "Du har redan gissat på alla öppna matcher!" };
  }

  const { error } = await supabase.from("bets").insert(toInsert);
  if (error) {
    return { ok: false, count: 0, message: `Fel: ${error.message}` };
  }

  const matchCount = Math.round(toInsert.length / 2);
  return {
    ok: true,
    count: matchCount,
    message: `✅ Slumpade gissningar på ${matchCount} matcher — bra lycka med det beslutet 😄`,
  };
}
