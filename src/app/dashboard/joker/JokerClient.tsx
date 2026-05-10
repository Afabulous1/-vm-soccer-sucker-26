"use client";

import { useState, useTransition } from "react";
import { getAvatar } from "@/lib/avatars";
import { getFlag } from "@/lib/flags";
import { executeJoker } from "./actions";

const BET_TYPE_LABELS: Record<string, string> = {
  match_result:  "Matchresultat",
  exact_score:   "Exakt resultat",
  first_scorer:  "Första målskytt",
  red_card_shown: "Rött kort",
  yellow_cards:  "Gula kort",
};

interface WinningBet {
  id: string;
  betType: string;
  pointsAwarded: number;
  match: {
    id: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
  } | null;
}

interface User {
  user_id: string;
  username: string;
  avatar_key: string;
  points_total: number;
  winningBets: WinningBet[];
}

interface Props {
  users: User[];
}

export default function JokerClient({ users }: Props) {
  const [step, setStep] = useState<"pick-user" | "pick-bet" | "confirm">("pick-user");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBet, setSelectedBet] = useState<WinningBet | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pickUser(u: User) {
    setSelectedUser(u);
    setSelectedBet(null);
    setStep("pick-bet");
  }

  function pickBet(b: WinningBet) {
    setSelectedBet(b);
    setStep("confirm");
  }

  function confirmSteal() {
    if (!selectedUser || !selectedBet) return;
    setError(null);
    startTransition(async () => {
      const result = await executeJoker(selectedUser.user_id, selectedBet.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        {["1. Välj spelare", "2. Välj vinst", "3. Bekräfta"].map((label, i) => {
          const stepMap = ["pick-user", "pick-bet", "confirm"];
          const active = stepMap[i] === step;
          const done = stepMap.indexOf(step) > i;
          return (
            <span key={label} className={`px-2 py-1 rounded-lg ${active ? "bg-joker/20 text-joker border border-joker/40" : done ? "text-green-400" : "text-green-800"}`}>
              {done ? "✓ " : ""}{label}
            </span>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Pick victim */}
      {step === "pick-user" && (
        <div className="space-y-2">
          <p className="text-green-400 text-xs">Välj vem du vill råna på poäng:</p>
          {users.length === 0 && (
            <p className="text-green-700 text-sm text-center py-6">Inga andra spelare med vinster hittades.</p>
          )}
          {users.map((u) => {
            const av = getAvatar(u.avatar_key);
            return (
              <button
                key={u.user_id}
                onClick={() => pickUser(u)}
                disabled={u.winningBets.length === 0}
                className="w-full flex items-center gap-3 rounded-xl border border-pitch-light/20 bg-pitch/40 px-4 py-3 hover:border-joker/40 hover:bg-joker/5 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br shrink-0 ${av?.gradient ?? "from-pitch to-pitch-light"}`}>
                  {av?.emoji ?? "⚽"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{u.username}</p>
                  <p className="text-green-600 text-xs">
                    {u.winningBets.length} vinst{u.winningBets.length !== 1 ? "er" : ""} att stjäla
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-gold font-bebas text-lg">{u.points_total.toLocaleString("sv-SE")} p</p>
                  <p className="text-joker text-xs opacity-0 group-hover:opacity-100 transition-opacity">Välj →</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Pick bet to steal */}
      {step === "pick-bet" && selectedUser && (
        <div className="space-y-2">
          <button onClick={() => setStep("pick-user")} className="text-green-600 text-xs hover:text-green-400">← Tillbaka</button>
          <p className="text-green-400 text-xs">
            Välj vilket matchresultat du vill stjäla från <strong className="text-white">{selectedUser.username}</strong>:
          </p>
          {selectedUser.winningBets.length === 0 && (
            <p className="text-green-700 text-sm text-center py-6">Den här spelaren har inga vinster att stjäla.</p>
          )}
          {selectedUser.winningBets.map((b) => (
            <button
              key={b.id}
              onClick={() => pickBet(b)}
              className="w-full flex items-center gap-3 rounded-xl border border-pitch-light/20 bg-pitch/40 px-4 py-3 hover:border-joker/40 hover:bg-joker/5 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                {b.match && (
                  <p className="text-white font-bold text-sm">
                    {getFlag(b.match.home_team)} {b.match.home_team} {b.match.home_score}–{b.match.away_score} {b.match.away_team} {getFlag(b.match.away_team)}
                  </p>
                )}
                <p className="text-green-500 text-xs">{BET_TYPE_LABELS[b.betType] ?? b.betType}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-joker font-bebas text-xl">+{b.pointsAwarded} p</p>
                <p className="text-joker text-xs opacity-0 group-hover:opacity-100 transition-opacity">Stjäl →</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && selectedUser && selectedBet && (
        <div className="space-y-4">
          <button onClick={() => setStep("pick-bet")} className="text-green-600 text-xs hover:text-green-400">← Tillbaka</button>

          <div className="rounded-2xl border border-joker/40 bg-joker/10 p-5 text-center space-y-3">
            <div className="text-4xl">🃏</div>
            <p className="font-bebas text-joker text-2xl tracking-widest">BEKRÄFTA STÖLD</p>
            <p className="text-white text-sm">
              Du stjäl <strong className="text-joker font-bebas text-xl">{selectedBet.pointsAwarded} p</strong> från{" "}
              <strong className="text-white">{selectedUser.username}</strong>
            </p>
            {selectedBet.match && (
              <p className="text-green-400 text-xs">
                {getFlag(selectedBet.match.home_team)} {selectedBet.match.home_team} {selectedBet.match.home_score}–{selectedBet.match.away_score} {selectedBet.match.away_team} {getFlag(selectedBet.match.away_team)}
                {" "}· {BET_TYPE_LABELS[selectedBet.betType] ?? selectedBet.betType}
              </p>
            )}
            <p className="text-green-700 text-xs">
              Detta kan inte ångras. Din Joker förbrukas permanent.
            </p>
          </div>

          <button
            onClick={confirmSteal}
            disabled={isPending}
            className="w-full bg-joker hover:bg-purple-500 disabled:opacity-50 text-white font-bebas text-2xl tracking-widest py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-900/40"
          >
            {isPending ? "STJÄLER..." : "🃏 STJÄL POÄNGEN!"}
          </button>
        </div>
      )}
    </div>
  );
}
