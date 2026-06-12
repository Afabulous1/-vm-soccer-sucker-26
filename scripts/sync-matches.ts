/**
 * Syncs all WC 2026 fixtures from football-data.org into the Supabase matches table.
 * Safe to re-run — upserts on external_id.
 * Usage: npm run sync:matches
 */
import { fdoFetch, supabase, toSwedish, mapStatus, mapStage } from "./_client.js";

interface FdoMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: { name: string | null };
  awayTeam: { name: string | null };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

interface FdoMatchesResponse {
  matches: FdoMatch[];
}

async function main() {
  console.log("Fetching WC 2026 fixtures from football-data.org...");

  const data = await fdoFetch<FdoMatchesResponse>("/competitions/WC/matches?season=2026");
  const allMatches = data.matches;
  console.log(`  Got ${allMatches.length} matches from API`);

  // Skip knockout placeholders where teams haven't been determined yet.
  const matches = allMatches.filter((m) => m.homeTeam?.name && m.awayTeam?.name);
  const skipped = allMatches.length - matches.length;
  if (skipped > 0) console.log(`  Skipping ${skipped} placeholder match(es) with TBD teams.`);

  // Collect admin-locked external_ids so we don't overwrite manual corrections.
  const { data: lockedRows } = await supabase
    .from("matches")
    .select("external_id")
    .eq("admin_locked", true);
  const lockedIds = new Set((lockedRows ?? []).map((r) => (r as { external_id: number }).external_id));
  if (lockedIds.size > 0) {
    console.log(`  Skipping score/status for ${lockedIds.size} admin-locked match(es).`);
  }

  // ── Pass 1: fixture metadata for ALL matches (teams, kickoff, stage) ────────
  const fixtureRows = matches.map((m) => {
    const { stage, group_name } = mapStage(m.stage, m.group);
    return {
      external_id: m.id,
      home_team:   toSwedish(m.homeTeam.name),
      away_team:   toSwedish(m.awayTeam.name),
      kickoff_at:  m.utcDate,
      stage,
      group_name,
      updated_at:  new Date().toISOString(),
    };
  });

  const { error: fixtureErr, count } = await supabase
    .from("matches")
    .upsert(fixtureRows, { onConflict: "external_id", count: "exact" });

  if (fixtureErr) {
    console.error("Fixture upsert failed:", fixtureErr.message);
    process.exit(1);
  }
  console.log(`Synced fixture data for ${count ?? fixtureRows.length} matches.`);

  // ── Pass 2: scores/status only for non-admin-locked matches ─────────────────
  const resultRows = matches
    .filter((m) => !lockedIds.has(m.id))
    .map((m) => ({
      external_id: m.id,
      status:      mapStatus(m.status),
      home_score:  m.score.fullTime.home,
      away_score:  m.score.fullTime.away,
      updated_at:  new Date().toISOString(),
    }));

  if (resultRows.length > 0) {
    const { error: resultErr } = await supabase
      .from("matches")
      .upsert(resultRows, { onConflict: "external_id" });
    if (resultErr) {
      console.error("Score upsert failed:", resultErr.message);
      process.exit(1);
    }
    console.log(`  Synced scores/status for ${resultRows.length} match(es).`);
  }

  // Summary by stage
  const bystage = fixtureRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.stage] = (acc[r.stage] ?? 0) + 1;
    return acc;
  }, {});
  for (const [stage, n] of Object.entries(bystage)) {
    console.log(`  ${stage}: ${n}`);
  }
}

main().catch(console.error);
