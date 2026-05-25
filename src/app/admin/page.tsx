import { createClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { data: outcomes },
    { data: pendingBets },
    { data: matches },
  ] = await Promise.all([
    supabase.from("admin_outcomes").select("*"),
    supabase
      .from("bets")
      .select("bet_category")
      .is("is_correct", null),
    supabase
      .from("matches")
      .select(
        "id, home_team, away_team, kickoff_at, stage, status, home_score, away_score, first_scorer, red_card_count, yellow_card_count, admin_locked",
      )
      .order("kickoff_at", { ascending: true }),
  ]);

  const pendingCounts = {
    match:
      (pendingBets ?? []).filter((b) => b.bet_category === "match").length,
    turnering:
      (pendingBets ?? []).filter((b) => b.bet_category === "turnering").length,
    kaos:
      (pendingBets ?? []).filter((b) => b.bet_category === "kaos").length,
    turneringKaos:
      (pendingBets ?? []).filter((b) =>
        b.bet_category === "turnering" || b.bet_category === "kaos",
      ).length,
  };

  return (
    <AdminClient
      outcomes={outcomes ?? []}
      pendingCounts={pendingCounts}
      matches={(matches ?? []) as AdminMatch[]}
    />
  );
}

export interface AdminMatch {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  stage: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  first_scorer: string | null;
  red_card_count: number | null;
  yellow_card_count: number | null;
  admin_locked: boolean | null;
}

export interface AdminOutcome {
  bet_type: string;
  value_json: Record<string, unknown> | null;
  source: string | null;
  notes: string | null;
  updated_at: string | null;
  updated_by: string | null;
}
