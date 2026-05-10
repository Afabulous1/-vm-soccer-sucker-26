import { getAvatar } from "@/lib/avatars";
import type { LeaderboardEntry } from "@/types/database";

const SEMI_START  = new Date("2026-07-08T00:00:00Z");
const QF_START    = new Date("2026-07-04T00:00:00Z");
const R16_START   = new Date("2026-06-29T00:00:00Z");
const GROUP_END   = new Date("2026-06-28T23:59:59Z");
const FINAL_DAY   = new Date("2026-07-19T00:00:00Z");

function getTournamentPhase(now: Date): string {
  if (now >= FINAL_DAY)    return "final";
  if (now >= SEMI_START)   return "semi";
  if (now >= QF_START)     return "quarter";
  if (now >= R16_START)    return "r16";
  if (now >= GROUP_END)    return "group_done";
  return "group";
}

function PhaseAnnouncement({ phase }: { phase: string }) {
  const msgs: Record<string, { emoji: string; title: string; text: string }> = {
    group:      { emoji: "⚽", title: "Gruppspelet pågår!", text: "Matchar spelas varje dag. Poäng räknas ut direkt efter varje match." },
    group_done: { emoji: "🏆", title: "Gruppspelet är klart!", text: "De 16 bästa lagen möts nu i slutspelet — varje match är allt eller inget." },
    r16:        { emoji: "⚡", title: "Åttondelsfinaler!", text: "16 lag kvar. Ingen returbiljett. Gissningarna avgör allt nu." },
    quarter:    { emoji: "🔥", title: "Kvartsfinalerna!", text: "8 lag kvar om VM-titeln. Spänningen är på topp." },
    semi:       { emoji: "🎯", title: "Semifinalerna!", text: "4 lag kvar. Och din Joker-kraft kan nu aktiveras — stjäl poäng från en motståndare!" },
    final:      { emoji: "🥇", title: "VM-FINALEN!", text: "Turneringens sista match. Allt avgörs idag. Lycka till!" },
  };
  const m = msgs[phase] ?? msgs.group;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gold/5 border border-gold/20">
      <span className="text-2xl shrink-0">{m.emoji}</span>
      <div>
        <p className="font-bebas text-gold tracking-wider text-base leading-none">{m.title}</p>
        <p className="text-green-300 text-xs mt-0.5">{m.text}</p>
      </div>
    </div>
  );
}

export default function LiveFeedSection({
  now,
  leaderboard,
}: {
  now: Date;
  leaderboard: LeaderboardEntry[];
}) {
  if (!leaderboard.length) return null;
  const phase = getTournamentPhase(now);
  const leader = leaderboard[0];
  const avatar = getAvatar(leader.avatar_key);

  return (
    <div className="space-y-2">
      <h2 className="font-bebas text-xl text-gold tracking-widest flex items-center gap-2">
        📡 LIVE <span className="text-green-700 text-xs font-sans font-normal normal-case">turneringsstatus</span>
      </h2>

      <PhaseAnnouncement phase={phase} />

      {/* Current leader */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-pitch/40 border border-pitch-light/20">
        <span className="text-lg shrink-0">🏆</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 bg-gradient-to-br ${avatar?.gradient ?? "from-pitch to-pitch-light"}`}>
          {avatar?.emoji ?? "⚽"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-green-600 uppercase tracking-widest">Poängledare just nu</p>
          <p className="text-white font-bold text-sm truncate">{leader.username}</p>
        </div>
        <p className="text-gold font-bebas text-xl shrink-0">{leader.points_total.toLocaleString("sv-SE")} p</p>
      </div>

      {/* Streak king if different from leader */}
      {leaderboard.some((e) => e.current_streak >= 3) && (() => {
        const streakKing = [...leaderboard].sort((a, b) => b.current_streak - a.current_streak)[0];
        if (streakKing.current_streak < 3) return null;
        const sav = getAvatar(streakKing.avatar_key);
        return (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-900/20 border border-orange-600/20">
            <span className="text-lg shrink-0">🔥</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 bg-gradient-to-br ${sav?.gradient ?? "from-pitch to-pitch-light"}`}>
              {sav?.emoji ?? "⚽"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-orange-600 uppercase tracking-widest">Hetaste streken</p>
              <p className="text-white font-bold text-sm truncate">{streakKing.username}</p>
            </div>
            <p className="text-orange-400 font-bebas text-xl shrink-0">{streakKing.current_streak} rätt i rad</p>
          </div>
        );
      })()}
    </div>
  );
}
