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
  homeTeam: { name: string };
  awayTeam: { name: string };
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
  const matches = data.matches;

  console.log(`  Got ${matches.length} matches`);

  const rows = matches.map((m) => {
    const { stage, group_name } = mapStage(m.stage, m.group);
    return {
      external_id: m.id,
      home_team:   toSwedish(m.homeTeam.name),
      away_team:   toSwedish(m.awayTeam.name),
      kickoff_at:  m.utcDate,
      status:      mapStatus(m.status),
      home_score:  m.score.fullTime.home,
      away_score:  m.score.fullTime.away,
      stage,
      group_name,
      updated_at:  new Date().toISOString(),
    };
  });

  const { error, count } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "external_id", count: "exact" });

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`Synced ${count ?? rows.length} matches.`);

  // Summary by stage
  const bystage = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.stage] = (acc[r.stage] ?? 0) + 1;
    return acc;
  }, {});
  for (const [stage, n] of Object.entries(bystage)) {
    console.log(`  ${stage}: ${n}`);
  }
}

main().catch(console.error);
