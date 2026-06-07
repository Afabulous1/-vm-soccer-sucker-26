"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { WC_GROUPS_DATA } from "@/lib/teams";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Joker ─────────────────────────────────────────────────────────────────────

export async function grantJoker(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Inte inloggad" };

  const admin = getAdmin();
  const { error } = await admin.from("user_powerups").upsert(
    { user_id: user.id, powerup_type: "joker", quantity: 1, updated_at: new Date().toISOString() },
    { onConflict: "user_id,powerup_type" }
  );
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "🃏 Joker tillagd! Gå till dashboarden." };
}

// ── Track B sabotage powers ───────────────────────────────────────────────────

export async function grantTrackBPowers(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Inte inloggad" };

  const admin = getAdmin();
  const powers = ["sabotage", "punto_bandito"] as const;
  const errors: string[] = [];

  for (const pt of powers) {
    const { error } = await admin.from("user_powerups").upsert(
      { user_id: user.id, powerup_type: pt, quantity: 2, updated_at: new Date().toISOString() },
      { onConflict: "user_id,powerup_type" }
    );
    if (error) errors.push(`${pt}: ${error.message}`);
  }

  if (errors.length) return { ok: false, message: errors.join("\n") };
  return { ok: true, message: "🧊🦊 Sabotage + Punto Bandito tillagda (×2 vardera)!" };
}

export async function refillAllPowers(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Inte inloggad" };

  const admin = getAdmin();
  const powers = [
    { type: "double_or_nothing", qty: 3 },
    { type: "taktikgeniet",      qty: 3 },
    { type: "sexpoangaren",      qty: 3 },
    { type: "forsakringen",      qty: 2 },
    { type: "tidsmaskinen",      qty: 2 },
    { type: "joker",             qty: 1 },
    { type: "sabotage",          qty: 2 },
    { type: "punto_bandito",     qty: 2 },
  ];

  for (const p of powers) {
    await admin.from("user_powerups").upsert(
      { user_id: user.id, powerup_type: p.type, quantity: p.qty, updated_at: new Date().toISOString() },
      { onConflict: "user_id,powerup_type" }
    );
  }
  return { ok: true, message: "⚡ Alla krafter påfyllda till max!" };
}

// ── Demo match seeding ────────────────────────────────────────────────────────

// Only base columns from migration 001 — no first_scorer/yellow_card_count
// to avoid PostgREST schema cache misses on freshly-unpaused projects.
// Run seedMatchDetails() separately once the schema cache is warm.
const DEMO_MATCHES = [
  // Group stage — finished
  { external_id: 9001, home_team: "Brasilien",  away_team: "Marocko",    kickoff_at: "2026-06-12T15:00:00Z", stage: "group_stage",   group_name: "C", status: "finished",  home_score: 3, away_score: 1 },
  { external_id: 9002, home_team: "Frankrike",  away_team: "Norge",      kickoff_at: "2026-06-12T18:00:00Z", stage: "group_stage",   group_name: "I", status: "finished",  home_score: 2, away_score: 2 },
  { external_id: 9003, home_team: "England",    away_team: "Panama",     kickoff_at: "2026-06-13T15:00:00Z", stage: "group_stage",   group_name: "L", status: "finished",  home_score: 4, away_score: 0 },
  { external_id: 9004, home_team: "Argentina",  away_team: "Algeriet",   kickoff_at: "2026-06-13T18:00:00Z", stage: "group_stage",   group_name: "J", status: "finished",  home_score: 2, away_score: 0 },
  { external_id: 9005, home_team: "Spanien",    away_team: "Kap Verde",  kickoff_at: "2026-06-14T15:00:00Z", stage: "group_stage",   group_name: "H", status: "finished",  home_score: 3, away_score: 0 },
  { external_id: 9006, home_team: "Portugal",   away_team: "Uzbekistan", kickoff_at: "2026-06-14T18:00:00Z", stage: "group_stage",   group_name: "K", status: "finished",  home_score: 5, away_score: 1 },
  // Group stage — upcoming
  { external_id: 9007, home_team: "Tyskland",   away_team: "Curaçao",    kickoff_at: "2026-06-17T18:00:00Z", stage: "group_stage",   group_name: "E", status: "scheduled", home_score: null, away_score: null },
  { external_id: 9008, home_team: "Sverige",    away_team: "Tunisien",   kickoff_at: "2026-06-18T15:00:00Z", stage: "group_stage",   group_name: "F", status: "scheduled", home_score: null, away_score: null },
  // Round of 16
  { external_id: 9010, home_team: "Brasilien",  away_team: "England",    kickoff_at: "2026-07-01T19:00:00Z", stage: "round_of_16",   group_name: null, status: "finished",  home_score: 1, away_score: 2 },
  { external_id: 9011, home_team: "Frankrike",  away_team: "Argentina",  kickoff_at: "2026-07-02T19:00:00Z", stage: "round_of_16",   group_name: null, status: "finished",  home_score: 3, away_score: 3 },
  // Quarter finals
  { external_id: 9012, home_team: "England",    away_team: "Portugal",   kickoff_at: "2026-07-04T19:00:00Z", stage: "quarter_final", group_name: null, status: "finished",  home_score: 2, away_score: 1 },
  { external_id: 9013, home_team: "Spanien",    away_team: "Frankrike",  kickoff_at: "2026-07-05T19:00:00Z", stage: "quarter_final", group_name: null, status: "finished",  home_score: 1, away_score: 0 },
  // Semi finals
  { external_id: 9014, home_team: "England",    away_team: "Spanien",    kickoff_at: "2026-07-08T19:00:00Z", stage: "semi_final",    group_name: null, status: "finished",  home_score: 2, away_score: 1 },
  { external_id: 9015, home_team: "Brasilien",  away_team: "Argentina",  kickoff_at: "2026-07-09T19:00:00Z", stage: "semi_final",    group_name: null, status: "scheduled", home_score: null, away_score: null },
  // Final
  { external_id: 9016, home_team: "England",    away_team: "Argentina",  kickoff_at: "2026-07-19T19:00:00Z", stage: "final",         group_name: null, status: "scheduled", home_score: null, away_score: null },
];

