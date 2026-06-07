"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { MATCH_BET_TYPES, POINTS_BREAKDOWN } from "@/lib/bets";
import { saveBet } from "@/app/bets/actions";
import { useToast } from "@/components/ToastProvider";
import PowerUpSelector from "@/components/PowerUpSelector";
import { getRandomTaunt } from "@/lib/taunts";
import type { PowerupType } from "@/types/database";

interface ExistingBet {
  bet_type: string;
  bet_value: unknown;
  locked_at: string | null;
  points_awarded: number | null;
  is_correct: boolean | null;
}

function StatusPill({
  points_awarded,
  is_correct,
}: {
  points_awarded: number | null;
  is_correct: boolean | null;
}) {
  if (points_awarded == null) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold text-slate-400 bg-slate-500/20 border-slate-500/40">
        Väntande
      </span>
    );
  }
  if (is_correct) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold text-emerald-300 bg-emerald-500/20 border-emerald-500/40">
        +{points_awarded}p ✓
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold text-red-400 bg-red-500/20 border-red-500/40">
      Fel 😢 {points_awarded > 0 ? `(+${points_awarded}p)` : ""}
    </span>
  );
}

interface Props {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  existingBets: ExistingBet[];
  isLocked: boolean;
  lockTime: string;
  matchStage: string;
}

