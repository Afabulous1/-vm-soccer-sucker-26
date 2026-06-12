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

function buildRow(m: FdoMatch) {
  const { stage, group_name } = mapStage(m.stage, m.group);
  return {
    external_id: m.id,
    home_team:   toSwedish(m.homeTeam.name!),
    away_team:   toSwedish(m.awayTeam.name!),
    kickoff_at:  m.utcDate,
    stage,
    group_name,
    status:      mapStatus(m.status),
    home_score:  m.score.fullTime.home,
    away_score:  m.score.fullTime.away,
    updated_at:  new Date().toISOString(),
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

  // Fetch admin-locked external_ids — their scores/status must not be overwritten.
  const { data: lockedRows } = await supabase
    .from("matches")
    .select("external_id")
    .eq("admin_locked", true);
  const lockedIds = new Set(
    (lockedRows ?? []).map((r) => (r as { external_id: number }).external_id),
  );
  if (lockedIds.size > 0) {
    console.log(`  ${lockedIds.size} admin-locked match(es) will be left untouched.`);
  }

  // ── Unlocked matches: full upsert (fixture + scores + status) ───────────────
  const unlockedRows = matches.filter((m) => !lockedIds.has(m.id)).map(buildRow);

  if (unlockedRows.length > 0) {
    const { error, count } = await supabase
      .from("matches")
      .upsert(unlockedRows, { onConflict: "external_id", count: "exact" });
    if (error) { console.error("Upsert failed (unlocked):", error.message); process.exit(1); }
    console.log(`Synced ${count ?? unlockedRows.length} unlocked match(es).`);
  }

  // ── Locked matches: insert-only (ON CONFLICT DO NOTHING — never overwrite) ──
  const lockedMatchRows = matches.filter((m) => lockedIds.has(m.id)).map(buildRow);

  if (lockedMatchRows.length > 0) {
    const { error } = await supabase
      .from("matches")
      .upsert(lockedMatchRows, { onConflict: "external_id", ignoreDuplicates: true });
    if (error) { console.error("Upsert failed (locked):", error.message); process.exit(1); }
    console.log(`Skipped ${lockedMatchRows.length} admin-locked match(es) (scores preserved).`);
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
