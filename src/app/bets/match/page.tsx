import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MatchKickoffBadge from "@/components/MatchKickoffBadge";
import type { Match } from "@/types/database";

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
    timeZone: "Europe/Stockholm",
  });
}

export default async function MatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: matches }, { data: myBets }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at", { ascending: true }),
    supabase.from("bets").select("match_id").eq("user_id", user.id).eq("bet_category", "match"),
  ]);

  const bettedMatchIds = new Set((myBets ?? []).map((b) => b.match_id).filter(Boolean) as string[]);

  const grouped = (matches ?? []).reduce<Record<string, Match[]>>((acc, m) => {
    const key = m.group_name ? `Grupp ${m.group_name}` : m.stage;
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bebas text-5xl text-violet-300 tracking-widest">MATCHGISSNINGAR ⚽</h1>
        <p className="text-violet-300/60 text-sm mt-1">
          Gissa per match · låser vid avspark · superkrafter tillgängliga
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-pitch-light/20 bg-pitch/40 p-10 text-center space-y-3">
          <p className="text-5xl">📅</p>
          <p className="text-white font-bold text-lg">Matcherna visas snart</p>
          <p className="text-green-400 text-sm">
            Vi laddar upp hela VM-programmet när turneringen startar den 11 juni 2026.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([group, groupMatches]) => (
          <div key={group} className="space-y-2">
            <h2 className="font-bebas text-xl text-gold tracking-widest px-1 flex items-center gap-2">
              {group}
              <span className="text-green-700 font-sans text-xs font-normal normal-case">
                {groupMatches.length} matcher
              </span>
            </h2>

            {groupMatches.map((m) => {
              const hasBet  = bettedMatchIds.has(m.id);
              const isOver  = m.status === "finished";
              const isLive  = m.status === "live";

              return (
                <Link
                  key={m.id}
                  href={`/bets/match/${m.id}`}
                  className={`block rounded-xl border p-4 transition-all group ${
                    isLive
                      ? "border-green-500/50 bg-green-900/20 shadow-lg shadow-green-900/20"
                      : hasBet
                      ? "border-violet-500/30 bg-violet-900/10"
                      : "border-pitch-light/20 bg-pitch/30 hover:bg-pitch-light/10 hover:border-violet-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Teams */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-center min-w-0 flex-1">
                        <p className="text-white font-bold text-sm truncate">{m.home_team}</p>
                      </div>
                      <div className="shrink-0 text-center px-2">
                        {isOver && m.home_score !== null ? (
                          <span className="font-bebas text-xl text-gold tracking-widest">
                            {m.home_score} – {m.away_score}
                          </span>
                        ) : isLive ? (
                          <span className="font-bebas text-lg text-green-400 animate-pulse">LIVE</span>
                        ) : (
                          <span className="text-green-700 font-bold text-xs">vs</span>
                        )}
                      </div>
                      <div className="text-center min-w-0 flex-1">
                        <p className="text-white font-bold text-sm truncate">{m.away_team}</p>
                      </div>
                    </div>

                    {/* Right column: time + status */}
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-green-600 text-xs">{formatKickoff(m.kickoff_at)}</p>
                      <div className="flex items-center justify-end gap-1.5">
                        {hasBet && !isOver && (
                          <span className="text-[10px] text-violet-400 font-semibold">✓ Gissad</span>
                        )}
                        <MatchKickoffBadge kickoffAt={m.kickoff_at} />
                      </div>
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
