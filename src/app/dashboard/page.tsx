import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAvatar } from "@/lib/avatars";
import { BETTING_OPENS, TOURNAMENT_LOCK, TURNERING_BETS, KAOS_BETS, MATCH_BET_TYPES } from "@/lib/bets";
import { WC_GROUPS_DATA } from "@/lib/teams";
import { getNowServer } from "@/lib/now";
import AvatarCard from "@/components/AvatarCard";
import BigCountdown from "@/components/BigCountdown";
import BottomNav from "@/components/BottomNav";
import FeatureGuide from "@/components/FeatureGuide";
import LoginWelcome from "@/components/LoginWelcome";
import LeaderboardTabs from "./LeaderboardTabs";
import LiveFeedSection from "./LiveFeedSection";
import TrashTalkWall from "./TrashTalkWall";
import { getFlag } from "@/lib/flags";

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
    { data: allProfiles },
    { data: jokerInv },
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
    // Pending: placed but not yet evaluated (includes tournament/kaos bets pre-lock)
    supabase.from("bets").select("points_wager")
      .eq("user_id", user.id).is("is_correct", null),
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
    // All signed-up users
    supabase.from("profiles")
      .select("user_id, username, avatar_key, points_total, created_at")
      .order("created_at", { ascending: true }),
    // Joker inventory
    supabase.from("user_powerups")
      .select("quantity")
      .eq("user_id", user.id)
      .eq("powerup_type", "joker")
      .maybeSingle(),
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

  const turneringMax = TURNERING_BETS.reduce((s, b) => s + b.points + (b.bonusPoints ?? 0), 0);
  const kaosMax      = KAOS_BETS.reduce((s, b) => s + b.points, 0);
  // Track A: 2 bets per match — match_result (100p) + total_goals_match (50p)
  const matchMax     = MATCH_BET_TYPES.reduce((s, b) => s + b.points, 0);
  const turneringUnplaced = betCounts.turnering < TURNERING_BETS.length
    ? ((TURNERING_BETS.length - betCounts.turnering) / TURNERING_BETS.length) * turneringMax : 0;
  const kaosUnplaced   = betCounts.kaos < KAOS_BETS.length
    ? ((KAOS_BETS.length - betCounts.kaos) / KAOS_BETS.length) * kaosMax : 0;
  const openMatch      = (upcomingMatches?.length ?? 0) * matchMax;
  const open           = Math.round(turneringUnplaced + kaosUnplaced + openMatch);
  const maxPossible    = awarded + pending + open;

  // ── State flags ───────────────────────────────────────────────────────────
  const now           = await getNowServer();
  const bettingOpen   = now >= BETTING_OPENS;
  const isLocked      = now >= TOURNAMENT_LOCK;
  const SEMI_START    = new Date("2026-07-08T00:00:00Z");
  const isSemiPhase   = now >= SEMI_START;
  const hasJoker      = (jokerInv?.quantity ?? 0) > 0;
  const avatar        = getAvatar(profile.avatar_key);
  const myRank        = myRankData?.rank ?? null;
  const streak        = myRankData?.current_streak ?? 0;
  const weeklyPts     = myRankData?.weekly_points ?? 0;

  const trackACategories = [
    {
      href: "/bets/turnering", emoji: "🏆", label: "Turnering",
      sublabel: "Vem vinner VM?",
      done: betCounts.turnering, total: TURNERING_BETS.length,
      color: "border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-blue-800/20",
      badge: "bg-blue-500/20 text-blue-300",
    },
    {
      href: "/bets/match", emoji: "⚽", label: "Matcher",
      sublabel: "1-X-2 + mål/match",
      done: betCounts.match, total: null,
      color: "border-violet-500/30 bg-gradient-to-br from-violet-900/40 to-violet-800/20",
      badge: "bg-violet-500/20 text-violet-300",
    },
  ];

  const trackBCategory = {
    href: "/bets/kaos", emoji: "🔥", label: "Party Predictions",
    sublabel: "Galna scenarion — 10k p/st",
    done: betCounts.kaos, total: KAOS_BETS.length,
    color: "border-rose-500/30 bg-gradient-to-br from-rose-900/30 to-orange-900/20",
    badge: "bg-rose-500/20 text-rose-300",
  };

  // Urgency: unplaced bets before lock
  const turneringLeft = TURNERING_BETS.length - betCounts.turnering;
  const kaosLeft = KAOS_BETS.length - betCounts.kaos;
  const totalLeft = turneringLeft + kaosLeft;
  const showUrgency = bettingOpen && !isLocked && totalLeft > 0;

  // Total groups count for context
  const totalGroups = WC_GROUPS_DATA.length;

  return (
    <div className="pitch-bg min-h-screen">
      {/* Subtle pitch grid overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 60px)" }}
      />

      {/* Client-only interactive components */}
      <FeatureGuide />
      <LoginWelcome username={profile.username} />

      {/* Top nav */}
      <nav className="relative sticky top-0 z-40 bg-pitch-dark/95 backdrop-blur border-b border-pitch-light/20">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex flex-col leading-none hover:opacity-80 transition-opacity">
            <span className="font-bebas text-gold text-xl tracking-widest">⚽ VM SOCCER SUCKER</span>
            <span className="text-green-700 text-[9px] tracking-widest uppercase font-bold">World Cup 2026</span>
          </Link>
          <div className="flex items-center gap-2">
            {!isLocked && bettingOpen && (
              <Link
                href="/bets"
                className="bg-gold/10 border border-gold/30 text-gold font-bebas tracking-widest text-sm px-3 py-1.5 rounded-xl hover:bg-gold/20 transition-all active:scale-95"
              >
                GISSA →
              </Link>
            )}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br shadow-inner shrink-0 ${avatar?.gradient ?? "from-pitch to-pitch-light"}`}
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
                    🔥 {streak} rätt i rad
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
              10 dagar på dig att lägga alla gissningar — alla 72 matcher finns tillgängliga!
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

        {/* ── Live feed / announcements ──────────────────────────────────── */}
        <LiveFeedSection now={now} leaderboard={leaderboard ?? []} />

        {/* ── Urgency CTA ──────────────────────────────────────────────── */}
        {showUrgency && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-900/30 to-orange-900/20 p-4 space-y-3 shadow-lg shadow-amber-900/20">
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">⚡</span>
              <div className="flex-1 min-w-0">
                <p className="text-amber-300 font-bebas text-xl tracking-wider leading-none">
                  {totalLeft} GISSNINGAR KVAR ATT LÄGGA!
                </p>
                <p className="text-amber-400/70 text-xs mt-0.5">
                  Låser 11 juni kl 19:00 · Missa inte poängen
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {turneringLeft > 0 && (
                <Link
                  href="/bets/turnering"
                  className="flex-1 min-w-[120px] bg-blue-600/80 hover:bg-blue-500 text-white font-bebas text-sm tracking-widest py-2.5 px-3 rounded-xl transition-all active:scale-95 text-center touch-manipulation"
                >
                  🏆 {turneringLeft} Turnering
                </Link>
              )}
              {kaosLeft > 0 && (
                <Link
                  href="/bets/kaos"
                  className="flex-1 min-w-[120px] bg-rose-600/80 hover:bg-rose-500 text-white font-bebas text-sm tracking-widest py-2.5 px-3 rounded-xl transition-all active:scale-95 text-center touch-manipulation"
                >
                  🔥 {kaosLeft} Party
                </Link>
              )}
              <Link
                href="/bets/match"
                className="flex-1 min-w-[120px] bg-violet-600/80 hover:bg-violet-500 text-white font-bebas text-sm tracking-widest py-2.5 px-3 rounded-xl transition-all active:scale-95 text-center touch-manipulation"
              >
                ⚽ Matcher →
              </Link>
            </div>
          </div>
        )}

        {/* ── Bet category cards ────────────────────────────────────────── */}
        <div>
          <h2 className="font-bebas text-2xl text-gold tracking-widest mb-3">MINA GISSNINGAR</h2>

          {/* Track A */}
          <div className="mb-2">
            <p className="text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
              ⚽ Fan Track — kräver fotbollskännedom
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {trackACategories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className={`rounded-2xl border p-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-150 active:scale-95 touch-manipulation ${cat.color}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl shrink-0">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm leading-tight">{cat.label}</p>
                      <p className="text-green-600 text-[10px] mt-0.5 leading-tight">{cat.sublabel}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cat.badge}`}>
                      {cat.total ? `${cat.done}/${cat.total}` : `${cat.done} spel`}
                    </span>
                    {cat.total !== null && cat.done < cat.total && bettingOpen && !isLocked && (
                      <span className="text-amber-400 text-[10px] font-semibold">{cat.total - cat.done} kvar ⚡</span>
                    )}
                    {cat.total !== null && cat.done === cat.total && (
                      <span className="text-green-400 text-[10px]">✓ Klart!</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Track B */}
          <div>
            <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              🔥 Party Track — perfekt för alla
            </p>
            <Link
              href={trackBCategory.href}
              className={`block rounded-2xl border p-4 hover:scale-[1.01] hover:shadow-lg transition-all duration-150 active:scale-95 touch-manipulation ${trackBCategory.color}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl shrink-0">{trackBCategory.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base leading-tight">{trackBCategory.label}</p>
                  <p className="text-green-600 text-xs mt-0.5">{trackBCategory.sublabel}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold block mb-1 ${trackBCategory.badge}`}>
                    {trackBCategory.done}/{trackBCategory.total}
                  </span>
                  {trackBCategory.done < (trackBCategory.total ?? 0) && bettingOpen && !isLocked && (
                    <span className="text-amber-400 text-[10px] font-semibold">{(trackBCategory.total ?? 0) - trackBCategory.done} kvar ⚡</span>
                  )}
                  {trackBCategory.done === trackBCategory.total && (
                    <span className="text-green-400 text-[10px]">✓ Klart!</span>
                  )}
                </div>
              </div>
              <p className="text-rose-300/50 text-[10px] mt-2">
                48 lag · {totalGroups} grupper · 10 000p per rätt kaos-gissning
              </p>
            </Link>
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
                    <p className="text-white font-semibold text-sm truncate">{getFlag(m.home_team)} {m.home_team}</p>
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
                    <p className="text-white font-semibold text-sm truncate">{getFlag(m.away_team)} {m.away_team}</p>
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
                    <p className="text-white font-semibold text-sm truncate">{getFlag(m.home_team)} {m.home_team}</p>
                  </div>
                  <div className="shrink-0 text-center px-3">
                    <p className="text-green-700 font-bold text-xs">vs</p>
                    <p className="text-violet-400 text-[10px] mt-0.5">{formatKickoff(m.kickoff_at)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{getFlag(m.away_team)} {m.away_team}</p>
                  </div>
                  <span className="shrink-0 text-violet-500 group-hover:text-violet-300 transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Joker card ───────────────────────────────────────────────── */}
        {hasJoker && isSemiPhase && (
          <Link
            href="/dashboard/joker"
            className="block rounded-2xl border-2 border-purple-500/60 bg-gradient-to-br from-purple-900/50 via-pitch/60 to-pitch-dark/80 p-5 hover:border-purple-400/80 hover:scale-[1.02] transition-all duration-200 shadow-xl shadow-purple-900/30 active:scale-95"
          >
            <div className="flex items-center gap-4">
              <span className="text-5xl">🃏</span>
              <div className="flex-1 min-w-0">
                <p className="font-bebas text-2xl text-purple-300 tracking-widest leading-none">JOKER AKTIV!</p>
                <p className="text-green-300 text-xs mt-1">
                  Stjäl poängen från en annan spelares matchvinst. Kan bara användas en gång — välj klokt!
                </p>
              </div>
              <span className="shrink-0 text-purple-400 text-2xl">→</span>
            </div>
          </Link>
        )}
        {hasJoker && !isSemiPhase && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-900/10 p-4 flex items-center gap-3">
            <span className="text-3xl shrink-0">🃏</span>
            <div>
              <p className="font-bebas text-purple-400 tracking-wider">JOKER — LÅST TILLS SEMIFINAL</p>
              <p className="text-green-700 text-xs">Aktiveras 8 juli när semifinalerna börjar.</p>
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

        {/* ── Deltagare ─────────────────────────────────────────────────── */}
        <div>
          <h2 className="font-bebas text-2xl text-gold tracking-widest mb-3">
            DELTAGARE ({allProfiles?.length ?? 0})
          </h2>
          <div className="rounded-2xl border border-pitch-light/20 bg-pitch/40 divide-y divide-pitch-light/10">
            {(allProfiles ?? []).map((p, i) => {
              const av = getAvatar(p.avatar_key);
              const isMe = p.user_id === user.id;
              return (
                <div key={p.user_id} className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-gold/5" : ""}`}>
                  <span className="text-green-700 text-xs w-5 shrink-0 tabular-nums">{i + 1}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 bg-gradient-to-br ${av?.gradient ?? "from-pitch to-pitch-light"}`}>
                    {av?.emoji ?? "⚽"}
                  </div>
                  <span className={`font-semibold text-sm flex-1 truncate ${isMe ? "text-gold" : "text-white"}`}>
                    {p.username}{isMe && " (du)"}
                  </span>
                  <span className="text-green-400 text-xs tabular-nums shrink-0">
                    {p.points_total.toLocaleString("sv-SE")} p
                  </span>
                </div>
              );
            })}
            {!allProfiles?.length && (
              <p className="text-green-700 text-sm px-4 py-4 text-center">Inga deltagare ännu.</p>
            )}
          </div>
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
