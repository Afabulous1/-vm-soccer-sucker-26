/**
 * Scores all unevaluated match bets for finished matches and rebuilds the
 * leaderboard_cache table.
 *
 * Usage: npm run score:bets
 */
import { supabase } from "./_client.js";
import {
  evalMatchResult,
  evalExactScore,
  evalFirstScorer,
  evalBothTeamsScore,
  evalYellowCards,
} from "../src/lib/scoring.js";
import type { PowerupType } from "../src/types/database.js";

// ---------------------------------------------------------------------------
// Types (minimal, matching DB rows)
// ---------------------------------------------------------------------------

interface FinishedMatch {
  id: string;
  home_score: number;
  away_score: number;
  first_scorer: string | null;
}

interface UnevaluatedBet {
  id: string;
  user_id: string;
  bet_type: string;
  bet_value: unknown;
  points_wager: number;
  power_up_used: PowerupType | null;
  shield_used: PowerupType | null;
  locked_at: string | null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== score-bets: starting ===");

  // 1. Find all finished matches
  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select("id, home_score, away_score, first_scorer")
    .eq("status", "finished");

  if (matchErr) {
    console.error("Failed to fetch finished matches:", matchErr.message);
    process.exit(1);
  }

  const finishedMatches = (matches ?? []) as unknown as FinishedMatch[];
  console.log(`Found ${finishedMatches.length} finished match(es).`);

  let totalScored = 0;

  for (const match of finishedMatches) {
    if (match.home_score === null || match.away_score === null) continue;

    // 2. Find all unevaluated match bets for this match
    const { data: bets, error: betsErr } = await supabase
      .from("bets")
      .select(
        "id, user_id, bet_type, bet_value, points_wager, power_up_used, shield_used, locked_at",
      )
      .eq("match_id", match.id)
      .eq("bet_category", "match")
      .is("is_correct", null);

    if (betsErr) {
      console.warn(`  Match ${match.id}: fetch bets failed: ${betsErr.message}`);
      continue;
    }

    const unevaluated = (bets ?? []) as unknown as UnevaluatedBet[];
    if (!unevaluated.length) continue;

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

  // 3. Rebuild leaderboard_cache
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
      // bonusWager = 400 (flat bonus for exact score)
      return evalExactScore(
        bet_value,
        home_score,
        away_score,
        points_wager,
        400,
        power_up_used,
        shield_used,
      );

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

    case "both_teams_score":
      return evalBothTeamsScore(
        bet_value,
        home_score,
        away_score,
        points_wager,
        power_up_used,
        shield_used,
      );

    case "yellow_cards":
      // Note: yellow_cards count is stored on the match; we'd need it here.
      // The matches table doesn't have a yellow_cards column in the current
      // schema, so we skip evaluation and mark as pending (null).
      // When the schema is extended, replace 0 with match.yellow_cards.
      // For now, return a "not yet scorable" marker — we'll skip these.
      console.warn(`    Bet ${bet.id}: yellow_cards — match lacks card data, skipping.`);
      return { correct: false, pointsAwarded: 0 };

    default:
      console.warn(`    Bet ${bet.id}: unknown bet_type '${bet_type}', skipping.`);
      return { correct: false, pointsAwarded: 0 };
  }
}

// ---------------------------------------------------------------------------
// Leaderboard rebuild
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

  // Fetch all evaluated bets
  const { data: allBets, error: betsErr } = await supabase
    .from("bets")
    .select("user_id, bet_type, bet_category, is_correct, points_awarded, locked_at")
    .not("points_awarded", "is", null);

  if (betsErr) {
    console.error("  Failed to fetch bets for leaderboard:", betsErr.message);
    return;
  }

  const bets = (allBets ?? []) as unknown as BetRow[];

  // Fetch all profiles
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

  // Group bets by user
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

    // points_total: sum all awarded
    const points_total = userBets.reduce(
      (sum, b) => sum + (b.points_awarded ?? 0),
      0,
    );

    // weekly_points: bets locked in last 7 days
    const weekly_points = userBets
      .filter((b) => b.locked_at && b.locked_at >= sevenDaysAgo)
      .reduce((sum, b) => sum + (b.points_awarded ?? 0), 0);

    // current_streak: consecutive correct match_result bets, most recent first
    const matchResults = userBets
      .filter(
        (b) =>
          b.bet_category === "match" &&
          b.bet_type === "match_result" &&
          b.is_correct !== null &&
          b.locked_at !== null,
      )
      .sort((a, b) =>
        (b.locked_at as string).localeCompare(a.locked_at as string),
      );

    let current_streak = 0;
    for (const b of matchResults) {
      if (b.is_correct === true) {
        current_streak++;
      } else {
        break;
      }
    }

    rows.push({
      user_id: userId,
      username: profile.username,
      avatar_key: profile.avatar_key,
      points_total,
      weekly_points,
      current_streak,
      rank: 0, // calculated below
    });
  }

  // Assign ranks (sort by points_total DESC)
  rows.sort((a, b) => b.points_total - a.points_total);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  // Upsert leaderboard_cache
  if (rows.length === 0) {
    console.log("  No users with evaluated bets — nothing to upsert.");
    return;
  }

  const { error: upsertErr } = await supabase
    .from("leaderboard_cache")
    .upsert(
      rows.map((r) => ({
        ...r,
        badges: [],
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id" },
    );

  if (upsertErr) {
    console.error("  Leaderboard upsert failed:", upsertErr.message);
  } else {
    console.log(`  Leaderboard updated with ${rows.length} user(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
