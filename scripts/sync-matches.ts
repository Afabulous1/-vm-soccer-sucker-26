/**
 * Syncs all WC 2026 fixtures from football-data.org into the Supabase matches table.
 * Safe to re-run — preserves live scores/statuses using structural database protection.
 * Usage: npm run sync:matches
 */
import { fdoFetch, mapStage, mapStatus, supabase, toSwedish } from "./_client.js";

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

interface DbMatchReference {
  external_id: number;
  status: string;
  admin_locked: boolean | null;
}

function buildRow(m: FdoMatch) {
  const { stage, group_name } = mapStage(m.stage, m.group);
  return {
    external_id: m.id,
    home_team: toSwedish(m.homeTeam.name!),
    away_team: toSwedish(m.awayTeam.name!),
    kickoff_at: m.utcDate,
    stage,
    group_name,
    status: mapStatus(m.status),
    home_score: m.score.fullTime.home,
    away_score: m.score.fullTime.away,
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  console.log("Fetching WC 2026 fixtures from football-data.org...");

  const data = await fdoFetch<FdoMatchesResponse>("/competitions/WC/matches?season=2026");
  const allMatches = data.matches;
  console.log(`  Got ${allMatches.length} matches from API`);

  // Skip knockout placeholders where teams haven't been determined yet.
  const matches = allMatches.filter((m) => m.homeTeam?.name && m.awayTeam?.name);
  const skipped = allMatches.length - matches.length;
  if (skipped > 0) {
    console.log(`  Skipping ${skipped} placeholder match(es) with TBD teams.`);
  }

  // Fetch ALL matches that already have an established records in our DB
  const { data: existingMatches, error: fetchErr } = await supabase
    .from("matches")
    .select("external_id, status, admin_locked");

  if (fetchErr) {
    console.error("Failed to query existing database matches layout:", fetchErr.message);
    process.exit(1);
  }

  const existingMap = new Map<number, DbMatchReference>(
    (existingMatches ?? []).map((m) => [m.external_id, m as DbMatchReference])
  );

  const rowsToUpsert: any[] = [];
  let skippedAdminLocked = 0;
  let protectedLiveMatches = 0;

  for (const m of matches) {
    const existing = existingMap.get(m.id);

    // Ignore updates completely if the row is admin_locked
    if (existing?.admin_locked === true) {
      skippedAdminLocked++;
      continue;
    }

    const row = buildRow(m);

    // CRITICAL FIX: If a match has already started or finished in our DB, 
    // do NOT let this structural script roll back its live scores or status values!
    if (existing && (existing.status === "live" || existing.status === "finished")) {
      protectedLiveMatches++;
      // Remove these fields so the upsert only adjusts static metadata (e.g. kickoff adjustments, stage names)
      delete (row as any).status;
      delete (row as any).home_score;
      delete (row as any).away_score;
    }

    rowsToUpsert.push(row);
  }

  if (skippedAdminLocked > 0) {
    console.log(`  ${skippedAdminLocked} admin-locked match(es) left untouched.`);
  }
  if (protectedLiveMatches > 0) {
    console.log(`  Protected scores/statuses for ${protectedLiveMatches} active or finished match(es).`);
  }

  // ── Execute Upsert ────────────────────────────────────────────────────────
  if (rowsToUpsert.length > 0) {
    const { error, count } = await supabase
      .from("matches")
      .upsert(rowsToUpsert, { onConflict: "external_id", count: "exact" });

    if (error) {
      console.error("Upsert failed framework execution error:", error.message);
      process.exit(1);
    }
    console.log(`Synced ${count ?? rowsToUpsert.length} match records layout parameters successfully.`);
  }

  // Summary by stage
  const bystage = matches.reduce<Record<string, number>>((acc, m) => {
    const { stage } = mapStage(m.stage, m.group);
    acc[stage] = (acc[stage] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\nStage breakdown:");
  for (const [stage, n] of Object.entries(bystage)) {
    console.log(`  ${stage}: ${n}`);
  }
}

main().catch(console.error);