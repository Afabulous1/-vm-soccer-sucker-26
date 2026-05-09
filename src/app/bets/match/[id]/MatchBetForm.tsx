"use client";

import { useState, useTransition } from "react";
import { MATCH_BET_TYPES, POINTS_BREAKDOWN } from "@/lib/bets";
import { saveBet } from "@/app/bets/actions";
import { useToast } from "@/components/ToastProvider";
import PlayerSelect from "@/components/PlayerSelect";
import PowerUpSelector from "@/components/PowerUpSelector";
import type { PowerupType } from "@/types/database";

interface ExistingBet {
  bet_type: string;
  bet_value: unknown;
  locked_at: string | null;
}

interface Props {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  existingBets: ExistingBet[];
  isLocked: boolean;
  lockTime: string;
}

export default function MatchBetForm({
  matchId,
  homeTeam,
  awayTeam,
  existingBets,
  isLocked,
  lockTime,
}: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Power-up state per bet
  const [powerUps, setPowerUps] = useState<
    Record<string, { powerUp: PowerupType | null; shield: PowerupType | null }>
  >({});

  const [values, setValues] = useState<Record<string, Record<string, unknown>>>(() => {
    const init: Record<string, Record<string, unknown>> = {};
    MATCH_BET_TYPES.forEach((bet) => {
      const ex = existingBets.find((e) => e.bet_type === bet.id);
      init[bet.id] = (ex?.bet_value as Record<string, unknown>) ?? {};
    });
    return init;
  });

  function updateValue(betType: string, key: string, val: unknown) {
    setValues((prev) => ({ ...prev, [betType]: { ...prev[betType], [key]: val } }));
  }

  function submitBet(betType: string, betValue: Record<string, unknown>, points: number) {
    const { powerUp, shield } = powerUps[betType] ?? { powerUp: null, shield: null };
    startTransition(async () => {
      const result = await saveBet({
        betType,
        betCategory: "match",
        matchId,
        betValue,
        pointsWager: points,
        lockTime: new Date(lockTime),
        powerUpUsed: powerUp,
        shieldUsed: shield,
      });
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`Matchgissning sparad! +${points}p ⚽`, "success");
      }
    });
  }

  function displaySaved(betType: string) {
    const ex = existingBets.find((e) => e.bet_type === betType);
    if (!ex?.bet_value) return "";
    const v = ex.bet_value as Record<string, unknown>;
    if (betType === "match_result") {
      const map: Record<string, string> = { home: `Hemmavinst (${homeTeam})`, draw: "Oavgjort", away: `Bortavinst (${awayTeam})` };
      return map[v.result as string] ?? String(v.result);
    }
    if (betType === "exact_score") return `${v.home} – ${v.away}`;
    if (betType === "both_teams_score") return v.answer === true ? "Ja" : "Nej";
    return Object.values(v).join(", ");
  }

  return (
    <div className="space-y-4">
      {MATCH_BET_TYPES.map((bet) => {
        const val = values[bet.id] ?? {};
        const existing = existingBets.find((e) => e.bet_type === bet.id);
        const hasValue = existing && existing.bet_value != null &&
          Object.keys(existing.bet_value as object).length > 0;

        return (
          <div
            key={bet.id}
            className={`rounded-xl border p-5 space-y-3 ${
              hasValue
                ? "border-violet-500/40 bg-violet-900/10"
                : "border-pitch-light/30 bg-pitch/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-white font-bold text-base">{bet.label}</h3>
                <p className="text-violet-300/70 text-xs mt-0.5">{bet.description}</p>
                {POINTS_BREAKDOWN[bet.id] && (
                  <p className="text-blue-300 text-xs mt-0.5">{POINTS_BREAKDOWN[bet.id]}</p>
                )}
              </div>
              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 font-semibold">
                {bet.points}p
              </span>
            </div>

            {hasValue && !isLocked && (
              <p className="text-green-400 text-xs">
                ✓ Gissning sparad:{" "}
                <span className="text-white font-semibold">{displaySaved(bet.id)}</span>
              </p>
            )}

            {!isLocked && (
              <div className="space-y-2">
                {/* Match result: 3-way */}
                {bet.id === "match_result" && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "home", label: "1", sub: homeTeam },
                      { key: "draw", label: "X", sub: "Oavgjort" },
                      { key: "away", label: "2", sub: awayTeam },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => updateValue(bet.id, "result", opt.key)}
                        className={`py-3 rounded-xl flex flex-col items-center gap-0.5 transition-all active:scale-95 ${
                          val.result === opt.key
                            ? "bg-violet-600 text-white scale-105 shadow-lg shadow-violet-900/50"
                            : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-violet-400/50"
                        }`}
                      >
                        <span className="font-bebas text-2xl">{opt.label}</span>
                        <span className="text-xs truncate max-w-full px-1 opacity-70">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Exact score: two number inputs */}
                {bet.id === "exact_score" && (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={(val.home as number) ?? ""}
                      onChange={(e) => updateValue(bet.id, "home", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="flex-1 bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-3 text-xl text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-violet-400/30"
                    />
                    <span className="text-gold font-bebas text-2xl">–</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={(val.away as number) ?? ""}
                      onChange={(e) => updateValue(bet.id, "away", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="flex-1 bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-3 text-xl text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-violet-400/30"
                    />
                  </div>
                )}

                {/* First scorer */}
                {bet.id === "first_scorer" && (
                  <PlayerSelect
                    value={(val.player as string) ?? ""}
                    onChange={(v) => updateValue(bet.id, "player", v)}
                    includeNoGoal
                    accentClass="focus:ring-violet-400/30 focus:border-violet-400/40"
                  />
                )}

                {/* Both teams score: yes/no */}
                {bet.id === "both_teams_score" && (
                  <div className="flex gap-2">
                    {[true, false].map((opt) => (
                      <button
                        key={String(opt)}
                        type="button"
                        onClick={() => updateValue(bet.id, "answer", opt)}
                        className={`flex-1 py-3 rounded-xl font-bebas text-xl tracking-widest transition-all active:scale-95 ${
                          val.answer === opt
                            ? opt
                              ? "bg-green-600 text-white scale-105"
                              : "bg-red-600 text-white scale-105"
                            : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-violet-400/50"
                        }`}
                      >
                        {opt ? "JA ⚽" : "NEJ 🧱"}
                      </button>
                    ))}
                  </div>
                )}

                {/* Yellow cards count */}
                {bet.id === "yellow_cards" && (
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={(val.count as number) ?? ""}
                    onChange={(e) => updateValue(bet.id, "count", parseInt(e.target.value) || 0)}
                    placeholder="Antal gula kort..."
                    className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
                  />
                )}

                <PowerUpSelector
                  betType={bet.id}
                  currentPowerUp={powerUps[bet.id]?.powerUp ?? null}
                  currentShield={powerUps[bet.id]?.shield ?? null}
                  onSelect={(powerUp, shield) =>
                    setPowerUps((prev) => ({
                      ...prev,
                      [bet.id]: { powerUp, shield },
                    }))
                  }
                  disabled={isPending}
                />

                <button
                  onClick={() => submitBet(bet.id, val, bet.points)}
                  disabled={isPending}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bebas text-lg tracking-widest py-2.5 rounded-xl transition-all active:scale-95"
                >
                  {hasValue ? "UPPDATERA GISSNING" : "SPARA GISSNING"}
                </button>
              </div>
            )}

            {isLocked && hasValue && (
              <p className="text-amber-400 text-xs">🔒 Låst gissning: {displaySaved(bet.id)}</p>
            )}
            {isLocked && !hasValue && (
              <p className="text-red-400 text-xs">🔒 Ingen gissning lagd — matchen har börjat.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