export async function seedDemoMatches(): Promise<{ ok: boolean; message: string }> {
  const admin = getAdmin();

  const { error } = await admin.from("matches").upsert(
    DEMO_MATCHES.map((m) => ({ ...m, updated_at: new Date().toISOString() })),
    { onConflict: "external_id" }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `✅ ${DEMO_MATCHES.length} demo-matcher seedade! (grupp → R16 → QF → SF → final)` };
}

export async function finalizeSemiFinal(): Promise<{ ok: boolean; message: string }> {
  const admin = getAdmin();
  const { error } = await admin.from("matches")
    .update({ status: "finished", home_score: 2, away_score: 3, updated_at: new Date().toISOString() })
    .eq("external_id", 9015);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "⚽ Semifinal 2 klar: Brasilien 2–3 Argentina" };
}

export async function finalizeFinal(): Promise<{ ok: boolean; message: string }> {
  const admin = getAdmin();
  const { error } = await admin.from("matches")
    .update({ status: "finished", home_score: 2, away_score: 1, updated_at: new Date().toISOString() })
    .eq("external_id", 9016);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "🏆 VM-FINALEN: England 2–1 Argentina. ENGLAND ÄR VM-MÄSTARE!" };
}

export async function clearDemoMatches(): Promise<{ ok: boolean; message: string }> {
  const admin = getAdmin();
  const externalIds = DEMO_MATCHES.map((m) => m.external_id);
  const { error } = await admin.from("matches").delete().in("external_id", externalIds);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "🗑️ Demo-matcher borttagna." };
}

// ── Full WC 2026 group stage fixtures ────────────────────────────────────────

// MD dates per group index (0=A … 11=L)
const MD_DATES = [
  { md1: "2026-06-11", md2: "2026-06-17", md3: "2026-06-25" }, // A
  { md1: "2026-06-12", md2: "2026-06-17", md3: "2026-06-25" }, // B
  { md1: "2026-06-12", md2: "2026-06-18", md3: "2026-06-26" }, // C
  { md1: "2026-06-13", md2: "2026-06-18", md3: "2026-06-26" }, // D
  { md1: "2026-06-13", md2: "2026-06-19", md3: "2026-06-26" }, // E
  { md1: "2026-06-14", md2: "2026-06-19", md3: "2026-06-27" }, // F
  { md1: "2026-06-14", md2: "2026-06-20", md3: "2026-06-27" }, // G
  { md1: "2026-06-15", md2: "2026-06-20", md3: "2026-06-27" }, // H
  { md1: "2026-06-15", md2: "2026-06-21", md3: "2026-06-26" }, // I
  { md1: "2026-06-11", md2: "2026-06-17", md3: "2026-06-25" }, // J
  { md1: "2026-06-12", md2: "2026-06-18", md3: "2026-06-26" }, // K
  { md1: "2026-06-13", md2: "2026-06-19", md3: "2026-06-27" }, // L
];

