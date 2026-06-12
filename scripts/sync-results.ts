/**
 * Updates scores and status for matches that are live or recently finished.
 * Uses the competition endpoint (free tier) — one API call for all matches.
 *
 * NOTE: first_scorer and card counts require a paid football-data.org plan
 * (/matches/{id} endpoint). Set these manually via the admin panel if needed.
 *
 * Usage: npm run sync:results
 */
import { fdoFetch, mapStatus, supabase } from "./_client.js";

interface FdoMatch {
  id: number;
  status: string;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

interface FdoMatchesResponse {
  matches: FdoMatch[];
}

interface DbMatch {
  id: string;
  external_id: number;
  admin_locked?: boolean;
}

async function fetchDbStartedMatches(): Promise<DbMatch[]> {
  const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  // Try with admin_locked (migration 005); fall back if column doesn't exist yet.
  const { data, error } = await supabase
    .from("matches")
    .select("id, external_id, admin_locked")
    .in("status", ["scheduled", "live"])
    .lte("kickoff_at", cutoff)
    .order("kickoff_at", { ascending: true });

  if (!error) return (data ?? []) as DbMatch[];

  if (error.message.includes("admin_locked") || error.message.includes("column")) {
    console.warn("  admin_locked column missing (run migration 005) — treating all as unlocked.");
    const { data: fallback, error: fallbackErr } = await supabase
      .from("matches")
      .select("id, external_id")
      .in("status", ["scheduled", "live"])
      .lte("kickoff_at", cutoff)
      .order("kickoff_at", { ascending: true });
    if (fallbackErr) { console.error(fallbackErr.message); process.exit(1); }
    return (fallback ?? []) as DbMatch[];
  }

  console.error(error.message);
  process.exit(1);
}

async function main() {
  // 1. Fetch all WC match scores in one API call (free tier compatible)
  console.log("Fetching all WC 2026 scores from football-data.org...");
  const apiData = await fdoFetch<FdoMatchesResponse>("/competitions/WC/matches?season=2026");
  const apiById = new Map(apiData.matches.map((m) => [m.id, m]));
  console.log(`  Got ${apiData.matches.length} matches from API.`);

  // 2. Find DB matches that have started and aren't yet settled
  const dbMatches = await fetchDbStartedMatches();
  if (!dbMatches.length) { console.log("No matches started yet."); return; }
  console.log(`Updating ${dbMatches.length} started match(es)...`);

  let updated = 0;
  for (const dbMatch of dbMatches) {
    if (dbMatch.admin_locked === true) {
      console.log(`  Match ${dbMatch.external_id}: admin_locked — skipping.`);
      continue;
    }

    const apiMatch = apiById.get(dbMatch.external_id);
    if (!apiMatch) {
      console.warn(`  Match ${dbMatch.external_id}: not found in API response.`);
      continue;
    }

    const calculatedStatus = mapStatus(apiMatch.status);
    const homeScore = apiMatch.score.fullTime.home;
    const awayScore = apiMatch.score.fullTime.away;

    // DATA MAP PROTECTION: Don't set a match to finished unless scores are validated
    let verifiedStatus = calculatedStatus;
    if (calculatedStatus === "finished" && (homeScore === null || awayScore === null)) {
      console.warn(`  Match ${dbMatch.external_id} marked complete by API but goals count missing. Holding status as live.`);
      verifiedStatus = "live";
    }

    // Perform cleanly typed update interaction directly matching table constraints
    const { error } = await supabase
      .from("matches")
      .update({
        status: verifiedStatus,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dbMatch.id);

    if (error) {
      console.warn(`  Match ${dbMatch.external_id}: ${error.message}`);
    } else {
      const scoreStr = homeScore !== null ? `${homeScore}–${awayScore}` : "tba";
      console.log(`  Match ${dbMatch.external_id}: ${verifiedStatus} ${scoreStr}`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated}/${dbMatches.length} matches.`);
  console.log("Note: first_scorer and card counts must be set manually via /admin (paid API tier required).");
}

main().catch(console.error);