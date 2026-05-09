import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatchBets } from "@/app/bets/actions";
import CountdownTimer from "@/components/CountdownTimer";
import MatchBetForm from "./MatchBetForm";

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });
}

export default async function MatchBetPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (!match) notFound();

  const existingBets = await getMatchBets(id);
  const kickoffDate = new Date(match.kickoff_at);
  const isLocked = new Date() >= kickoffDate;

  return (
    <div className="space-y-6">
      {/* Match header */}
      <div className="rounded-2xl border border-violet-600/40 bg-gradient-to-br from-violet-900/40 to-violet-800/20 p-6">
        <p className="text-violet-300/60 text-xs uppercase tracking-widest mb-3">
          {match.group_name ? `Grupp ${match.group_name}` : match.stage}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <p className="text-white font-bold text-lg leading-tight">{match.home_team}</p>
            <p className="text-green-400/60 text-xs mt-0.5">Hemma</p>
          </div>
          <div className="text-center shrink-0">
            {match.status === "finished" && match.home_score !== null ? (
              <p className="font-bebas text-4xl text-gold tracking-widest">
                {match.home_score} – {match.away_score}
              </p>
            ) : (
              <p className="font-bebas text-2xl text-gold tracking-widest">VS</p>
            )}
          </div>
          <div className="text-center flex-1">
            <p className="text-white font-bold text-lg leading-tight">{match.away_team}</p>
            <p className="text-green-400/60 text-xs mt-0.5">Borta</p>
          </div>
        </div>
        <p className="text-green-400/60 text-xs text-center mt-4">{formatKickoff(match.kickoff_at)}</p>
        {!isLocked && (
          <p className="text-violet-300 text-xs text-center mt-1">
            Låser om <CountdownTimer locksAt={kickoffDate} />
          </p>
        )}
        {isLocked && (
          <p className="text-amber-400 text-xs text-center mt-1">🔒 Gissningar låsta — matchen har börjat</p>
        )}
      </div>

      <MatchBetForm
        matchId={id}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        existingBets={existingBets}
        isLocked={isLocked}
        lockTime={match.kickoff_at}
      />
    </div>
  );
}