function buildGroupStageFixtures() {
  const fixtures = [];
  let id = 101;
  for (let gi = 0; gi < WC_GROUPS_DATA.length; gi++) {
    const { group, teams } = WC_GROUPS_DATA[gi];
    const t = teams.map((x) => x.name);
    const d = MD_DATES[gi];
    // Matchday 1
    fixtures.push({ external_id: id++, home_team: t[0], away_team: t[1], kickoff_at: `${d.md1}T18:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    fixtures.push({ external_id: id++, home_team: t[2], away_team: t[3], kickoff_at: `${d.md1}T21:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    // Matchday 2
    fixtures.push({ external_id: id++, home_team: t[0], away_team: t[2], kickoff_at: `${d.md2}T18:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    fixtures.push({ external_id: id++, home_team: t[1], away_team: t[3], kickoff_at: `${d.md2}T21:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    // Matchday 3 (concurrent pairs)
    fixtures.push({ external_id: id++, home_team: t[0], away_team: t[3], kickoff_at: `${d.md3}T20:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    fixtures.push({ external_id: id++, home_team: t[1], away_team: t[2], kickoff_at: `${d.md3}T20:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
  }
  return fixtures;
}

export async function seedGroupStageFixtures(): Promise<{ ok: boolean; message: string }> {
  const admin = getAdmin();
  const fixtures = buildGroupStageFixtures();
  const { error } = await admin.from("matches").upsert(
    fixtures.map((f) => ({ ...f, updated_at: new Date().toISOString() })),
    { onConflict: "external_id" }
  );
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `✅ ${fixtures.length} gruppspelsmatcher seedade (alla 12 grupper, 3 omgångar)!` };
}

// ── Kaos outcomes (for scoring simulation) ───────────────────────────────────

export async function seedDemoOutcomes(): Promise<{ ok: boolean; message: string }> {
  const admin = getAdmin();
  const demoOutcomes = [
    { bet_type: "goalkeeper_goal",  value_json: { answer: false }, source: "demo", notes: "Demo: ingen målvaktsmål" },
    { bet_type: "coach_sent_off",   value_json: { answer: true  }, source: "demo", notes: "Demo: tränare utvisad!" },
    { bet_type: "comeback_win",     value_json: { answer: false }, source: "demo", notes: "Demo: inget comebacken" },
    { bet_type: "final_penalty_miss", value_json: { answer: false }, source: "demo", notes: "Demo: inga straffar i finalen" },
    { bet_type: "sweden_final",     value_json: { answer: false }, source: "demo", notes: "Demo: Sverige inte i final (tyvärr)" },
    { bet_type: "knockout_hattrick",value_json: { answer: true  }, source: "demo", notes: "Demo: hattrick i QF!" },
    { bet_type: "vm_winner",        value_json: { team: "England"        }, source: "demo", notes: "Demo: England vinner VM" },
    { bet_type: "finalists",        value_json: { team1: "England", team2: "Argentina" }, source: "demo", notes: "Demo" },
    { bet_type: "top_scorer",       value_json: { player: "Harry Kane"   }, source: "demo", notes: "Demo: Harry Kane skyttekung" },
    { bet_type: "total_goals",      value_json: { goals: 142             }, source: "demo", notes: "Demo: 142 mål totalt" },
    { bet_type: "death_group",      value_json: { group: "I"             }, source: "demo", notes: "Demo: Grupp I (Frankrike/Norge)" },
    { bet_type: "most_red_cards",   value_json: { team: "Frankrike"      }, source: "demo", notes: "Demo: Frankrike flest röda" },
  ];

  const { error } = await admin.from("admin_outcomes").upsert(
    demoOutcomes.map((o) => ({ ...o, updated_at: new Date().toISOString(), updated_by: "dev" })),
    { onConflict: "bet_type" }
  );

  if (error) {
    const missingTable =
      error.message.includes("admin_outcomes") ||
      error.message.includes("schema cache") ||
      error.message.includes("does not exist");
    if (missingTable) {
      return {
        ok: false,
        message:
          "Migration 005 saknas i din Supabase-databas.\n\n" +
          "Kör den här SQL:en i Supabase SQL Editor:\n\n" +
          "  supabase/migrations/005_admin.sql\n\n" +
          "Sedan: API Settings → Reload schema cache\n\n" +
          "Försök sedan igen.",
      };
    }
    return { ok: false, message: error.message };
  }
  return { ok: true, message: "📋 Demo-utfall seedade (12 st)! Gå till Admin → Poängsätt för att testa scoring." };
}
