"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import {
  evalMatchResult,
  evalExactScore,
  evalFirstScorer,
  evalBothTeamsScore,
  evalYellowCards,
  evalTotalGoalsMatch,
} from "@/lib/scoring";
import type { PowerupType } from "@/types/database";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function saveOutcome(
  betType: string,
  valueJson: Record<string, unknown>,
  notes: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad" };

  const admin = getAdmin();
  const { error } = await admin.from("admin_outcomes").upsert(
    {
      bet_type: betType,
      value_json: valueJson,
      notes,
      source: "admin",
      updated_at: new Date().toISOString(),
      updated_by: user.email ?? user.id,
    },
    { onConflict: "bet_type" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function computeAutoOutcomes(): Promise<{
  ok: boolean;
  computed: string[];
  errors: string[];
}> {
  const admin = getAdmin();
  const computed: string[] = [];
  const errors: string[] = [];

  const { data: matches, error: matchErr } = await admin
    .from("matches")
    .select("id, home_team, away_team, stage, status, home_score, away_score, red_card_count");

  if (matchErr) {
    return { ok: false, computed, errors: [matchErr.message] };
  }

  const allMatches = (matches ?? []) as Array<{
    id: string;
    home_team: string;
    away_team: string;
    stage: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
    red_card_count: number | null;
  }>;

  const finishedMatches = allMatches.filter((m) => m.status === "finished");

  const finalMatch = allMatches.find((m) => {
    const s = m.stage.toUpperCase();
    return s === "FINAL" || s === "FINALE";
  });

  if (finalMatch && finalMatch.home_score !== null && finalMatch.away_score !== null) {
    const winnerTeam =
      finalMatch.home_score > finalMatch.away_score
        ? finalMatch.home_team
        : finalMatch.away_score > finalMatch.home_score
          ? finalMatch.away_team
          : null;

    if (winnerTeam) {
      const { error } = await admin.from("admin_outcomes").upsert(
        { bet_type: "vm_winner", value_json: { team: winnerTeam }, source: "api",
          notes: "Auto-beräknad från finalresultat", updated_at: new Date().toISOString(), updated_by: "system" },
        { onConflict: "bet_type" },
      );
      if (error) errors.push(`vm_winner: ${error.message}`);
      else computed.push("vm_winner");
    }

    const { error: finErr } = await admin.from("admin_outcomes").upsert(
      { bet_type: "finalists", value_json: { team1: finalMatch.home_team, team2: finalMatch.away_team },
        source: "api", notes: "Auto-beräknad från finalmatch", updated_at: new Date().toISOString(), updated_by: "system" },
      { onConflict: "bet_type" },
    );
    if (finErr) errors.push(`finalists: ${finErr.message}`);
    else computed.push("finalists");
  }

  const totalGoals = finishedMatches.reduce((sum, m) => sum + (m.home_score ?? 0) + (m.away_score ?? 0), 0);
  if (finishedMatches.length > 0) {
    const { error } = await admin.from("admin_outcomes").upsert(
      { bet_type: "total_goals", value_json: { goals: totalGoals }, source: "api",
        notes: `Auto-beräknad: ${finishedMatches.length} avslutade matcher`, updated_at: new Date().toISOString(), updated_by: "system" },
      { onConflict: "bet_type" },
    );
    if (error) errors.push(`total_goals: ${error.message}`);
    else computed.push("total_goals");
  }

  const redCardsByTeam = new Map<string, number>();
  for (const m of finishedMatches) {
    if (m.red_card_count === null || m.red_card_count === 0) continue;
    redCardsByTeam.set(m.home_team, (redCardsByTeam.get(m.home_team) ?? 0) + m.red_card_count);
    redCardsByTeam.set(m.away_team, (redCardsByTeam.get(m.away_team) ?? 0) + m.red_card_count);
  }

  if (redCardsByTeam.size > 0) {
    let topTeam = "";
    let topCount = -1;
    for (const [team, count] of Array.from(redCardsByTeam)) {
      if (count > topCount) { topCount = count; topTeam = team; }
    }
    const { error } = await admin.from("admin_outcomes").upsert(
      { bet_type: "most_red_cards", value_json: { team: topTeam }, source: "api",
        notes: `Auto-beräknad: ${topTeam} (${topCount} röda kort). OBS: kontrollera manuellt.`,
        updated_at: new Date().toISOString(), updated_by: "system" },
      { onConflict: "bet_type" },
    );
    if (error) errors.push(`most_red_cards: ${error.message}`);
    else computed.push("most_red_cards");
  }

  const swedenInFinal = allMatches.some((m) => {
    const stage = m.stage.toLowerCase();
    const isFinalStage = stage.includes("final") || stage.includes("semifinal");
    return isFinalStage && (m.home_team === "Sverige" || m.away_team === "Sverige");
  });

  const { error: sweErr } = await admin.from("admin_outcomes").upsert(
    { bet_type: "sweden_final", value_json: { answer: swedenInFinal }, source: "api",
      notes: "Auto-beräknad: Sverige i final/semifinal", updated_at: new Date().toISOString(), updated_by: "system" },
    { onConflict: "bet_type" },
  );
  if (sweErr) errors.push(`sweden_final: ${sweErr.message}`);
  else computed.push("sweden_final");

  return { ok: errors.length === 0, computed, errors };
}

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

async function rebuildLeaderboard(admin: ReturnType<typeof getAdmin>, log: string[]) {
  const { data: allBets, error: betsErr } = await admin
    .from("bets")
    .select("user_id, bet_type, bet_category, is_correct, points_awarded, locked_at")
    .not("points_awarded", "is", null);

  if (betsErr) { log.push(`[ERROR] Leaderboard: ${betsErr.message}`); return; }

  const bets = (allBets ?? []) as unknown as BetRow[];

  const { data: profiles, error: profilesErr } = await admin.from("profiles").select("user_id, username, avatar_key");
  if (profilesErr) { log.push(`[ERROR] Leaderboard profiler: ${profilesErr.message}`); return; }

  const profileMap = new Map<string, ProfileRow>();
  for (const p of profiles ?? []) profileMap.set(p.user_id, p as ProfileRow);

  const byUser = new Map<string, BetRow[]>();
  for (const bet of bets) {
    const arr = byUser.get(bet.user_id) ?? [];
    arr.push(bet);
    byUser.set(bet.user_id, arr);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  interface LeaderboardRow {
    user_id: string; username: string; avatar_key: string;
    points_total: number; weekly_points: number; current_streak: number; rank: number;
  }

  const rows: LeaderboardRow[] = [];

  for (const [userId, userBets] of Array.from(byUser)) {
    const profile = profileMap.get(userId);
    if (!profile) continue;

    const points_total = userBets.reduce((sum: number, b: BetRow) => sum + (b.points_awarded ?? 0), 0);
    const weekly_points = userBets
      .filter((b: BetRow) => b.locked_at && b.locked_at >= sevenDaysAgo)
      .reduce((sum: number, b: BetRow) => sum + (b.points_awarded ?? 0), 0);

    const matchResults = userBets
      .filter((b: BetRow) => b.bet_category === "match" && b.bet_type === "match_result" && b.is_correct !== null && b.locked_at !== null)
      .sort((a: BetRow, b: BetRow) => (b.locked_at as string).localeCompare(a.locked_at as string));

    let current_streak = 0;
    for (const b of matchResults) {
      if (b.is_correct === true) current_streak++;
      else break;
    }

    rows.push({ user_id: userId, username: profile.username, avatar_key: profile.avatar_key,
      points_total, weekly_points, current_streak, rank: 0 });
  }

  rows.sort((a, b) => b.points_total - a.points_total);
  rows.forEach((r, i) => { r.rank = i + 1; });

  if (rows.length === 0) { log.push("[INFO] Leaderboard: inga utvärderade spel."); return; }

  const { error: upsertErr } = await admin.from("leaderboard_cache").upsert(
    rows.map((r) => ({ ...r, badges: [], updated_at: new Date().toISOString() })),
    { onConflict: "user_id" },
  );
  if (upsertErr) log.push(`[ERROR] Leaderboard upsert: ${upsertErr.message}`);
  else log.push(`[OK] Leaderboard uppdaterad med ${rows.length} spelare.`);

  for (const row of rows) {
    const { error: pErr } = await admin.from("profiles").update({ points_total: row.points_total }).eq("user_id", row.user_id);
    if (pErr) log.push(`[WARN] Profilsynk misslyckades för ${row.user_id}: ${pErr.message}`);
  }
  log.push(`[OK] Synkade points_total till ${rows.length} profiler.`);
}

interface FinishedMatch {
  id: string;
  home_score: number;
  away_score: number;
  first_scorer: string | null;
  red_card_count: number | null;
  yellow_card_count: number | null;
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

export async function scoreMatchBets(): Promise<{ ok: boolean; scored: number; log: string[] }> {
  const admin = getAdmin();
  const log: string[] = [];
  let totalScored = 0;

  const { data: matches, error: matchErr } = await admin
    .from("matches")
    .select("id, home_score, away_score, first_scorer, red_card_count, yellow_card_count")
    .eq("status", "finished");

  if (matchErr) return { ok: false, scored: 0, log: [`[ERROR] ${matchErr.message}`] };

  const finishedMatches = (matches ?? []) as unknown as FinishedMatch[];
  log.push(`Hittade ${finishedMatches.length} avslutad(e) match(er).`);

  for (const match of finishedMatches) {
    if (match.home_score === null || match.away_score === null) continue;

    const { data: bets, error: betsErr } = await admin
      .from("bets")
      .select("id, user_id, bet_type, bet_value, points_wager, power_up_used, shield_used, locked_at")
      .eq("match_id", match.id)
      .eq("bet_category", "match")
      .is("is_correct", null);

    if (betsErr) { log.push(`[WARN] Match ${match.id}: ${betsErr.message}`); continue; }

    const unevaluated = (bets ?? []) as unknown as UnevaluatedBet[];
    if (!unevaluated.length) continue;

    log.push(`Match ${match.id}: poängsätter ${unevaluated.length} spel (${match.home_score}–${match.away_score})`);

    for (const bet of unevaluated) {
      const { bet_type, bet_value, points_wager, power_up_used, shield_used } = bet;
      let result: { correct: boolean; pointsAwarded: number } | null = null;

      switch (bet_type) {
        case "match_result":
          result = evalMatchResult(bet_value, match.home_score, match.away_score, points_wager, power_up_used, shield_used);
          break;
        case "exact_score":
          result = evalExactScore(bet_value, match.home_score, match.away_score, points_wager, 400, power_up_used, shield_used);
          break;
        case "first_scorer":
          result = evalFirstScorer(bet_value, match.first_scorer, match.home_score, match.away_score, points_wager, power_up_used, shield_used);
          break;
        case "red_card_shown": {
          if (match.red_card_count === null) { log.push(`  [SKIP] Spel ${bet.id}: red_card_count saknas.`); continue; }
          const hadRedCard = match.red_card_count > 0;
          const guessed = (bet_value as { answer: boolean }).answer === true;
          const correct = guessed === hadRedCard;
          result = { correct, pointsAwarded: correct ? points_wager : 0 };
          break;
        }
        case "total_goals_match":
          result = evalTotalGoalsMatch(bet_value, match.home_score, match.away_score, points_wager, power_up_used, shield_used);
          break;
        case "both_teams_score":
          result = evalBothTeamsScore(bet_value, match.home_score, match.away_score, points_wager, power_up_used, shield_used);
          break;
        case "yellow_cards": {
          if (match.yellow_card_count === null) { log.push(`  [SKIP] Spel ${bet.id}: yellow_card_count saknas.`); continue; }
          result = evalYellowCards(bet_value, match.yellow_card_count, points_wager, power_up_used, shield_used);
          break;
        }
        default:
          log.push(`  [SKIP] Spel ${bet.id}: okänd bet_type '${bet_type}'.`);
          continue;
      }

      if (!result) continue;

      const { error: updateErr } = await admin.from("bets").update({
        is_correct: result.correct,
        points_awarded: result.pointsAwarded,
        locked_at: bet.locked_at ?? new Date().toISOString(),
      }).eq("id", bet.id);

      if (updateErr) log.push(`  [ERROR] Spel ${bet.id}: ${updateErr.message}`);
      else { totalScored++; log.push(`  [OK] Spel ${bet.id}: ${bet_type} → ${result.correct ? "RÄTT" : "FEL"} (${result.pointsAwarded}p)`); }
    }
  }

  log.push(`Totalt poängsatt: ${totalScored} spel.`);
  await rebuildLeaderboard(admin, log);
  return { ok: true, scored: totalScored, log };
}

const REQUIRED_OUTCOME_TYPES = [
  "vm_winner", "finalists", "top_scorer", "total_goals", "death_group", "most_red_cards",
  "goalkeeper_goal", "coach_sent_off", "comeback_win", "final_penalty_miss", "sweden_final", "knockout_hattrick",
];

export async function scoreTournamentKaos(): Promise<{ ok: boolean; scored: number; log: string[] }> {
  const admin = getAdmin();
  const log: string[] = [];

  const { data: outcomes, error: outErr } = await admin.from("admin_outcomes").select("bet_type, value_json");
  if (outErr) return { ok: false, scored: 0, log: [`[ERROR] ${outErr.message}`] };

  const outcomeMap = new Map<string, Record<string, unknown>>();
  for (const o of outcomes ?? []) outcomeMap.set(o.bet_type, o.value_json as Record<string, unknown>);

  const missing = REQUIRED_OUTCOME_TYPES.filter((t) => !outcomeMap.has(t));
  if (missing.length > 0) {
    return { ok: false, scored: 0, log: [`[ERROR] Saknade outcomes: ${missing.join(", ")}.`] };
  }

  const { data: bets, error: betsErr } = await admin
    .from("bets")
    .select("id, user_id, bet_type, bet_category, bet_value, points_wager, power_up_used, shield_used, locked_at")
    .in("bet_category", ["turnering", "kaos"])
    .is("is_correct", null);

  if (betsErr) return { ok: false, scored: 0, log: [`[ERROR] ${betsErr.message}`] };

  const unevaluated = (bets ?? []) as Array<{
    id: string; user_id: string; bet_type: string; bet_category: string;
    bet_value: unknown; points_wager: number; power_up_used: PowerupType | null;
    shield_used: PowerupType | null; locked_at: string | null;
  }>;

  log.push(`Hittade ${unevaluated.length} outvärderande turnering/kaos-spel.`);
  let totalScored = 0;

  for (const bet of unevaluated) {
    const betValue = bet.bet_value as Record<string, unknown>;
    const outcome = outcomeMap.get(bet.bet_type);
    if (!outcome) { log.push(`  [SKIP] Spel ${bet.id}: ingen outcome för '${bet.bet_type}'.`); continue; }

    let correct = false;
    let pointsAwarded = 0;

    if (bet.bet_category === "kaos") {
      correct = betValue.answer === outcome.answer;
      pointsAwarded = correct ? 10000 : 0;
    } else {
      switch (bet.bet_type) {
        case "vm_winner":
          correct = betValue.team === outcome.team;
          pointsAwarded = correct ? 5000 : 0;
          break;
        case "finalists": {
          const t1 = betValue.team1 as string;
          const t2 = betValue.team2 as string;
          const f1 = outcome.team1 as string;
          const f2 = outcome.team2 as string;
          correct = (t1 === f1 || t1 === f2) && (t2 === f1 || t2 === f2) && t1 !== t2;
          pointsAwarded = correct ? 3000 : 0;
          break;
        }
        case "top_scorer":
          correct = betValue.player === outcome.player;
          pointsAwarded = correct ? 4000 : 0;
          break;
        case "total_goals": {
          const diff = Math.abs((betValue.goals as number) - (outcome.goals as number));
          if (diff === 0) { correct = true; pointsAwarded = 2000; }
          else if (diff <= 2) { correct = false; pointsAwarded = 1000; }
          else if (diff <= 5) { correct = false; pointsAwarded = 500; }
          else { correct = false; pointsAwarded = 0; }
          break;
        }
        case "death_group":
          correct = betValue.group === outcome.group;
          pointsAwarded = correct ? 1500 : 0;
          break;
        case "most_red_cards":
          correct = betValue.team === outcome.team;
          pointsAwarded = correct ? 1000 : 0;
          break;
        default:
          log.push(`  [SKIP] Spel ${bet.id}: okänd turnering bet_type '${bet.bet_type}'.`);
          continue;
      }
    }

    const { error: updateErr } = await admin.from("bets").update({
      is_correct: correct,
      points_awarded: pointsAwarded,
      locked_at: bet.locked_at ?? new Date().toISOString(),
    }).eq("id", bet.id);

    if (updateErr) log.push(`  [ERROR] Spel ${bet.id}: ${updateErr.message}`);
    else { totalScored++; log.push(`  [OK] Spel ${bet.id}: ${bet.bet_type} → ${correct ? "RÄTT" : "FEL"} (${pointsAwarded}p)`); }
  }

  log.push(`Totalt poängsatt: ${totalScored} spel.`);
  await rebuildLeaderboard(admin, log);
  return { ok: true, scored: totalScored, log };
}

export async function overrideMatch(
  matchId: string,
  data: {
    home_score?: number;
    away_score?: number;
    first_scorer?: string;
    red_card_count?: number;
    yellow_card_count?: number;
    status?: string;
    admin_locked?: boolean;
  },
): Promise<{ ok: boolean; error?: string }> {
  const admin = getAdmin();
  const { error } = await admin.from("matches").update({ ...data, updated_at: new Date().toISOString() }).eq("id", matchId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
