/**
 * Seeds mock bets for the first user in the database, against mock tournament
 * matches from seed-mock-tournament.ts.
 *
 * Mix of correct / wrong / future (Väntande) bets so the full status flow
 * can be verified end-to-end.
 *
 * Run order:
 *   1. npm run seed:mock    (inserts mock matches)
 *   2. npm run seed:bets    (this script — inserts mock bets)
 *   3. npm run score:bets   (evaluates finished-match bets)
 *   4. npm run verify:sim   (prints DB state to confirm results)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MATCH = (n: number) =>
  `00000000-0000-0000-0001-${String(n).padStart(12, "0")}`;

// Mock match results (from seed-mock-tournament.ts):
// 1:  Argentina 2-1 Frankrike   → home win
// 2:  Spanien 3-2 Tyskland      → home win
// 3:  Brasilien 1-1 England     → draw
// 4:  USA 2-0 Marocko           → home win
// 7:  Mexiko 1-3 Colombia       → away win
// 9:  Frankrike 1-2 Spanien     → away win
// 11: Argentina vs Brasilien    → scheduled (future)
// 15: Frankrike vs Brasilien    → scheduled (future)
// 17: Sverige 2-1 Frankrike     → QF, Sverige wins
// 18: Argentina 1-2 Sverige     → SF, Sverige wins
// 19: Sverige 3-1 Spanien       → Final, Sverige wins (champion!)

async function main() {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username")
    .limit(1);

  if (!profiles?.length) {
    console.error("❌ No profiles found — create an account first, then run this script.");
    process.exit(1);
  }

  const { user_id, username } = profiles[0];
  console.log(`👤 Seeding bets for: ${username} (${user_id})`);

  // Clear old mock bets
  const mockIds = Array.from({ length: 20 }, (_, i) => MATCH(i + 1));
  await supabase.from("bets").delete().eq("user_id", user_id).in("match_id", mockIds);
  await supabase.from("bets").delete().eq("user_id", user_id).eq("bet_category", "turnering");
  await supabase.from("bets").delete().eq("user_id", user_id).eq("bet_category", "kaos");
  console.log("🗑️  Cleared existing mock bets.");

  const NOW = new Date().toISOString();

  // ── Match bets ────────────────────────────────────────────────────────────
  const matchBets = [
    // Match 1 (Argentina 2-1 Frankrike) — CORRECT
    { match_id: MATCH(1), bet_type: "match_result",  bet_value: { result: "home" },   points_wager: 10, locked_at: NOW  },
    { match_id: MATCH(1), bet_type: "exact_score",   bet_value: { home: 2, away: 1 }, points_wager: 50, locked_at: NOW  },
    { match_id: MATCH(1), bet_type: "red_card_shown",bet_value: { answer: false },     points_wager: 15, locked_at: NOW  },

    // Match 2 (Spanien 3-2 Tyskland) — WRONG
    { match_id: MATCH(2), bet_type: "match_result",  bet_value: { result: "away" },   points_wager: 10, locked_at: NOW  },
    { match_id: MATCH(2), bet_type: "exact_score",   bet_value: { home: 1, away: 0 }, points_wager: 50, locked_at: NOW  },

    // Match 3 (Brasilien 1-1 England) — CORRECT draw
    { match_id: MATCH(3), bet_type: "match_result",  bet_value: { result: "draw" },   points_wager: 10, locked_at: NOW  },
    { match_id: MATCH(3), bet_type: "red_card_shown",bet_value: { answer: false },     points_wager: 15, locked_at: NOW  },

    // Match 4 (USA 2-0 Marocko) — WRONG
    { match_id: MATCH(4), bet_type: "match_result",  bet_value: { result: "draw" },   points_wager: 10, locked_at: NOW  },
    { match_id: MATCH(4), bet_type: "red_card_shown",bet_value: { answer: true },      points_wager: 15, locked_at: NOW  },

    // Match 7 (Mexiko 1-3 Colombia) — CORRECT away win
    { match_id: MATCH(7), bet_type: "match_result",  bet_value: { result: "away" },   points_wager: 10, locked_at: NOW  },

    // Match 9 (Frankrike 1-2 Spanien) — CORRECT away win
    { match_id: MATCH(9), bet_type: "match_result",  bet_value: { result: "away" },   points_wager: 10, locked_at: NOW  },

    // Future matches — should stay VÄNTANDE after scoring
    { match_id: MATCH(11), bet_type: "match_result", bet_value: { result: "home" },   points_wager: 10, locked_at: null },
    { match_id: MATCH(15), bet_type: "match_result", bet_value: { result: "home" },   points_wager: 10, locked_at: null },
    { match_id: MATCH(18), bet_type: "match_result", bet_value: { result: "away" },   points_wager: 10, locked_at: null },

    // yellow_cards bets — test the new scoring pipeline
    // Match 1 actual: 3 yellow cards → count: 3 = EXACT (75p)
    { match_id: MATCH(1), bet_type: "yellow_cards", bet_value: { count: 3 }, points_wager: 75, locked_at: NOW },
    // Match 2 actual: 5 yellow cards → count: 8 = off by 3 (0p)
    { match_id: MATCH(2), bet_type: "yellow_cards", bet_value: { count: 8 }, points_wager: 75, locked_at: NOW },
    // Match 3 actual: 4 yellow cards → count: 5 = ±1 (40p)
    { match_id: MATCH(3), bet_type: "yellow_cards", bet_value: { count: 5 }, points_wager: 75, locked_at: NOW },
    // Match 4 actual: 2 yellow cards → count: 2 = EXACT (75p)
    { match_id: MATCH(4), bet_type: "yellow_cards", bet_value: { count: 2 }, points_wager: 75, locked_at: NOW },
  ].map((b) => ({
    user_id,
    bet_category: "match" as const,
    match_id: b.match_id,
    bet_type: b.bet_type,
    bet_value: b.bet_value,
    points_wager: b.points_wager,
    locked_at: b.locked_at,
    is_correct: null,
    points_awarded: null,
  }));

  const { error: mErr } = await supabase.from("bets").insert(matchBets);
  if (mErr) { console.error("Match bets failed:", mErr.message); process.exit(1); }

  // ── Turnering bets (locked June 11, not yet scored → all Väntande) ────────
  const turneringBets = [
    { bet_type: "vm_winner",      bet_value: { team: "Sverige" },                      points_wager: 5000 },
    { bet_type: "finalists",      bet_value: { team1: "Sverige", team2: "Spanien" },   points_wager: 3000 },
    { bet_type: "top_scorer",     bet_value: { player: "Kylian Mbappé" },              points_wager: 4000 },
    { bet_type: "total_goals",    bet_value: { goals: 160 },                           points_wager: 2000 },
    { bet_type: "death_group",    bet_value: { group: "B" },                           points_wager: 1500 },
    { bet_type: "most_red_cards", bet_value: { team: "Colombia" },                     points_wager: 1000 },
  ].map((b) => ({
    user_id,
    bet_category: "turnering" as const,
    match_id: null,
    bet_type: b.bet_type,
    bet_value: b.bet_value,
    points_wager: b.points_wager,
    locked_at: null,
    is_correct: null,
    points_awarded: null,
  }));

  const { error: tErr } = await supabase.from("bets").insert(turneringBets);
  if (tErr) console.warn("Turnering bets error:", tErr.message);

  // ── Kaos bets (locked June 11, not yet scored → all Väntande) ─────────────
  const kaosBets = [
    { bet_type: "goalkeeper_goal",    bet_value: { answer: false } },
    { bet_type: "coach_sent_off",     bet_value: { answer: true  } },
    { bet_type: "comeback_win",       bet_value: { answer: false } },
    { bet_type: "final_penalty_miss", bet_value: { answer: true  } },
    { bet_type: "sweden_final",       bet_value: { answer: false } },
    { bet_type: "knockout_hattrick",  bet_value: { answer: true  } },
  ].map((b) => ({
    user_id,
    bet_category: "kaos" as const,
    match_id: null,
    bet_type: b.bet_type,
    bet_value: b.bet_value,
    points_wager: 10000,
    locked_at: null,
    is_correct: null,
    points_awarded: null,
  }));

  const { error: kErr } = await supabase.from("bets").insert(kaosBets);
  if (kErr) console.warn("Kaos bets error:", kErr.message);

  console.log(`\n✅ Seeded ${matchBets.length} match + ${turneringBets.length} turnering + ${kaosBets.length} kaos bets`);
  console.log("\nExpected after npm run score:bets:");
  console.log("  ✓ Match 1 match_result (home)       → Intjänad  10p");
  console.log("  ✓ Match 1 exact_score (2-1)          → Intjänad  50p");
  console.log("  ✓ Match 1 red_card_shown (false)     → Intjänad  15p  (red_card_count=0)");
  console.log("  ✓ Match 1 yellow_cards (count=3)     → Intjänad  75p  EXACT (actual=3)");
  console.log("  ✗ Match 2 match_result (away)        → Fel        0p");
  console.log("  ✗ Match 2 exact_score (1-0)          → Fel        0p");
  console.log("  ✗ Match 2 yellow_cards (count=8)     → Fel        0p  off by 3 (actual=5)");
  console.log("  ✓ Match 3 match_result (draw)        → Intjänad  10p");
  console.log("  ✓ Match 3 red_card_shown (false)     → Intjänad  15p  (red_card_count=0)");
  console.log("  ~ Match 3 yellow_cards (count=5)     → Delvis    40p  ±1 (actual=4)");
  console.log("  ✗ Match 4 match_result (draw)        → Fel        0p");
  console.log("  ✗ Match 4 red_card_shown (true)      → Fel        0p  (no red card)");
  console.log("  ✓ Match 4 yellow_cards (count=2)     → Intjänad  75p  EXACT (actual=2)");
  console.log("  ✓ Match 7 match_result (away)        → Intjänad  10p");
  console.log("  ✓ Match 9 match_result (away)        → Intjänad  10p");
  console.log("  ~ Matches 11, 15, 18                 → Väntande  (future, unscored)");
  console.log("  ~ All turnering + kaos bets          → Väntande  (scored manually at end)");
  console.log("  (vm_winner=Sverige, finalists=Sverige+Spanien — ready to test tournament scoring)");
  console.log("\nNow run: npm run score:bets");
}

main();
