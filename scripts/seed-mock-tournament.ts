/**
 * Seed mock WC 2026 tournament data for local simulation.
 * Run: npx tsx scripts/seed-mock-tournament.ts
 *
 * Creates 20 matches across all tournament phases with realistic dates.
 * Finished matches have scores so the dashboard shows results + scoring works.
 * Use /dev in the browser to fast-forward to different phases.
 *
 * Re-running clears all mock matches first (safe to run multiple times).
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fixed UUIDs so re-runs are idempotent
const MOCK_MATCHES = [
  // ── Group stage (June 12–27) ────────────────────────────────────────────
  {
    id: "00000000-0000-0000-0001-000000000001", external_id: 900001,
    home_team: "Argentina",   away_team: "Frankrike",
    kickoff_at: "2026-06-12T18:00:00Z", stage: "group_stage", group_name: "A",
    status: "finished", home_score: 2, away_score: 1,
    first_scorer: "Lautaro Martínez", red_card_count: 0, yellow_card_count: 3,
  },
  {
    id: "00000000-0000-0000-0001-000000000002", external_id: 900002,
    home_team: "Spanien",     away_team: "Tyskland",
    kickoff_at: "2026-06-12T21:00:00Z", stage: "group_stage", group_name: "B",
    status: "finished", home_score: 3, away_score: 2,
    first_scorer: "Lamine Yamal", red_card_count: 1, yellow_card_count: 5,
  },
  {
    id: "00000000-0000-0000-0001-000000000003", external_id: 900003,
    home_team: "Brasilien",   away_team: "England",
    kickoff_at: "2026-06-13T18:00:00Z", stage: "group_stage", group_name: "C",
    status: "finished", home_score: 1, away_score: 1,
    first_scorer: "Vinicius Jr.", red_card_count: 0, yellow_card_count: 4,
  },
  {
    id: "00000000-0000-0000-0001-000000000004", external_id: 900004,
    home_team: "USA",          away_team: "Marocko",
    kickoff_at: "2026-06-13T21:00:00Z", stage: "group_stage", group_name: "D",
    status: "finished", home_score: 2, away_score: 0,
    first_scorer: "Christian Pulisic", red_card_count: 0, yellow_card_count: 2,
  },
  {
    id: "00000000-0000-0000-0001-000000000005", external_id: 900005,
    home_team: "Portugal",    away_team: "Kanada",
    kickoff_at: "2026-06-14T18:00:00Z", stage: "group_stage", group_name: "E",
    status: "finished", home_score: 4, away_score: 0,
    first_scorer: "Cristiano Ronaldo", red_card_count: 0, yellow_card_count: 1,
  },
  {
    id: "00000000-0000-0000-0001-000000000006", external_id: 900006,
    home_team: "Nederländerna", away_team: "Japan",
    kickoff_at: "2026-06-14T21:00:00Z", stage: "group_stage", group_name: "F",
    status: "finished", home_score: 2, away_score: 2,
    first_scorer: "Cody Gakpo", red_card_count: 0, yellow_card_count: 4,
  },
  {
    id: "00000000-0000-0000-0001-000000000007", external_id: 900007,
    home_team: "Mexiko",      away_team: "Colombia",
    kickoff_at: "2026-06-15T18:00:00Z", stage: "group_stage", group_name: "G",
    status: "finished", home_score: 1, away_score: 3,
    first_scorer: "James Rodríguez", red_card_count: 1, yellow_card_count: 3,
  },
  {
    id: "00000000-0000-0000-0001-000000000008", external_id: 900008,
    home_team: "Uruguay",     away_team: "Senegal",
    kickoff_at: "2026-06-15T21:00:00Z", stage: "group_stage", group_name: "H",
    status: "finished", home_score: 2, away_score: 1,
    first_scorer: "Darwin Núñez", red_card_count: 0, yellow_card_count: 2,
  },
  // Second round of group stage
  {
    id: "00000000-0000-0000-0001-000000000009", external_id: 900009,
    home_team: "Frankrike",   away_team: "Spanien",
    kickoff_at: "2026-06-19T18:00:00Z", stage: "group_stage", group_name: "A",
    status: "finished", home_score: 1, away_score: 2,
    first_scorer: "Kylian Mbappé", red_card_count: 0, yellow_card_count: 3,
  },
  {
    id: "00000000-0000-0000-0001-000000000010", external_id: 900010,
    home_team: "England",     away_team: "Portugal",
    kickoff_at: "2026-06-19T21:00:00Z", stage: "group_stage", group_name: "C",
    status: "finished", home_score: 0, away_score: 1,
    first_scorer: "Cristiano Ronaldo", red_card_count: 0, yellow_card_count: 2,
  },
  {
    id: "00000000-0000-0000-0001-000000000011", external_id: 900011,
    home_team: "Argentina",   away_team: "Brasilien",
    kickoff_at: "2026-06-23T21:00:00Z", stage: "group_stage", group_name: "A",
    status: "scheduled", home_score: null, away_score: null,
    first_scorer: null, red_card_count: null, yellow_card_count: null,
  },
  {
    id: "00000000-0000-0000-0001-000000000012", external_id: 900012,
    home_team: "Tyskland",    away_team: "USA",
    kickoff_at: "2026-06-24T18:00:00Z", stage: "group_stage", group_name: "B",
    status: "scheduled", home_score: null, away_score: null,
    first_scorer: null, red_card_count: null, yellow_card_count: null,
  },
  // ── Round of 16 (June 29 – July 2) ─────────────────────────────────────
  {
    id: "00000000-0000-0000-0001-000000000013", external_id: 900013,
    home_team: "Spanien",     away_team: "Colombia",
    kickoff_at: "2026-06-29T18:00:00Z", stage: "round_of_16", group_name: null,
    status: "finished", home_score: 2, away_score: 0,
    first_scorer: "Álvaro Morata", red_card_count: 1, yellow_card_count: 4,
  },
  {
    id: "00000000-0000-0000-0001-000000000014", external_id: 900014,
    home_team: "Argentina",   away_team: "Portugal",
    kickoff_at: "2026-06-29T21:00:00Z", stage: "round_of_16", group_name: null,
    status: "finished", home_score: 3, away_score: 2,
    first_scorer: "Julián Álvarez", red_card_count: 0, yellow_card_count: 5,
  },
  {
    id: "00000000-0000-0000-0001-000000000015", external_id: 900015,
    home_team: "Frankrike",   away_team: "Brasilien",
    kickoff_at: "2026-07-01T21:00:00Z", stage: "round_of_16", group_name: null,
    status: "scheduled", home_score: null, away_score: null,
    first_scorer: null, red_card_count: null, yellow_card_count: null,
  },
  // ── Quarter-finals (July 4–5) ───────────────────────────────────────────
  {
    id: "00000000-0000-0000-0001-000000000016", external_id: 900016,
    home_team: "Spanien",     away_team: "Argentina",
    kickoff_at: "2026-07-04T20:00:00Z", stage: "quarter_final", group_name: null,
    status: "finished", home_score: 1, away_score: 2,
    first_scorer: "Lautaro Martínez", red_card_count: 0, yellow_card_count: 2,
  },
  {
    id: "00000000-0000-0000-0001-000000000017", external_id: 900017,
    home_team: "Sverige",     away_team: "Frankrike",
    kickoff_at: "2026-07-05T20:00:00Z", stage: "quarter_final", group_name: null,
    status: "finished", home_score: 2, away_score: 1,
    first_scorer: "Victor Nilsson Lindelöf", red_card_count: 0, yellow_card_count: 2,
  },
  // ── Semi-finals (July 8–9) ──────────────────────────────────────────────
  {
    id: "00000000-0000-0000-0001-000000000018", external_id: 900018,
    home_team: "Argentina",   away_team: "Sverige",
    kickoff_at: "2026-07-08T19:00:00Z", stage: "semi_final", group_name: null,
    status: "finished", home_score: 1, away_score: 2,
    first_scorer: "Lautaro Martínez", red_card_count: 0, yellow_card_count: 2,
  },
  // ── Final (July 19) ─────────────────────────────────────────────────────
  {
    id: "00000000-0000-0000-0001-000000000019", external_id: 900019,
    home_team: "Sverige",     away_team: "Spanien",
    kickoff_at: "2026-07-19T19:00:00Z", stage: "final", group_name: null,
    status: "finished", home_score: 3, away_score: 1,
    first_scorer: "Alexander Isak", red_card_count: 0, yellow_card_count: 2,
  },
  // ── Third-place play-off (July 18) ──────────────────────────────────────
  {
    id: "00000000-0000-0000-0001-000000000020", external_id: 900020,
    home_team: "Argentina",   away_team: "Frankrike",
    kickoff_at: "2026-07-18T19:00:00Z", stage: "third_place", group_name: null,
    status: "finished", home_score: 2, away_score: 1,
    first_scorer: "Julián Álvarez", red_card_count: 0, yellow_card_count: 2,
  },
] as const;

async function main() {
  console.log("🗑️  Clearing existing mock matches...");
  const ids = MOCK_MATCHES.map((m) => m.id);
  const { error: delErr } = await supabase.from("matches").delete().in("id", ids);
  if (delErr) { console.error("Delete failed:", delErr.message); process.exit(1); }

  console.log("⚽ Inserting 20 mock matches...");
  const { error: insErr } = await supabase.from("matches").insert(MOCK_MATCHES as unknown[]);
  if (insErr) { console.error("Insert failed:", insErr.message); process.exit(1); }

  console.log("✅ Done! Mock tournament data is ready.");
  console.log("   → Open http://localhost:3000/dev to time-travel through phases.");
  console.log("   → Run 'npm run score:bets' after to score any existing bets.");
}

main();