export default function MatchBetForm({
  matchId,
  homeTeam,
  awayTeam,
  existingBets,
  isLocked,
  lockTime,
  matchStage,
}: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [taunts, setTaunts] = useState<Record<string, string | null>>({});
  const tauntTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const showTaunt = useCallback((betType: string) => {
    if (tauntTimers.current[betType]) clearTimeout(tauntTimers.current[betType]);
    setTaunts((p) => ({ ...p, [betType]: getRandomTaunt() }));
    tauntTimers.current[betType] = setTimeout(
      () => setTaunts((p) => ({ ...p, [betType]: null })),
      3500
    );
  }, []);

  const [powerUps, setPowerUps] = useState<
    Record<string, { powerUp: PowerupType | null; shield: PowerupType | null }>
  >({});

  const [values, setValues] = useState<Record<string, Record<string, unknown>>>(
    () => {
      const init: Record<string, Record<string, unknown>> = {};
      MATCH_BET_TYPES.forEach((bet) => {
        const ex = existingBets.find((e) => e.bet_type === bet.id);
        init[bet.id] = (ex?.bet_value as Record<string, unknown>) ?? {};
      });
      return init;
    }
  );

  function updateValue(betType: string, key: string, val: unknown) {
    setValues((prev) => ({
      ...prev,
      [betType]: { ...prev[betType], [key]: val },
    }));
  }

  function submitBet(
    betType: string,
    betValue: Record<string, unknown>,
    points: number
  ) {
    const { powerUp, shield } = powerUps[betType] ?? {
      powerUp: null,
      shield: null,
    };
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
        showToast(`Matchgissning sparad! ⚽`, "success");
      }
    });
  }

  function displaySaved(betType: string) {
    const ex = existingBets.find((e) => e.bet_type === betType);
    if (!ex?.bet_value) return "";
    const v = ex.bet_value as Record<string, unknown>;
    if (betType === "match_result") {
      const map: Record<string, string> = {
        home: `1 — ${homeTeam} vinner`,
        draw: "X — Oavgjort",
        away: `2 — ${awayTeam} vinner`,
      };
      return map[v.result as string] ?? String(v.result);
    }
    if (betType === "total_goals_match") return `${v.count} mål totalt`;
    if (betType === "exact_score") return `${v.home} – ${v.away}`;
    return Object.values(v).join(", ");
  }

  return (
    <div className="space-y-4">
      {/* Track A badge */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-900/30 border border-violet-500/30 px-2.5 py-1 rounded-full">
          ⚽ Fan Track — 2 gissningar
        </span>
      </div>

      {MATCH_BET_TYPES.map((bet) => {
        const val = values[bet.id] ?? {};
        const existing = existingBets.find((e) => e.bet_type === bet.id);
        const hasValue =
          existing &&
          existing.bet_value != null &&
          Object.keys(existing.bet_value as object).length > 0;

        return (
          <div
            key={bet.id}
            className={`rounded-2xl border p-5 space-y-3 ${
              hasValue
                ? "border-violet-500/40 bg-violet-900/10"
                : "border-pitch-light/30 bg-pitch/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base">{bet.label}</h3>
                <p className="text-violet-300/70 text-xs mt-0.5">
                  {bet.description}
                </p>
                {POINTS_BREAKDOWN[bet.id] && (
                  <p className="text-blue-300/70 text-[11px] mt-1">
                    {POINTS_BREAKDOWN[bet.id]}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs px-2.5 py-1.5 rounded-full bg-violet-500/20 text-violet-300 font-bold tabular-nums">
                {bet.points}p
              </span>
            </div>

            {hasValue && !isLocked && (
              <p className="text-green-400 text-xs">
                ✓ Sparad:{" "}
                <span className="text-white font-semibold">
                  {displaySaved(bet.id)}
                </span>
              </p>
            )}

            {!isLocked && (
              <div className="space-y-3">
                {/* 1-X-2 result picker */}
                {bet.id === "match_result" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "home", label: "1", sub: homeTeam },
                        { key: "draw", label: "X", sub: "Oavgjort" },
                        { key: "away", label: "2", sub: awayTeam },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => { updateValue(bet.id, "result", opt.key); showTaunt(bet.id); }}
                          className={`py-4 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 touch-manipulation ${
                            val.result === opt.key
                              ? "bg-violet-600 text-white scale-105 shadow-lg shadow-violet-900/50"
                              : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-violet-400/50"
                          }`}
                        >
                          <span className="font-bebas text-3xl leading-none">{opt.label}</span>
                          <span className="text-[10px] truncate max-w-full px-1 opacity-70 leading-tight">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                    {taunts[bet.id] && (
                      <p className="text-center text-[11px] italic text-violet-400/70 animate-pulse px-2">
                        {taunts[bet.id]}
                      </p>
                    )}
                  </div>
                )}

                {/* Total goals number picker */}
                {bet.id === "total_goals_match" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => { updateValue(bet.id, "count", Math.max(0, ((val.count as number) ?? 0) - 1)); showTaunt(bet.id); }}
                        className="w-12 h-12 rounded-xl bg-pitch-dark border border-pitch-light/40 text-white text-2xl font-bold flex items-center justify-center active:scale-95 touch-manipulation hover:border-violet-400/50"
                      >
                        −
                      </button>
                      <div className="w-20 text-center">
                        <span className="font-bebas text-5xl text-gold tabular-nums">
                          {(val.count as number) ?? 0}
                        </span>
                        <p className="text-green-600 text-[10px] mt-0.5">mål</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { updateValue(bet.id, "count", ((val.count as number) ?? 0) + 1); showTaunt(bet.id); }}
                        className="w-12 h-12 rounded-xl bg-pitch-dark border border-pitch-light/40 text-white text-2xl font-bold flex items-center justify-center active:scale-95 touch-manipulation hover:border-violet-400/50"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-center gap-2 flex-wrap">
                      {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => { updateValue(bet.id, "count", n); showTaunt(bet.id); }}
                          className={`w-9 h-9 rounded-lg text-sm font-bold transition-all active:scale-95 touch-manipulation ${
                            (val.count as number) === n
                              ? "bg-violet-600 text-white"
                              : "bg-pitch-dark border border-pitch-light/30 text-green-400 hover:border-violet-400/50"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    {taunts[bet.id] && (
                      <p className="text-center text-[11px] italic text-violet-400/70 animate-pulse px-2">
                        {taunts[bet.id]}
                      </p>
                    )}
                  </div>
                )}

                <PowerUpSelector
                  betType={bet.id}
                  matchStage={matchStage}
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
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bebas text-lg tracking-widest py-3.5 rounded-2xl transition-all active:scale-95 touch-manipulation"
                >
                  {hasValue ? "UPPDATERA GISSNING" : "SPARA GISSNING"}
                </button>
              </div>
            )}

            {isLocked && hasValue && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-amber-400/80 text-xs">
                  🔒 {displaySaved(bet.id)}
                </p>
                <StatusPill
                  points_awarded={existing?.points_awarded ?? null}
                  is_correct={existing?.is_correct ?? null}
                />
              </div>
            )}
            {isLocked && !hasValue && (
              <p className="text-red-400/70 text-xs">
                🔒 Ingen gissning lagd.
              </p>
            )}
          </div>
        );
      })}

      {/* Show any legacy bets (old bet types) when locked */}
      {isLocked && (
        <>
          {existingBets
            .filter(
              (eb) =>
                !MATCH_BET_TYPES.find((b) => b.id === eb.bet_type) &&
                eb.bet_value != null &&
                Object.keys(eb.bet_value as object).length > 0
            )
            .map((eb) => (
              <div
                key={eb.bet_type}
                className="rounded-xl border border-pitch-light/20 bg-pitch/20 p-4 flex items-center justify-between gap-2"
              >
                <p className="text-green-700 text-xs">
                  🔒 {eb.bet_type.replace(/_/g, " ")}
                </p>
                <StatusPill
                  points_awarded={eb.points_awarded}
                  is_correct={eb.is_correct}
                />
              </div>
            ))}
        </>
      )}

    </div>
  );
}
