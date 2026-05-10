/**
 * Prints the current state of all mock bets in the database.
 * Run after score:bets to verify Väntande / Intjänad / Fel status.
 *
 * Usage: npm run verify:sim
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

const MATCH_LABELS: Record<string, string> = {
  [MATCH(1)]:  "Argentina 2-1 Frankrike   (home win)",
  [MATCH(2)]:  "Spanien 3-2 Tyskland      (home win)",
  [MATCH(3)]:  "Brasilien 1-1 England     (draw)",
  [MATCH(4)]:  "USA 2-0 Marocko           (home win)",
  [MATCH(7)]:  "Mexiko 1-3 Colombia       (away win)",
  [MATCH(9)]:  "Frankrike 1-2 Spanien     (away win)",
  [MATCH(11)]: "Argentina vs Brasilien    (scheduled)",
  [MATCH(15)]: "Frankrike vs Brasilien    (scheduled)",
  [MATCH(18)]: "Argentina vs Frankrike    (semifinal, scheduled)",
};

function statusLabel(is_correct: boolean | null, points_awarded: number | null): string {
  if (points_awarded === null) return "⏳ Väntande";
  if (is_correct)              return `✅ Intjänad  +${points_awarded}p`;
  return                              `❌ Fel        0p`;
}

async function main() {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username")
    .limit(1);

  if (!profiles?.length) { console.error("No profiles found."); process.exit(1); }
  const { user_id, username } = profiles[0];

  const { data: bets } = await supabase
    .from("bets")
    .select("bet_type, bet_category, match_id, bet_value, points_wager, is_correct, points_awarded")
    .eq("user_id", user_id)
    .order("bet_category")
    .order("match_id");

  if (!bets?.length) { console.log("No bets found for this user."); return; }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  Simulation results for: ${username}`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  // Match bets
  const matchBets = bets.filter((b) => b.bet_category === "match");
  if (matchBets.length) {
    console.log("── MATCHGISSNINGAR ─────────────────────────────────────");
    let lastMatch = "";
    for (const b of matchBets) {
      const matchLabel = MATCH_LABELS[b.match_id] ?? b.match_id;
      if (matchLabel !== lastMatch) {
        console.log(`\n  ${matchLabel}`);
        lastMatch = matchLabel;
      }
      const valStr = JSON.stringify(b.bet_value).replace(/[{}"]/g, "").replace(/:/g, ": ");
      const status = statusLabel(b.is_correct, b.points_awarded);
      console.log(`    ${b.bet_type.padEnd(22)} ${valStr.padEnd(20)} ${status}`);
    }
  }

  // Turnering bets
  const turneringBets = bets.filter((b) => b.bet_category === "turnering");
  if (turneringBets.length) {
    console.log("\n── TURNERINGSGISSNINGAR ─────────────────────────────────");
    for (const b of turneringBets) {
      const valStr = JSON.stringify(b.bet_value).replace(/[{}"]/g, "").replace(/:/g, ": ");
      const status = statusLabel(b.is_correct, b.points_awarded);
      console.log(`  ${b.bet_type.padEnd(22)} ${valStr.padEnd(28)} ${status}`);
    }
  }

  // Kaos bets
  const kaosBets = bets.filter((b) => b.bet_category === "kaos");
  if (kaosBets.length) {
    console.log("\n── KAOSGISSNINGAR ───────────────────────────────────────");
    for (const b of kaosBets) {
      const valStr = JSON.stringify(b.bet_value).replace(/[{}"]/g, "").replace(/:/g, ": ");
      const status = statusLabel(b.is_correct, b.points_awarded);
      console.log(`  ${b.bet_type.padEnd(22)} ${valStr.padEnd(28)} ${status}`);
    }
  }

  // Summary
  const scored   = bets.filter((b) => b.points_awarded !== null);
  const pending  = bets.filter((b) => b.points_awarded === null);
  const correct  = scored.filter((b) => b.is_correct);
  const wrong    = scored.filter((b) => !b.is_correct);
  const total    = scored.reduce((s, b) => s + (b.points_awarded ?? 0), 0);

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  Totalt poäng: ${total}p`);
  console.log(`  Rätt: ${correct.length}  Fel: ${wrong.length}  Väntande: ${pending.length}`);
  console.log(`═══════════════════════════════════════════════════════\n`);
}

main();
