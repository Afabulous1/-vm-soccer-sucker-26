"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { KAOS_BETS, TOURNAMENT_LOCK } from "@/lib/bets";
import { saveBet } from "@/app/bets/actions";
import { useToast } from "@/components/ToastProvider";
import ConfettiTrigger from "@/components/ConfettiTrigger";
import { getRandomTaunt } from "@/lib/taunts";

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
      Fel 😢
    </span>
  );
}

function YesNoToggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-3">
      {(["yes", "no"] as const).map((opt) => {
        const isYes = opt === "yes";
        const selected = value === isYes;
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(isYes)}
            className={`flex-1 py-4 rounded-2xl font-bebas text-2xl tracking-widest transition-all active:scale-95 touch-manipulation ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${
              selected
                ? isYes
                  ? "bg-green-600 text-white scale-105 shadow-lg shadow-green-900/50"
                  : "bg-red-700 text-white scale-105 shadow-lg shadow-red-900/50"
                : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-rose-400/50"
            }`}
          >
            {isYes ? "JA! 🔥" : "NEJ 🧊"}
          </button>
        );
      })}
    </div>
  );
}

interface Props {
  existingBets: ExistingBet[];
  isLocked: boolean;
}

export default function KaosForm({ existingBets, isLocked }: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [allDone, setAllDone] = useState(false);
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

  const savedBetIds = useRef<Set<string>>(
    new Set(
      existingBets
        .filter(
          (eb) =>
            eb.bet_value != null &&
            Object.keys(eb.bet_value as object).length > 0
        )
        .map((eb) => eb.bet_type)
    )
  );

  const [values, setValues] = useState<Record<string, Record<string, unknown>>>(
    () => {
      const init: Record<string, Record<string, unknown>> = {};
      KAOS_BETS.forEach((bet) => {
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
    startTransition(async () => {
      const result = await saveBet({
        betType,
        betCategory: "kaos",
        betValue,
        pointsWager: points,
        lockTime: TOURNAMENT_LOCK,
      });
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`Party-gissning sparad! 🔥`, "success");
        savedBetIds.current.add(betType);
        const allFilled = KAOS_BETS.map((b) => b.id).every((id) =>
          savedBetIds.current.has(id)
        );
        if (allFilled && !allDone) {
          showToast("Alla Party-gissningar klara! 🎉🔥", "badge");
          setAllDone(true);
        }
      }
    });
  }

  const doneCount = KAOS_BETS.filter((b) => savedBetIds.current.has(b.id)).length;

  return (
    <div className="space-y-4">
      <ConfettiTrigger trigger={allDone} preset="badge" />

      {/* Track B header */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-900/20 to-orange-900/10 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-900/40 border border-rose-500/30 px-2.5 py-1 rounded-full">
            🔥 Party Track — 6 gissningar
          </span>
          <span className="text-[10px] text-rose-400 font-semibold">
            {doneCount}/{KAOS_BETS.length} klara
          </span>
        </div>
        <p className="text-rose-200/60 text-xs leading-relaxed">
          Du behöver inte kunna fotboll för att vinna här. Välj JA eller NEJ på
          dessa galna scenarion. <strong className="text-green-300">JA rätt = 10 000p</strong>{" "}
          · <strong className="text-rose-300">NEJ rätt = 500p</strong>. Låser vid turneringsstart.
        </p>
        <p className="text-rose-300/50 text-[11px]">
          🧊 <strong>Sabotage</strong> &amp;{" "}
          <strong>🦊 Punto Bandito</strong> — dina Party-krafter — aktiveras
          under turneringen via din kraft-panel.
        </p>
      </div>

      {KAOS_BETS.map((bet) => {
        const val = values[bet.id] ?? {};
        const existing = existingBets.find((e) => e.bet_type === bet.id);
        const hasValue =
          existing &&
          existing.bet_value != null &&
          Object.keys(existing.bet_value as object).length > 0;

        const currentYesNo =
          val.answer === true ? true : val.answer === false ? false : null;

        function displaySaved() {
          if (!existing?.bet_value) return "";
          const v = existing.bet_value as Record<string, unknown>;
          return v.answer === true ? "JA 🔥" : "NEJ 🧊";
        }

        return (
          <div
            key={bet.id}
            className={`rounded-2xl border p-5 space-y-3 transition-all ${
              hasValue
                ? "border-rose-500/40 bg-rose-900/10"
                : "border-pitch-light/30 bg-pitch/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base leading-tight">
                  {bet.label}
                </h3>
                <p className="text-rose-300/70 text-xs mt-1 leading-relaxed">
                  {bet.description}
                </p>
              </div>
              <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold ml-2 text-center leading-tight">
                <span className="text-green-300">JA 10 000p</span>
                <br />
                <span className="text-rose-300">NEJ 500p</span>
              </span>
            </div>

            {hasValue && !isLocked && (
              <p className="text-green-400 text-xs">
                ✓ Sparad:{" "}
                <span className="text-white font-semibold">{displaySaved()}</span>
              </p>
            )}

            {!isLocked && (
              <div className="space-y-2">
                <YesNoToggle
                  value={currentYesNo}
                  onChange={(v) => { updateValue(bet.id, "answer", v); showTaunt(bet.id); }}
                />
                {taunts[bet.id] && (
                  <p className="text-center text-[11px] italic text-rose-400/70 animate-pulse px-2">
                    {taunts[bet.id]}
                  </p>
                )}

                <button
                  onClick={() => submitBet(bet.id, val, bet.points)}
                  disabled={isPending || currentYesNo === null}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bebas text-lg tracking-widest py-3.5 rounded-2xl transition-all active:scale-95 touch-manipulation"
                >
                  {hasValue ? "UPPDATERA GISSNING" : "SPARA GISSNING"}
                </button>
              </div>
            )}

            {isLocked && hasValue && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-amber-400/80 text-xs">
                  🔒 {displaySaved()}
                </p>
                <StatusPill
                  points_awarded={existing?.points_awarded ?? null}
                  is_correct={existing?.is_correct ?? null}
                />
              </div>
            )}
            {isLocked && !hasValue && (
              <p className="text-red-400/60 text-xs">
                🔒 Ingen gissning lagd.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
