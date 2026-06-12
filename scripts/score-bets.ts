/**
 * Scores all unevaluated match bets for finished matches and rebuilds the
 * leaderboard_cache table.
 *
 * Usage: npm run score:bets
 */
import {
  evalExactScore,
  evalFirstScorer,
  evalMatchResult
} from "../src/lib/scoring.js";
import type { PowerupType } from "../src/types/database.js";
import { supabase } from "./_client.js";

// ---------------------------------------------------------------------------
// Types (minimal, matching DB rows)
// ---------------------------------------------------------------------------

interface FinishedMatch {
  id: string;
  external_id: number;
  home_score: number;
  away_score: number;
  first_scorer: string | null;
  red_card_count: number | null;
  yellow_card_count: number | null;
}

interface UnevaluatedBet {
  id: string;
  user_id: string;
  match_id: string;
  bet_type: string;
  bet_value: any;
  points_wager: number;
  power_up_used: PowerupType | null;
  shield_used: PowerupType | null;
  locked_at: string | null;
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== score-bets: starting ===");

  // 1. Find all finished matches
  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select("id, external_id, home_score, away_score, first_scorer, red_card_count, yellow_card_count")
    .eq("status", "finished");

  if (matchErr) {
    if (matchErr.message.includes("first_scorer") || matchErr.message.includes("column")) {
      console.warn("⚠️  Column 'first_scorer' missing — performing fallback execution.\n");

      const { data: matchesFallback, error: fallbackErr } = await supabase
        .from("matches")
        .select("id, external_id, home_score, away_score")
        .eq("status", "finished");

      if (fallbackErr) {
        console.error("Failed to execute fallback matches query:", fallbackErr.message);
        process.exit(1);
      }

      const normalizedFallback = (matchesFallback ?? []).map((m) => ({
        ...m,
        first_scorer: null,
        red_card_count: null,
        yellow_card_count: null
      })) as FinishedMatch[];

      return runScoring(normalizedFallback);
    }

    console.error("Failed to fetch finished matches:", matchErr.message);
    process.exit(1);
  }

  const finishedMatches = (matches ?? []) as unknown as FinishedMatch[];
  return runScoring(finishedMatches);
}

// ---------------------------------------------------------------------------
// Scoring Orchestration Loop
// ---------------------------------------------------------------------------

async function runScoring(finishedMatches: FinishedMatch[]) {
  console.log(`Found ${finishedMatches.length} finished match(es) in database.`);

  let totalScored = 0;

  for (const match of finishedMatches) {
    if (match.home_score === null || match.away_score === null) continue;

    // Find all unevaluated match bets for this specific match UUID
    const { data: bets, error: betsErr } = await supabase
      .from("bets")
      .select("id, user_id, match_id, bet_type, bet_value, points_wager, power_up_used, shield_used, locked_at")
      .eq("match_id", match.id)
      .eq("bet_category", "match")
      .is("is_correct", null);

    if (betsErr) {
      console.warn(`  Match ${match.id}: fetch bets failed: ${betsErr.message}`);
      continue;
    }

    const unevaluated = (bets ?? []) as unknown as UnevaluatedBet[];
    if (!unevaluated.length) {
      console.log(`  Match ${match.id} (Ext ID: ${match.external_id}): No matching open user bets found.`);
      continue;
    }

    console.log(
      `  Match ${match.id}: scoring ${unevaluated.length} bet(s) ` +
      `(${match.home_score}–${match.away_score})`,
    );

    for (const bet of unevaluated) {
      const result = scoreBet(bet, match);

      const { error: updateErr } = await supabase
        .from("bets")
        .update({
          is_correct: result.correct,
          points_awarded: result.pointsAwarded,
          locked_at: bet.locked_at ?? new Date().toISOString(),
        })
        .eq("id", bet.id);

      if (updateErr) {
        console.warn(`    Bet ${bet.id}: update failed: ${updateErr.message}`);
      } else {
        totalScored++;
      }
    }
  }

  console.log(`Scored ${totalScored} bet(s) total.`);
  await rebuildLeaderboard();
  console.log("=== score-bets: done ===");
}

// ---------------------------------------------------------------------------
// Route a bet to the correct evaluator
// ---------------------------------------------------------------------------

