import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAvatar } from "@/lib/avatars";
import { TOURNAMENT_LOCK, TURNERING_BETS, KAOS_BETS } from "@/lib/bets";
import AvatarCard from "@/components/AvatarCard";
import CountdownTimer from "@/components/CountdownTimer";
import TrashTalkWall from "./TrashTalkWall";
import type { LeaderboardEntry } from "@/types/database";

function RankBadge({ rank }: { rank: number | null }) {
  if (!rank) return null;
  const style =
    rank === 1 ? "bg-gold/20 text-gold border-gold/40" :
    rank === 2 ? "bg-slate-400/20 text-slate-300 border-slate-400/40" :
    rank === 3 ? "bg-amber-700/20 text-amber-600 border-amber-700/40" :
                 "bg-pitch-light/20 text-green-400 border-pitch-light/40";
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${style}`}>
      {medal} #{rank}
    </span>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
}) {
  const avatar = getAvatar(entry.avatar_key);
  const rankLabel =
    index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${entry.rank}`;
  const rankStyle =
    index === 0 ? "text-gold font-bebas text-2xl" :
    index === 1 ? "text-slate-300 font-bebas text-xl" :
    index === 2 ? "text-amber-600 font-bebas text-xl" :
                  "text-green-600 font-bold text-sm";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${
      isCurrentUser ? "bg-gold/10 border-l-2 border-gold" : "hover:bg-pitch-light/10"
    }`}>
      <span className={`w-8 text-center shrink-0 ${rankStyle}`}>{rankLabel}</span>
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${avatar?.gradient ?? "from-pitch to-pitch-light"}`}>
        {avatar?.emoji ?? "⚽"}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentUser ? "text-gold" : "text-white"}`}>
          {entry.username}
          {isCurrentUser && <span className="text-xs text-gold/60 ml-1">(du)</span>}
        </p>
        {entry.current_streak > 0 && (
          <p className="text-xs text-orange-400">🔥 {entry.current_streak} rätta i rad</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-white font-bold text-sm">{entry.points_total} p</p>
        {entry.weekly_points > 0 && (
          <p className="text-green-500 text-xs">+{entry.weekly_points}p/vecka</p>
        )}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_key, points_total")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const [
    { data: leaderboard },
    { data: myRankData },
    { data: bets },
    { data: messages },
  ] = await Promise.all([
    supabase
      .from("leaderboard_cache")
      .select("*")
      .order("rank", { ascending: true })
      .limit(10),
    supabase
      .from("leaderboard_cache")
      .select("rank, current_streak, weekly_points")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("bets")
      .select("bet_category")
      .eq("user_id", user.id),
    supabase
      .from("trash_talk")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(40),
  ]);

  const betCounts = {
    turnering: bets?.filter((b) => b.bet_category === "turnering").length ?? 0,
    kaos:      bets?.filter((b) => b.bet_category === "kaos").length ?? 0,
    match:     bets?.filter((b) => b.bet_category === "match").length ?? 0,
  };

  const avatar = getAvatar(profile.avatar_key);
  const isLocked = new Date() >= TOURNAMENT_LOCK;
  const myRank = myRankData?.rank ?? null;
  const streak = myRankData?.current_streak ?? 0;
  const weeklyPts = myRankData?.weekly_points ?? 0;

  const betCategories = [
    {
      href: "/bets/turnering",
      emoji: "🏆",
      label: "Turnering",
      done: betCounts.turnering,
      total: TURNERING_BETS.length,
      color: "border-blue-500/40 bg-blue-900/20",
      badge: "bg-blue-500/20 text-blue-300",
    },
    {
      href: "/bets/match",
      emoji: "⚽",
      label: "Match",
      done: betCounts.match,
      total: null,
      color: "border-violet-500/40 bg-violet-900/20",
      badge: "bg-violet-500/20 text-violet-300",
    },
    {
      href: "/bets/kaos",
      emoji: "🔥",
      label: "Kaos",
      done: betCounts.kaos,
      total: KAOS_BETS.length,
      color: "border-rose-500/40 bg-rose-900/20",
      badge: "bg-rose-500/20 text-rose-300",
    },
  ];

  return (
    <div className="pitch-bg min-h-screen">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-pitch-dark/90 backdrop-blur border-b border-pitch-light/30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-bebas text-gold text-2xl tracking-widest">
            ⚽ VM 26
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/bets" className="text-green-400 hover:text-white text-sm font-semibold transition-colors">
              Gissningar →
            </Link>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${avatar?.gradient ?? "from-pitch to-pitch-light"}`}>
              {avatar?.emoji ?? "⚽"}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-16">

        {/* Hero */}
        <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-pitch-dark/80 to-pitch/60 p-6">
          <div className="flex items-center gap-4">
            <AvatarCard avatarKey={profile.avatar_key} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-green-400 text-xs uppercase tracking-widest mb-1">Välkommen tillbaka</p>
              <h1 className="font-bebas text-4xl text-gold tracking-widest leading-none truncate">
                {profile.username.toUpperCase()}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-white font-bold text-lg">{profile.points_total} p</span>
                <RankBadge rank={myRank} />
                {streak > 0 && (
                  <span className="text-xs text-orange-400 font-semibold">🔥 {streak} i rad</span>
                )}
                {weeklyPts > 0 && (
                  <span className="text-xs text-green-400">+{weeklyPts}p denna vecka</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tournament countdown / live status */}
        {!isLocked ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">VM startar om</p>
              <div className="mt-0.5">
                <CountdownTimer locksAt={TOURNAMENT_LOCK} />
              </div>
            </div>
            <Link
              href="/bets"
              className="shrink-0 bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-base tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              LÄGG GISSNINGAR
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-green-500/30 bg-green-900/10 px-4 py-3 text-center">
            <p className="text-green-400 font-bebas text-xl tracking-widest">🏟️ TURNERINGEN ÄR IGÅNG!</p>
            <p className="text-green-600 text-xs mt-0.5">VM 2026 är live — följ matcher och poäng nedan</p>
          </div>
        )}

        {/* Bet category cards */}
        <div>
          <h2 className="font-bebas text-2xl text-gold tracking-widest mb-3">MINA GISSNINGAR</h2>
          <div className="grid grid-cols-3 gap-3">
            {betCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`rounded-xl border p-4 text-center hover:scale-[1.02] transition-all duration-150 ${cat.color}`}
              >
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <p className="text-white font-bold text-xs mb-2">{cat.label}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.badge}`}>
                  {cat.total ? `${cat.done}/${cat.total}` : `${cat.done} st`}
                </span>
                {cat.total !== null && cat.done < cat.total && !isLocked && (
                  <p className="text-amber-400 text-[10px] mt-1">{cat.total - cat.done} kvar ⚡</p>
                )}
                {cat.total !== null && cat.done === cat.total && (
                  <p className="text-green-400 text-[10px] mt-1">Klart ✓</p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="font-bebas text-2xl text-gold tracking-widest mb-3">LIGATABELLEN</h2>
          <div className="rounded-2xl border border-pitch-light/30 bg-pitch/40 overflow-hidden">
            {!leaderboard?.length ? (
              <div className="px-4 py-10 text-center space-y-2">
                <p className="text-4xl">⏳</p>
                <p className="text-white font-bold text-sm">Ligatabellen är tom</p>
                <p className="text-green-600 text-xs">Poäng räknas ut efter avslutade matcher — vi ses den 11 juni!</p>
              </div>
            ) : (
              <div className="divide-y divide-pitch-light/10">
                {leaderboard.map((entry, i) => (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    isCurrentUser={entry.user_id === user.id}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* Show user's position if outside top 10 */}
            {myRank && myRank > 10 && (
              <div className="border-t-2 border-dashed border-pitch-light/20 px-4 py-3 bg-gold/5">
                <div className="flex items-center gap-3">
                  <span className="text-green-600 font-bold text-sm w-8 text-center">#{myRank}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${avatar?.gradient ?? ""}`}>
                    {avatar?.emoji}
                  </div>
                  <span className="text-gold text-sm font-semibold flex-1">{profile.username} (du)</span>
                  <span className="text-white font-bold text-sm">{profile.points_total} p</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trash talk */}
        <TrashTalkWall
          initialMessages={messages ?? []}
          currentUserId={user.id}
        />

      </div>
    </div>
  );
}
