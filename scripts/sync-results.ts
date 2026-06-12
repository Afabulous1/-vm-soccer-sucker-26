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
  goals:    FdoGoal[]    | null;
  bookings: FdoBooking[] | null;
}

async function main() {
  // Only fetch matches that have started (kickoff_at <= now + 2h buffer)
  const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const { data: started, error: fetchErr } = await supabase
    .from("matches")
    .select("id, external_id, admin_locked")
    .in("status", ["scheduled", "live"])
    .lte("kickoff_at", cutoff)
    .order("kickoff_at", { ascending: true });

  if (fetchErr) { console.error(fetchErr.message); process.exit(1); }
  if (!started?.length) { console.log("No matches started yet."); return; }

  console.log(`Fetching details for ${started.length} match(es)...`);

  let updated = 0;
  for (const match of started) {
    if ((match as { admin_locked?: boolean }).admin_locked === true) {
      console.log(`  Match ${match.external_id}: admin_locked=true — skipping.`);
      continue;
    }
    try {
      const detail = await fdoFetch<FdoMatchDetail>(`/matches/${match.external_id}`);

      // Determine first scorer (skip own goals for the bet — unlikely to be guessed)
      const firstGoal = (detail.goals ?? [])
        .filter((g) => g.type !== "OWN" && g.scorer)
        .sort((a, b) => a.minute - b.minute)[0];

      const redCardCount = (detail.bookings ?? []).filter(
        (b) => b.card === "RED" || b.card === "YELLOW_RED",
      ).length;

      const yellowCardCount = (detail.bookings ?? []).filter(
        (b) => b.card === "YELLOW",
      ).length;

      const { error } = await supabase
        .from("matches")
        .update({
          status:            mapStatus(detail.status),
          home_score:        detail.score.fullTime.home,
          away_score:        detail.score.fullTime.away,
          first_scorer:      firstGoal?.scorer?.name ?? null,
          red_card_count:    redCardCount,
          yellow_card_count: yellowCardCount,
          updated_at:        new Date().toISOString(),
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
