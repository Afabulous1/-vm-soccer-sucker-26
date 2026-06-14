// scripts/score-bets.ts
import { supabase } from "./_client.js";

interface FinishedMatch {
  id: string;
  external_id: number;
  home_score: number;
  away_score: number;
  first_scorer: string | null;
}

interface UnevaluatedBet {
  id: string;
  user_id: string;
  match_id: string;
  bet_type: string;
  bet_value: any;
  points_wager: number;
  locked_at: string | null;
}

async function main() {
  console.log("=== score-bets: starting ===");

  // 1. Find all finished tournament matches
  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select("id, external_id, home_score, away_score, first_scorer")
    .eq("status", "finished");

  if (matchErr) {
    console.error("Failed to fetch finished matches:", matchErr.message);
    process.exit(1);
  }

  const finishedMatches = (matches ?? []) as unknown as FinishedMatch[];
  await runScoring(finishedMatches);
}

async function runScoring(finishedMatches: FinishedMatch[]) {
  console.log(`Found ${finishedMatches.length} finished match(es) in database.`);
  let totalScored = 0;

  for (const match of finishedMatches) {
    if (match.home_score === null || match.away_score === null) continue;

    // 2. Fetch ALL unevaluated bets for this match UUID (unconstrained by enum strings)
    const { data: bets, error: betsErr } = await supabase
      .from("bets")
      .select("id, user_id, match_id, bet_type, bet_value, points_wager, locked_at")
      .eq("match_id", match.id)
      .is("is_correct", null);

    if (betsErr || !bets?.length) continue;

    console.log(`  Match ${match.id} (Ext ID: ${match.external_id}): scoring ${bets.length} bet(s) (${match.home_score}–${match.away_score})`);

    for (const bet of (bets as unknown as UnevaluatedBet[])) {
      const result = scoreBet(bet, match);

      const { error: updateErr } = await supabase
        .from("bets")
        .update({
          is_correct: result.correct,
          points_awarded: result.pointsAwarded,
          locked_at: bet.locked_at ?? new Date().toISOString(),
        })
        .eq("id", bet.id);

      if (!updateErr) {
        totalScored++;
      }
    }
  }

  console.log(`Scored ${totalScored} bet(s) total.`);
  await rebuildLeaderboard();
  console.log("=== score-bets: done ===");
}

function scoreBet(bet: UnevaluatedBet, match: FinishedMatch): { correct: boolean; pointsAwarded: number } {
  const { bet_type, bet_value } = bet;
  const { home_score, away_score } = match;

  switch (bet_type) {
    case "match_result": {
      let actualOutcome = "draw";
      if (home_score > away_score) actualOutcome = "home";
      if (away_score > home_score) actualOutcome = "away";

      const guessedOutcome = typeof bet_value === "object" && bet_value !== null
        ? bet_value.result ?? bet_value.value
        : bet_value;

      const isCorrect = String(guessedOutcome).toLowerCase() === actualOutcome;
      // Enforce custom compensation logic rule: 100 points for team win outcome
      return { correct: isCorrect, pointsAwarded: isCorrect ? 100 : 0 };
    }

    case "total_goals_match": {
      const actualTotalGoals = home_score + away_score;
      const guessedGoals = typeof bet_value === "object" && bet_value !== null
        ? bet_value.goals ?? bet_value.value ?? bet_value.answer
        : bet_value;

      const isCorrect = Number(guessedGoals) === actualTotalGoals;
      // Enforce custom compensation logic rule: 50 points for correct total goal amounts
      return { correct: isCorrect, pointsAwarded: isCorrect ? 50 : 0 };
    }

    default:
      return { correct: false, pointsAwarded: 0 };
  }
}

async function rebuildLeaderboard() {
  console.log("Rebuilding leaderboard_cache...");

  const { data: allBets, error: betsErr } = await supabase
    .from("bets")
    .select("user_id, bet_type, bet_category, is_correct, points_awarded, locked_at")
    .not("points_awarded", "is", null);

  if (betsErr) return;

  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_key");

  if (profilesErr) return;

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
  const byUser = new Map<string, any[]>();

  for (const b of (allBets ?? [])) {
    const arr = byUser.get(b.user_id) ?? [];
    arr.push(b);
    byUser.set(b.user_id, arr);
  }

  const rows: any[] = [];
  for (const [userId, userBets] of byUser) {
    const profile = profileMap.get(userId);
    if (!profile) continue;

    const points_total = userBets.reduce((sum, b) => sum + (b.points_awarded ?? 0), 0);

    rows.push({
      user_id: userId,
      username: profile.username,
      avatar_key: profile.avatar_key,
      points_total,
      weekly_points: points_total,
      current_streak: 0,
      rank: 0,
    });
  }

  rows.sort((a, b) => b.points_total - a.points_total);
  rows.forEach((r, i) => { r.rank = i + 1; });

  if (rows.length === 0) return;

  // Overwrite leaderboard cache securely
  await supabase.from("leaderboard_cache").upsert(
    rows.map((r) => ({ ...r, badges: [], updated_at: new Date().toISOString() })),
    { onConflict: "user_id" }
  );

  for (const row of rows) {
    await supabase.from("profiles").update({ points_total: row.points_total }).eq("user_id", row.user_id);
  }
}