import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { buildGroupStageFixtures } from "@/lib/fixtures";
import MatchKickoffBadge from "@/components/MatchKickoffBadge";
import RandomBetButton from "./RandomBetButton";
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

  // Auto-seed all 72 group stage fixtures if the table is empty.
  // This runs once on first visit and is idempotent.
  const { count: groupCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("stage", "group_stage");

  if (!groupCount || groupCount < 10) {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const fixtures = buildGroupStageFixtures();
    await admin.from("matches").upsert(
      fixtures.map((f) => ({ ...f, updated_at: new Date().toISOString() })),
      { onConflict: "external_id" },
    );
  }

  const [{ data: matches }, { data: myBets }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_at", { ascending: true }),
    supabase.from("bets").select("match_id").eq("user_id", user.id).eq("bet_category", "match"),
  ]);

  const bettedMatchIds = new Set((myBets ?? []).map((b) => b.match_id).filter(Boolean) as string[]);
  const allMatches = matches ?? [];

  const grouped = allMatches.reduce<Record<string, Match[]>>((acc, m) => {
    const raw = new Date(m.kickoff_at).toLocaleDateString("sv-SE", {
      weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Stockholm",
    });
    const key = raw.charAt(0).toUpperCase() + raw.slice(1);
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  const unlockedCount = allMatches.filter(
    (m) => m.status === "scheduled" && new Date() < new Date(new Date(m.kickoff_at).getTime() - 15 * 60 * 1000)
  ).length;
  const unbettedUnlocked = allMatches.filter(
    (m) => m.status === "scheduled" &&
      !bettedMatchIds.has(m.id) &&
      new Date() < new Date(new Date(m.kickoff_at).getTime() - 15 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bebas text-5xl text-violet-300 tracking-widest">MATCHGISSNINGAR ⚽</h1>
        <p className="text-violet-300/60 text-sm mt-1">
          Alla {unlockedCount} matcher öppna för gissning · låser 15 min före avspark
        </p>
      </div>

      {/* ── Shuffle button ─────────────────────────────────────────────── */}
      {unbettedUnlocked > 0 && (
        <RandomBetButton remaining={unbettedUnlocked} />
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-pitch-light/20 bg-pitch/40 p-10 text-center space-y-3">
          <p className="text-5xl">⏳</p>
          <p className="text-white font-bold text-lg">Laddar matcher…</p>
          <p className="text-green-400 text-sm">Ladda om sidan om ett ögonblick.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([group, groupMatches]) => (
          <div key={group} className="space-y-2">
            <h2 className="font-bebas text-xl text-gold tracking-widest px-1 flex items-center gap-2">
              {group}
              <span className="text-green-700 font-sans text-xs font-normal normal-case">
                {groupMatches.length} {groupMatches.length === 1 ? "match" : "matcher"}
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
                      : hasBet && !isOver
                      ? "border-violet-500/30 bg-violet-900/10"
                      : isOver
                      ? "border-pitch-light/10 bg-pitch/20 opacity-60"
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

                    {/* Right column */}
                    <div className="text-right shrink-0 space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.group_name && (
                          <span className="text-[10px] text-violet-400/50 font-mono">Grupp {m.group_name}</span>
                        )}
                        <p className="text-green-600 text-xs">{formatKickoff(m.kickoff_at)}</p>
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        {hasBet && !isOver && (
                          <span className="text-[10px] text-violet-400 font-semibold">✓ Gissad</span>
                        )}
                        {!isOver && <MatchKickoffBadge kickoffAt={m.kickoff_at} />}
                        {isOver && <span className="text-[10px] text-green-800">Avslutad</span>}
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
