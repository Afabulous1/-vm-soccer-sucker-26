/**
 * Scores turnering and kaos bets against final tournament outcomes.
 * Edit OUTCOMES below to match real (or mock) tournament results.
 * Run: npx tsx scripts/score-tournament-bets.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Edit these to match the actual tournament results ──────────────────────
const OUTCOMES = {
  // Turnering bets
  vm_winner:      "Sverige",
  finalists:      ["Sverige", "Spanien"] as string[],
  top_scorer:     "Erling Haaland",
  total_goals:    163,
  death_group:    "B",
  most_red_cards: "Colombia",
  // Kaos bets (true = happened, false = didn't happen)
  goalkeeper_goal:    false,
  coach_sent_off:     true,
  comeback_win:       false,
  final_penalty_miss: false,
  sweden_final:       true,
  knockout_hattrick:  false,
} as const;

type Outcomes = typeof OUTCOMES;

function scoreTurneringBet(betType: string, betValue: Record<string, unknown>): { correct: boolean; points: number } | null {
  switch (betType) {
    case "vm_winner":
      return { correct: betValue.team === OUTCOMES.vm_winner, points: 5000 };
    case "finalists": {
      const f = OUTCOMES.finalists;
      const t1 = betValue.team1 as string;
      const t2 = betValue.team2 as string;
      const correct = (f.includes(t1) && f.includes(t2));
      return { correct, points: 3000 };
    }
    case "top_scorer":
      return { correct: betValue.player === OUTCOMES.top_scorer, points: 4000 };
    case "total_goals": {
      const guessed = betValue.goals as number;
      const actual = OUTCOMES.total_goals;
      const diff = Math.abs(guessed - actual);
      if (diff === 0) return { correct: true, points: 2000 };
      if (diff <= 2)  return { correct: false, points: 1000 };
      if (diff <= 5)  return { correct: false, points: 500 };
      return { correct: false, points: 0 };
    }
    case "death_group":
      return { correct: betValue.group === OUTCOMES.death_group, points: 1500 };
    case "most_red_cards":
      return { correct: betValue.team === OUTCOMES.most_red_cards, points: 1000 };
    default:
      return null;
  }
}

function scoreKaosBet(betType: string, betValue: Record<string, unknown>): { correct: boolean; points: number } | null {
  const key = betType as keyof Outcomes;
  if (!(key in OUTCOMES)) return null;
  const happened = OUTCOMES[key] as boolean;
  const guessed = betValue.answer === true;
  const correct = guessed === happened;
  return { correct, points: correct ? 10000 : 0 };
}

async function main() {
  console.log("=== score-tournament-bets: starting ===");
  console.log("Outcomes:", OUTCOMES);

  const { data: bets, error } = await supabase
    .from("bets")
    .select("id, user_id, bet_type, bet_category, bet_value, points_wager")
    .in("bet_category", ["turnering", "kaos"])
    .is("is_correct", null);

  if (error) { console.error(error.message); process.exit(1); }
  if (!bets?.length) { console.log("No unscored turnering/kaos bets found."); return; }

  console.log(`\nScoring ${bets.length} bet(s)...`);
  let scored = 0;

  for (const bet of bets) {
    const bv = bet.bet_value as Record<string, unknown>;
    let result: { correct: boolean; points: number } | null = null;

    if (bet.bet_category === "turnering") {
      result = scoreTurneringBet(bet.bet_type, bv);
    } else if (bet.bet_category === "kaos") {
      result = scoreKaosBet(bet.bet_type, bv);
    }

    if (!result) {
      console.log(`  ~ ${bet.bet_type}: no outcome defined, skipping`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("bets")
      .update({
        is_correct: result.correct,
        points_awarded: result.points,
        locked_at: new Date().toISOString(),
      })
      .eq("id", bet.id);

    if (updateErr) {
      console.warn(`  ✗ ${bet.bet_type} (${bet.id}): ${updateErr.message}`);
    } else {
      const icon = result.correct ? "✓" : result.points > 0 ? "~" : "✗";
      console.log(`  ${icon} ${bet.bet_type}: ${result.correct ? "Rätt" : result.points > 0 ? `Delvis (${result.points}p)` : "Fel"} — ${result.points}p`);
      scored++;
    }
  }

  // Rebuild leaderboard + sync profiles
  console.log("\nRebuilding leaderboard...");
  const { data: allBets } = await supabase
    .from("bets")
    .select("user_id, is_correct, points_awarded, locked_at, bet_category, bet_type")
    .not("points_awarded", "is", null);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_key");

  const byUser = new Map<string, typeof allBets>();
  for (const b of allBets ?? []) {
    const arr = byUser.get(b.user_id) ?? [];
    arr.push(b);
    byUser.set(b.user_id, arr);
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const sevenAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const rows = [];

  for (const [userId, userBets] of byUser) {
    const profile = profileMap.get(userId);
    if (!profile) continue;
    const points_total = userBets.reduce((s, b) => s + (b.points_awarded ?? 0), 0);
    const weekly_points = userBets.filter((b) => b.locked_at && b.locked_at >= sevenAgo).reduce((s, b) => s + (b.points_awarded ?? 0), 0);
    const matchResults = userBets.filter((b) => b.bet_category === "match" && b.bet_type === "match_result" && b.is_correct !== null && b.locked_at).sort((a, b) => (b.locked_at as string).localeCompare(a.locked_at as string));
    let current_streak = 0;
    for (const b of matchResults) { if (b.is_correct) current_streak++; else break; }
    rows.push({ user_id: userId, username: profile.username, avatar_key: profile.avatar_key, points_total, weekly_points, current_streak, rank: 0 });
  }

  rows.sort((a, b) => b.points_total - a.points_total);
  rows.forEach((r, i) => { r.rank = i + 1; });

  await supabase.from("leaderboard_cache").upsert(rows.map((r) => ({ ...r, badges: [], updated_at: new Date().toISOString() })), { onConflict: "user_id" });
  for (const r of rows) {
    await supabase.from("profiles").update({ points_total: r.points_total }).eq("user_id", r.user_id);
  }

  console.log(`\n✅ Scored ${scored}/${bets.length} bets. Leaderboard updated.`);
  console.log("=== done ===");
}

main().catch((e) => { console.error(e); process.exit(1); });
