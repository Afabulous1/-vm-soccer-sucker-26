import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAvatar } from "@/lib/avatars";
import { BETTING_OPENS, TOURNAMENT_LOCK, TURNERING_BETS, KAOS_BETS, MATCH_BET_TYPES } from "@/lib/bets";
import AvatarCard from "@/components/AvatarCard";
import BigCountdown from "@/components/BigCountdown";
import BottomNav from "@/components/BottomNav";
import MusicPlayer from "@/components/MusicPlayer";
import FeatureGuide from "@/components/FeatureGuide";
import LoginWelcome from "@/components/LoginWelcome";
import LeaderboardTabs from "./LeaderboardTabs";
import TrashTalkWall from "./TrashTalkWall";

function RankBadge({ rank }: { rank: number | null }) {
  if (!rank) return null;
  const style =
    rank === 1 ? "bg-gold/20 text-gold border-gold/40" :
    rank === 2 ? "bg-slate-400/20 text-slate-300 border-slate-400/40" :
    rank === 3 ? "bg-amber-700/20 text-amber-500 border-amber-700/40" :
                 "bg-pitch-light/20 text-green-400 border-pitch-light/40";
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${style}`}>
      {medal}
    </span>
  );
}

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm",
  });
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
    { data: awardedBets },
    { data: pendingBets },
    { data: recentMatches },
    { data: upcomingMatches },
  ] = await Promise.all([
    // Full leaderboard for tabs (sorted by rank)
    supabase.from("leaderboard_cache").select("*").order("rank", { ascending: true }),
    supabase.from("leaderboard_cache")
      .select("rank, current_streak, weekly_points")
      .eq("user_id", user.id).single(),
    supabase.from("bets").select("bet_category").eq("user_id", user.id),
    supabase.from("trash_talk").select("*").order("created_at", { ascending: true }).limit(40),
    // Points already awarded
    supabase.from("bets").select("points_awarded")
      .eq("user_id", user.id).not("points_awarded", "is", null),
    // Pending: locked but not yet evaluated
    supabase.from("bets").select("points_wager")
      .eq("user_id", user.id).not("locked_at", "is", null).is("is_correct", null),
    // Recent finished matches (last 6)
    supabase.from("matches")
      .select("id, home_team, away_team, home_score, away_score, kickoff_at, stage, group_name, status")
      .eq("status", "finished")
      .order("kickoff_at", { ascending: false }).limit(6),
    // Upcoming matches (next 4)
    supabase.from("matches")
      .select("id, home_team, away_team, kickoff_at, stage, group_name")
      .eq("status", "scheduled")
      .order("kickoff_at", { ascending: true }).limit(4),
  ]);

  // ── Bet counts ────────────────────────────────────────────────────────────
  const betCounts = {
    turnering: bets?.filter((b) => b.bet_category === "turnering").length ?? 0,
    kaos:      bets?.filter((b) => b.bet_category === "kaos").length ?? 0,
    match:     bets?.filter((b) => b.bet_category === "match").length ?? 0,
  };

  // ── Potential score ───────────────────────────────────────────────────────
  const awarded = (awardedBets ?? []).reduce((s, b) => s + ((b.points_awarded as number) ?? 0), 0);
  const pending = (pendingBets  ?? []).reduce((s, b) => s + ((b.points_wager  as number) ?? 0), 0);

  const turneringMax   = TURNERING_BETS.reduce((s, b) => s + b.points + (b.bonusPoints ?? 0), 0);
  const kaosMax        = KAOS_BETS.reduce((s, b) => s + b.points, 0);
  const matchMax       = MATCH_BET_TYPES.reduce((s, b) => s + b.points + (b.bonusPoints ?? 0), 0);
  const turneringUnplaced = betCounts.turnering < TURNERING_BETS.length
    ? ((TURNERING_BETS.length - betCounts.turnering) / TURNERING_BETS.length) * turneringMax : 0;
  const kaosUnplaced   = betCounts.kaos < KAOS_BETS.length
    ? ((KAOS_BETS.length - betCounts.kaos) / KAOS_BETS.length) * kaosMax : 0;
  const openMatch      = (upcomingMatches?.length ?? 0) * matchMax;
  const open           = Math.round(turneringUnplaced + kaosUnplaced + openMatch);
  const maxPossible    = awarded + pending + open;

  // ── State flags ───────────────────────────────────────────────────────────
  const now           = new Date();
  const bettingOpen   = now >= BETTING_OPENS;
  const isLocked      = now >= TOURNAMENT_LOCK;
  const avatar        = getAvatar(profile.avatar_key);
  const myRank        = myRankData?.rank ?? null;
  const streak        = myRankData?.current_streak ?? 0;
  const weeklyPts     = myRankData?.weekly_points ?? 0;

  const betCategories = [
    {
      href: "/bets/turnering", emoji: "🏆", label: "Turnering",
      done: betCounts.turnering, total: TURNERING_BETS.length,
      color: "border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-blue-800/20",
      badge: "bg-blue-500/20 text-blue-300",
    },
    {
      href: "/bets/match", emoji: "⚽", label: "Match",
      done: betCounts.match, total: null,
      color: "border-violet-500/30 bg-gradient-to-br from-violet-900/40 to-violet-800/20",
      badge: "bg-violet-500/20 text-violet-300",
    },
    {
      href: "/bets/kaos", emoji: "🔥", label: "Kaos",
      done: betCounts.kaos, total: KAOS_BETS.length,
      color: "border-rose-500/30 bg-gradient-to-br from-rose-900/40 to-rose-800/20",
      badge: "bg-rose-500/20 text-rose-300",
    },
  ];

  return (
    <div className="pitch-bg min-h-screen">
      {/* Subtle pitch grid overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 60px)" }}
      />

      {/* Client-only interactive components */}
      <FeatureGuide />
      <LoginWelcome username={profile.username} />
      <MusicPlayer />

      {/* Top nav */}
      <nav className="relative sticky top-0 z-40 bg-pitch-dark/95 backdrop-blur border-b border-pitch-light/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-bebas text-gold text-2xl tracking-widest hover:text-yellow-400 transition-colors">
            ⚽ VM 26
          </Link>
          <div className="flex items-center gap-3">
            {!isLocked && bettingOpen && (
              <Link
                href="/bets"
                className="bg-gold/10 border border-gold/30 text-gold font-bebas tracking-widest text-sm px-3 py-1.5 rounded-xl hover:bg-gold/20 transition-all"
              >
                GISSA →
              </Link>
            )}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br shadow-inner ${avatar?.gradient ?? "from-pitch to-pitch-light"}`}
            >
              {avatar?.emoji ?? "⚽"}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative max-w-2xl mx-auto px-4 py-5 space-y-5 pb-28">

        {/* ── Hero card ────────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-gold/15 bg-gradient-to-br from-pitch-dark/90 via-pitch/70 to-pitch-dark/80 p-5 shadow-xl shadow-black/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <AvatarCard avatarKey={profile.avatar_key} size="lg" />
              {streak >= 3 && (
                <span className="absolute -top-1 -right-1 text-base">🔥</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-green-600 text-[10px] uppercase tracking-widest mb-0.5">Välkommen tillbaka</p>
              <h1 className="font-bebas text-4xl text-gold tracking-widest leading-none truncate">
                {profile.username.toUpperCase()}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-white font-bold text-xl tabular-nums">
                  {profile.points_total.toLocaleString("sv-SE")} p
                </span>
                <RankBadge rank={myRank} />
                {streak > 0 && (
                  <span className="text-xs bg-orange-900/40 border border-orange-600/30 text-orange-400 font-semibold px-2 py-0.5 rounded-full">
                    🔥 {streak} rätta i rad
                  </span>
                )}
                {weeklyPts > 0 && (
                  <span className="text-xs text-green-400 font-semibold">
                    +{weeklyPts.toLocaleString("sv-SE")}p/v
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Countdown / status banner ─────────────────────────────────── */}
        {!bettingOpen ? (
          /* Pre June 1 — big countdown */
          <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-pitch-dark/90 to-pitch/60 p-6 text-center space-y-4 shadow-xl">
            <div>
              <p className="font-bebas text-xl text-green-400 tracking-widest">GISSNINGARNA ÖPPNAR</p>
              <p className="font-bebas text-4xl text-gold tracking-widest">1 JUNI 2026</p>
            </div>
            <BigCountdown target={BETTING_OPENS.toISOString()} />
            <p className="text-green-600 text-xs">
              10 dagar på dig att lägga alla gissningar · passa på att planera din strategi!
            </p>
          </div>
        ) : !isLocked ? (
          /* June 1–11 — tournament countdown + CTA */
          <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-900/20 to-amber-800/10 px-5 py-4 flex items-center justify-between gap-4 shadow-lg">
            <div>
              <p className="text-amber-300 text-[10px] font-bold uppercase tracking-widest">Turneringen låser om</p>
              <div className="mt-1">
                <BigCountdown target={TOURNAMENT_LOCK.toISOString()} />
              </div>
            </div>
            <Link
              href="/bets"
              className="shrink-0 bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-lg tracking-widest px-5 py-2.5 rounded-xl transition-all active:scale-95"
            >
              GISSA NU
            </Link>
          </div>
        ) : (
          /* Tournament live */
          <div className="rounded-2xl border border-green-500/25 bg-gradient-to-br from-green-900/20 to-green-800/10 px-5 py-4 text-center shadow-lg">
            <p className="text-green-400 font-bebas text-2xl tracking-widest">🏟️ VM 2026 ÄR LIVE!</p>
            <p className="text-green-600 text-xs mt-1">Matcherna pågår — följ poängen nedan</p>
          </div>
        )}

        {/* ── MAXPOÄNG card ─────────────────────────────────────────────── */}
        {maxPossible > 0 && (
          <div className="rounded-2xl border border-pitch-light/20 bg-pitch/40 p-5 space-y-3">
            <h2 className="font-bebas text-xl text-gold tracking-widest flex items-center gap-2">
              MAXPOÄNG <span className="text-green-700 text-xs font-sans font-normal normal-case">vad du kan nå</span>
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-green-400">✅ Intjänade:</span>
              <span className="text-white font-bold text-right">{awarded.toLocaleString("sv-SE")} p</span>
              <span className="text-amber-300">⏳ Väntande:</span>
              <span className="text-white font-bold text-right">+{pending.toLocaleString("sv-SE")} p</span>
              <span className="text-blue-300">🔮 Möjliga:</span>
              <span className="text-white font-bold text-right">+{open.toLocaleString("sv-SE")} p</span>
              <span className="text-gold font-semibold border-t border-pitch-light/20 pt-1.5">MAX:</span>
              <span className="text-gold font-bebas text-2xl text-right border-t border-pitch-light/20 pt-0.5">
                {maxPossible.toLocaleString("sv-SE")} p
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden bg-pitch-dark flex">
              <div className="bg-green-500 h-full" style={{ width: `${(awarded / maxPossible) * 100}%` }} />
              <div className="bg-amber-400 h-full" style={{ width: `${(pending / maxPossible) * 100}%` }} />
              <div className="bg-blue-500 h-full" style={{ width: `${(open / maxPossible) * 100}%` }} />
            </div>
            <div className="flex gap-3 text-[10px] text-green-700">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Intjänade</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Väntande</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Möjliga</span>
            </div>
          </div>
        )}

        {/* ── Bet category cards ────────────────────────────────────────── */}
        <div>
          <h2 className="font-bebas text-2xl text-gold tracking-widest mb-3">MINA GISSNINGAR</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {betCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`rounded-2xl border p-4 text-center hover:scale-[1.03] hover:shadow-lg transition-all duration-150 active:scale-95 ${cat.color}`}
              >
                <div className="text-3xl mb-1.5">{cat.emoji}</div>
                <p className="text-white font-bold text-xs mb-2 leading-tight">{cat.label}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cat.badge}`}>
                  {cat.total ? `${cat.done}/${cat.total}` : `${cat.done} st`}
                </span>
                {cat.total !== null && cat.done < cat.total && bettingOpen && !isLocked && (
                  <p className="text-amber-400 text-[10px] mt-1.5 font-semibold">{cat.total - cat.done} kvar ⚡</p>
                )}
                {cat.total !== null && cat.done === cat.total && (
                  <p className="text-green-400 text-[10px] mt-1.5">✓ Klart!</p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent results ────────────────────────────────────────────── */}
        {(recentMatches ?? []).length > 0 && (
          <div>
            <h2 className="font-bebas text-2xl text-gold tracking-widest mb-3">SENASTE RESULTAT</h2>
            <div className="space-y-2">
              {(recentMatches ?? []).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-pitch-light/20 bg-pitch/30 px-4 py-3"
                >
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-white font-semibold text-sm truncate">{m.home_team}</p>
                  </div>
                  <div className="shrink-0 text-center px-3">
                    <p className="font-bebas text-xl text-gold tracking-widest">
                      {m.home_score} – {m.away_score}
                    </p>
                    <p className="text-green-700 text-[10px]">
                      {m.group_name ? `Grupp ${m.group_name}` : m.stage}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{m.away_team}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Upcoming matches ──────────────────────────────────────────── */}
        {(upcomingMatches ?? []).length > 0 && (
          <div>
            <h2 className="font-bebas text-2xl text-gold tracking-widest mb-3">KOMMANDE MATCHER</h2>
            <div className="space-y-2">
              {(upcomingMatches ?? []).map((m) => (
                <Link
                  key={m.id}
                  href={`/bets/match/${m.id}`}
                  className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-900/10 px-4 py-3 hover:border-violet-500/40 transition-all group"
                >
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-white font-semibold text-sm truncate">{m.home_team}</p>
                  </div>
                  <div className="shrink-0 text-center px-3">
                    <p className="text-green-700 font-bold text-xs">vs</p>
                    <p className="text-violet-400 text-[10px] mt-0.5">{formatKickoff(m.kickoff_at)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{m.away_team}</p>
                  </div>
                  <span className="shrink-0 text-violet-500 group-hover:text-violet-300 transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Leaderboard (tabbed) ──────────────────────────────────────── */}
        <div>
          <h2 className="font-bebas text-2xl text-gold tracking-widest mb-3">LIGATABELLEN</h2>
          <LeaderboardTabs
            entries={leaderboard ?? []}
            currentUserId={user.id}
            currentUserRank={myRank}
            currentUsername={profile.username}
            currentAvatarKey={profile.avatar_key}
            currentUserPoints={profile.points_total}
          />
        </div>

        {/* ── Trash talk ────────────────────────────────────────────────── */}
        <TrashTalkWall
          initialMessages={messages ?? []}
          currentUserId={user.id}
        />

      </div>

      <BottomNav />
    </div>
  );
}
