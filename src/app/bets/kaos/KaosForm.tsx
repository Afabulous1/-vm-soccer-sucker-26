"use client";

import { useState, useTransition, useRef } from "react";
import { KAOS_BETS, TOURNAMENT_LOCK } from "@/lib/bets";
import { saveBet } from "@/app/bets/actions";
import { useToast } from "@/components/ToastProvider";
import PlayerSelect from "@/components/PlayerSelect";
import ConfettiTrigger from "@/components/ConfettiTrigger";

interface ExistingBet {
  bet_type: string;
  bet_value: unknown;
  locked_at: string | null;
  points_awarded: number | null;
  is_correct: boolean | null;
}

function StatusPill({ points_awarded, is_correct }: { points_awarded: number | null; is_correct: boolean | null }) {
  if (points_awarded == null) {
    return <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold text-slate-400 bg-slate-500/20 border-slate-500/40">Väntande</span>;
  }
  if (is_correct) {
    return <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold text-emerald-300 bg-emerald-500/20 border-emerald-500/40">Intjänad +{points_awarded}p ✓</span>;
  }
  return <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold text-red-400 bg-red-500/20 border-red-500/40">Fel 😢</span>;
}

interface Props {
  existingBets: ExistingBet[];
  isLocked: boolean;
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
    <div className="flex gap-2">
      {(["yes", "no"] as const).map((opt) => {
        const isYes = opt === "yes";
        const selected = value === isYes;
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(isYes)}
            className={`flex-1 py-3 rounded-xl font-bebas text-xl tracking-widest transition-all active:scale-95 ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${
              selected
                ? isYes
                  ? "bg-green-600 text-white scale-105 shadow-lg shadow-green-900/50"
                  : "bg-red-600 text-white scale-105 shadow-lg shadow-red-900/50"
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

export default function KaosForm({ existingBets, isLocked }: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [allDone, setAllDone] = useState(false);

  // Track which bets have been saved (initialize from existing bets), using ref to avoid lint warning
  const savedBetIds = useRef<Set<string>>(new Set(
    existingBets
      .filter((eb) => eb.bet_value != null && Object.keys(eb.bet_value as object).length > 0)
      .map((eb) => eb.bet_type)
  ));

  const [values, setValues] = useState<Record<string, Record<string, unknown>>>(() => {
    const init: Record<string, Record<string, unknown>> = {};
    KAOS_BETS.forEach((bet) => {
      const ex = existingBets.find((e) => e.bet_type === bet.id);
      init[bet.id] = (ex?.bet_value as Record<string, unknown>) ?? {};
    });
    return init;
  });

  function updateValue(betType: string, key: string, val: unknown) {
    setValues((prev) => ({ ...prev, [betType]: { ...prev[betType], [key]: val } }));
  }

  function submitBet(betType: string, betValue: Record<string, unknown>, points: number) {
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
        showToast(`Kaosgissning sparad! +${points}p 🔥`, "success");

        savedBetIds.current.add(betType);
        const allIds = KAOS_BETS.map((b) => b.id);
        const allFilled = allIds.every((id) => savedBetIds.current.has(id));
        if (allFilled && !allDone) {
          showToast("Alla kaosgissningar klara! 🔥", "badge");
          setAllDone(true);
        }
      }
    });
  }

  return (
    <div className="space-y-4">
      <ConfettiTrigger trigger={allDone} preset="badge" />

      {KAOS_BETS.map((bet) => {
        const val = values[bet.id] ?? {};
        const existing = existingBets.find((e) => e.bet_type === bet.id);
        const hasValue = existing && existing.bet_value != null &&
          Object.keys(existing.bet_value as object).length > 0;

        const isYesNo = bet.inputType === "yesno";
        const currentYesNo = isYesNo
          ? val.answer === true
            ? true
            : val.answer === false
            ? false
            : null
          : null;

        function displaySaved() {
          if (!existing?.bet_value) return "";
          const v = existing.bet_value as Record<string, unknown>;
          if (isYesNo) return v.answer === true ? "JA 🔥" : "NEJ 🧊";
          return Object.values(v).join(", ");
        }

        return (
          <div
            key={bet.id}
            className={`rounded-xl border p-5 space-y-3 ${
              hasValue
                ? "border-rose-500/40 bg-rose-900/10"
                : "border-pitch-light/30 bg-pitch/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-white font-bold text-base">{bet.label}</h3>
                <p className="text-rose-300/80 text-xs mt-0.5">{bet.description}</p>
              </div>
              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                {bet.points}p
              </span>
            </div>

            {hasValue && !isLocked && (
              <p className="text-green-400 text-xs">
                ✓ Gissning sparad:{" "}
                <span className="text-white font-semibold">{displaySaved()}</span>
              </p>
            )}

            {!isLocked && (
              <div className="space-y-2">
                {isYesNo && (
                  <YesNoToggle
                    value={currentYesNo}
                    onChange={(v) => updateValue(bet.id, "answer", v)}
                  />
                )}

                {bet.inputType === "player" && (
                  <PlayerSelect
                    value={(val.player as string) ?? ""}
                    onChange={(v) => updateValue(bet.id, "player", v)}
                    accentClass="focus:ring-rose-400/30 focus:border-rose-400/40"
                  />
                )}

                <button
                  onClick={() => submitBet(bet.id, val, bet.points)}
                  disabled={isPending}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bebas text-lg tracking-widest py-2.5 rounded-xl transition-all active:scale-95"
                >
                  {hasValue ? "UPPDATERA GISSNING" : "SPARA GISSNING"}
                </button>
              </div>
            )}

            {isLocked && hasValue && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-amber-400/80 text-xs">🔒 {displaySaved()}</p>
                <StatusPill points_awarded={existing?.points_awarded ?? null} is_correct={existing?.is_correct ?? null} />
              </div>
            )}
            {isLocked && !hasValue && (
              <p className="text-red-400 text-xs">🔒 Ingen gissning lagd — turneringen har börjat.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
