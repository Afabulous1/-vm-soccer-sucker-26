/**
 * Updates scores, status, and first_scorer for matches that are live or recently finished.
 * Run this every few minutes during the tournament, or once after each match.
 * Usage: npm run sync:results
 */
import { fdoFetch, supabase, mapStatus } from "./_client.js";

interface FdoGoal {
  minute: number;
  type: string; // "REGULAR" | "OWN" | "PENALTY"
  scorer: { name: string } | null;
  team: { name: string };
}

interface FdoBooking {
  card: "YELLOW" | "RED" | "YELLOW_RED";
}

interface FdoMatchDetail {
  id: number;
  status: string;
  score: {
    fullTime:  { home: number | null; away: number | null };
    halfTime:  { home: number | null; away: number | null };
  };
  goals: FdoGoal[];
  bookings: FdoBooking[];
}

interface FdoMatchesResponse {
  matches: Array<{ id: number; status: string }>;
}

async function main() {
  // Fetch matches that are not yet settled
  const { data: pending, error: fetchErr } = await supabase
    .from("matches")
    .select("id, external_id, status")
    .in("status", ["scheduled", "live"])
    .order("kickoff_at", { ascending: true });

  if (fetchErr) { console.error(fetchErr.message); process.exit(1); }
  if (!pending?.length) { console.log("No pending matches to update."); return; }

  // Only bother with matches that have actually started (kickoff_at <= now + 2h buffer)
  const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const { data: started } = await supabase
    .from("matches")
    .select("id, external_id")
    .in("status", ["scheduled", "live"])
    .lte("kickoff_at", cutoff);

  if (!started?.length) { console.log("No matches started yet."); return; }

  console.log(`Fetching details for ${started.length} match(es)...`);

  let updated = 0;
  for (const match of started) {
    try {
      const detail = await fdoFetch<FdoMatchDetail>(`/matches/${match.external_id}`);

      // Determine first scorer (skip own goals for the bet — unlikely to be guessed)
      const firstGoal = detail.goals
        .filter((g) => g.type !== "OWN" && g.scorer)
        .sort((a, b) => a.minute - b.minute)[0];

      const redCardCount = (detail.bookings ?? []).filter(
        (b) => b.card === "RED" || b.card === "YELLOW_RED",
      ).length;

      const { error } = await supabase
        .from("matches")
        .update({
          status:          mapStatus(detail.status),
          home_score:      detail.score.fullTime.home,
          away_score:      detail.score.fullTime.away,
          first_scorer:    firstGoal?.scorer?.name ?? null,
          red_card_count:  redCardCount,
          updated_at:      new Date().toISOString(),
        } as never)
        .eq("id", match.id);

      if (error) console.warn(`  Match ${match.external_id}: ${error.message}`);
      else updated++;

      // Respect rate limit (10 req/min free tier)
      await new Promise((r) => setTimeout(r, 6100));
    } catch (err) {
      console.warn(`  Match ${match.external_id} fetch failed:`, (err as Error).message);
    }
  }

  console.log(`Updated ${updated}/${started.length} matches.`);
}

main().catch(console.error);
