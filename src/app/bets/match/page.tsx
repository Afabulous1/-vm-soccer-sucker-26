import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/types/database";

function formatKickoff(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });
}

export default async function MatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  const grouped = (matches ?? []).reduce<Record<string, Match[]>>((acc, m) => {
    const key = m.group_name ? `Grupp ${m.group_name}` : m.stage;
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bebas text-5xl text-violet-300 tracking-widest">MATCHGISSNINGAR ⚽</h1>
        <p className="text-violet-300/70 text-sm mt-1">
          Gissa resultat, exakt poäng, målskytt och mer per match · låser vid avspark
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-8 text-center space-y-2">
          <p className="text-4xl">⏳</p>
          <p className="text-white font-bold">Inga matcher inlagda ännu</p>
          <p className="text-green-400 text-sm">
            Matcherna laddas upp inför turneringsstarten den 11 juni 2026.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([group, groupMatches]) => (
          <div key={group} className="space-y-2">
            <h2 className="font-bebas text-xl text-gold tracking-widest px-1">{group}</h2>
            {groupMatches.map((m) => {
              const kickoffPast = new Date() >= new Date(m.kickoff_at);
              return (
                <Link
                  key={m.id}
                  href={`/bets/match/${m.id}`}
                  className="block rounded-xl border border-pitch-light/30 bg-pitch/40 hover:bg-pitch-light/10 hover:border-violet-500/40 transition-all p-4 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center min-w-0">
                        <p className="text-white font-bold text-sm truncate">{m.home_team}</p>
                      </div>
                      <span className="text-gold font-bebas text-lg shrink-0">
                        {m.status === "finished" && m.home_score !== null
                          ? `${m.home_score} – ${m.away_score}`
                          : "vs"}
                      </span>
                      <div className="text-center min-w-0">
                        <p className="text-white font-bold text-sm truncate">{m.away_team}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-green-400 text-xs">{formatKickoff(m.kickoff_at)}</p>
                      {kickoffPast ? (
                        <p className="text-amber-400 text-xs">🔒 Låst</p>
                      ) : (
                        <p className="text-violet-400 text-xs group-hover:text-white transition-colors">Gissa →</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
