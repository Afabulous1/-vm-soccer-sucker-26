"use client";

import { useState } from "react";
import { getAvatar } from "@/lib/avatars";
import type { LeaderboardEntry } from "@/types/database";

type Tab = "total" | "week" | "streak";

interface Props {
  entries: LeaderboardEntry[];
  currentUserId: string;
  currentUserRank: number | null;
  currentUsername: string;
  currentAvatarKey: string;
  currentUserPoints: number;
}

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: "total",  emoji: "🏆", label: "Totalt" },
  { id: "week",   emoji: "📅", label: "Veckan" },
  { id: "streak", emoji: "🔥", label: "Streak" },
];

export default function LeaderboardTabs({
  entries, currentUserId, currentUserRank, currentUsername, currentAvatarKey, currentUserPoints,
}: Props) {
  const [tab, setTab] = useState<Tab>("total");

  const sorted =
    tab === "total"
      ? [...entries].sort((a, b) => a.rank - b.rank)
      : tab === "week"
      ? [...entries].sort((a, b) => b.weekly_points - a.weekly_points)
      : [...entries].sort((a, b) => b.current_streak - a.current_streak);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex bg-pitch-dark rounded-xl p-1 mb-3 border border-pitch-light/20">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-150 ${
              tab === t.id
                ? "bg-gold/20 text-gold border border-gold/30"
                : "text-green-700 hover:text-green-400"
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-pitch-light/20 bg-pitch/40 overflow-hidden">
        {!sorted.length ? (
          <div className="px-4 py-10 text-center space-y-2">
            <p className="text-4xl">⏳</p>
            <p className="text-white font-bold text-sm">Ligatabellen är tom</p>
            <p className="text-green-600 text-xs">Poäng räknas ut efter avslutade matcher</p>
          </div>
        ) : (
          <div className="divide-y divide-pitch-light/10">
            {sorted.slice(0, 10).map((entry, i) => {
              const avatar  = getAvatar(entry.avatar_key);
              const isMe    = entry.user_id === currentUserId;
              const rank    = tab === "total" ? entry.rank : i + 1;
              const rankLbl = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
              const rankCls = rank === 1 ? "text-gold font-bebas text-2xl" :
                              rank === 2 ? "text-slate-300 font-bebas text-xl" :
                              rank === 3 ? "text-amber-500 font-bebas text-xl" :
                              "text-green-600 font-bold text-sm";

              const mainVal =
                tab === "total"  ? `${entry.points_total.toLocaleString("sv-SE")} p` :
                tab === "week"   ? `${entry.weekly_points.toLocaleString("sv-SE")} p` :
                                   `${entry.current_streak} rätta`;

              const sub =
                tab === "total" && entry.current_streak > 0
                  ? `🔥 ${entry.current_streak} i rad`
                  : tab === "week" && entry.current_streak > 0
                  ? `🔥 ${entry.current_streak} i rad`
                  : tab === "streak"
                  ? `${entry.points_total.toLocaleString("sv-SE")} p totalt`
                  : null;

              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isMe ? "bg-gold/10 border-l-2 border-gold" : "hover:bg-pitch-light/5"
                  }`}
                >
                  <span className={`w-8 text-center shrink-0 ${rankCls}`}>{rankLbl}</span>
                  <div
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${
                      avatar?.gradient ?? "from-pitch to-pitch-light"
                    }`}
                  >
                    {avatar?.emoji ?? "⚽"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? "text-gold" : "text-white"}`}>
                      {entry.username}
                      {isMe && <span className="text-xs text-gold/50 ml-1">(du)</span>}
                    </p>
                    {sub && <p className="text-xs text-orange-400/80">{sub}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${isMe ? "text-gold" : "text-white"}`}>{mainVal}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentUserRank && currentUserRank > 10 && tab === "total" && (
          <div className="border-t-2 border-dashed border-pitch-light/20 px-4 py-3 bg-gold/5">
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-bold text-sm w-8 text-center">#{currentUserRank}</span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${
                  getAvatar(currentAvatarKey)?.gradient ?? ""
                }`}
              >
                {getAvatar(currentAvatarKey)?.emoji}
              </div>
              <span className="text-gold text-sm font-semibold flex-1">{currentUsername} (du)</span>
              <span className="text-gold font-bold text-sm">{currentUserPoints.toLocaleString("sv-SE")} p</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