function scoreBet(
  bet: UnevaluatedBet,
  match: FinishedMatch,
): { correct: boolean; pointsAwarded: number } {
  const { bet_type, bet_value, points_wager, power_up_used, shield_used } = bet;
  const { home_score, away_score, first_scorer } = match;

  switch (bet_type) {
    case "match_result":
      return evalMatchResult(
        bet_value,
        home_score,
        away_score,
        points_wager,
        power_up_used,
        shield_used,
      );

    case "exact_score":
      return evalExactScore(
        bet_value,
        home_score,
        away_score,
        points_wager,
        400,
        power_up_used,
        shield_used,
      );

    // ALIGNMENT BRIDGE: Evaluates total goals perfectly without drops
    case "total_goals_match": {
      const actualTotalGoals = home_score + away_score;

      // Safe extractions regardless if value is stored as a raw number or wrapped object
      const guessedGoals = typeof bet_value === "object" && bet_value !== null
        ? (bet_value as any).goals ?? (bet_value as any).answer ?? (bet_value as any).value
        : bet_value;

      const isCorrect = Number(guessedGoals) === actualTotalGoals;
      return {
        correct: isCorrect,
        pointsAwarded: isCorrect ? points_wager : 0
      };
    }

    case "first_scorer":
      return evalFirstScorer(
        bet_value,
        first_scorer,
        home_score,
        away_score,
        points_wager,
        power_up_used,
        shield_used,
      );

    default:
      console.warn(`    Bet ${bet.id}: unsupported bet_type '${bet_type}' skipped. Preserving row intact.`);
      return { correct: false, pointsAwarded: 0 };
  }
}

// ---------------------------------------------------------------------------
// Leaderboard Cache Engine & Profile Synchronization
// ---------------------------------------------------------------------------

interface BetRow {
  user_id: string;
  bet_type: string;
  bet_category: string;
  is_correct: boolean | null;
  points_awarded: number | null;
  locked_at: string | null;
}

interface ProfileRow {
  user_id: string;
  username: string;
  avatar_key: string;
}

async function rebuildLeaderboard() {
  console.log("Rebuilding leaderboard_cache...");

  const { data: allBets, error: betsErr } = await supabase
    .from("bets")
    .select("user_id, bet_type, bet_category, is_correct, points_awarded, locked_at")
    .not("points_awarded", "is", null);

  if (betsErr) {
    console.error("  Failed to fetch bets for leaderboard:", betsErr.message);
    return;
  }

  const bets = (allBets ?? []) as unknown as BetRow[];

  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_key");

  if (profilesErr) {
    console.error("  Failed to fetch profiles:", profilesErr.message);
    return;
  }

  const profileMap = new Map<string, ProfileRow>();
  for (const p of profiles ?? []) {
    profileMap.set(p.user_id, p as ProfileRow);
  }

  const byUser = new Map<string, BetRow[]>();
  for (const bet of bets) {
    const arr = byUser.get(bet.user_id) ?? [];
    arr.push(bet);
    byUser.set(bet.user_id, arr);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  interface LeaderboardRow {
    user_id: string;
    username: string;
    avatar_key: string;
    points_total: number;
    weekly_points: number;
    current_streak: number;
    rank: number;
  }

  const rows: LeaderboardRow[] = [];

  for (const [userId, userBets] of byUser) {
    const profile = profileMap.get(userId);
    if (!profile) continue;

    const points_total = userBets.reduce((sum, b) => sum + (b.points_awarded ?? 0), 0);
    const weekly_points = userBets
      .filter((b) => b.locked_at && b.locked_at >= sevenDaysAgo)
      .reduce((sum, b) => sum + (b.points_awarded ?? 0), 0);

    const matchResults = userBets
      .filter((b) => b.bet_category === "match" && b.bet_type === "match_result" && b.is_correct !== null && b.locked_at !== null)
      .sort((a, b) => (b.locked_at as string).localeCompare(b.locked_at as string));

    let current_streak = 0;
    for (const b of matchResults) {
      if (b.is_correct === true) current_streak++;
      else break;
    }

    rows.push({
      user_id: userId,
      username: profile.username,
      avatar_key: profile.avatar_key,
      points_total,
      weekly_points,
      current_streak,
      rank: 0,
    });
  }

  rows.sort((a, b) => b.points_total - a.points_total);
  rows.forEach((r, i) => { r.rank = i + 1; });

  if (rows.length === 0) return;

  await supabase.from("leaderboard_cache").upsert(
    rows.map((r) => ({ ...r, badges: [], updated_at: new Date().toISOString() })),
    { onConflict: "user_id" }
  );

  for (const row of rows) {
    await supabase.from("profiles").update({ points_total: row.points_total }).eq("user_id", row.user_id);
  }
}

main().catch((err) => {
  console.error("Fatal processing exception:", err);
  process.exit(1);
});