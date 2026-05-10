"use client";

import { useState, useTransition, useRef } from "react";
import { WC_TEAMS } from "@/lib/teams";
import { TURNERING_BETS, TOURNAMENT_LOCK, WC_GROUPS, POINTS_BREAKDOWN } from "@/lib/bets";
import { saveBet } from "@/app/bets/actions";
import { useToast } from "@/components/ToastProvider";
import StodSupportern from "@/components/StodSupportern";
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

function TeamSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = WC_TEAMS.filter((t) => t.toLowerCase().includes(search.toLowerCase())).slice(0, 12);

  return (
    <div className="relative">
      <div
        className={`w-full bg-pitch-dark border rounded-lg px-3 py-2.5 text-sm cursor-pointer flex justify-between items-center ${disabled ? "opacity-50 cursor-not-allowed border-pitch-light/30" : "border-pitch-light/50 hover:border-gold/40"}`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={value ? "text-white" : "text-green-700"}>{value || "Välj lag..."}</span>
        <span className="text-green-600 text-xs">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-pitch-dark border border-pitch-light/50 rounded-lg shadow-xl overflow-hidden">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök lag..."
            className="w-full bg-pitch-dark px-3 py-2 text-sm text-white placeholder-green-700 border-b border-pitch-light/30 outline-none"
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((t) => (
              <button
                key={t}
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-pitch-light/30 transition-colors"
                onClick={() => { onChange(t); setOpen(false); setSearch(""); }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TurneringForm({ existingBets, isLocked }: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeSos, setActiveSos] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);

  // Track which bets have been saved (initialize from existing bets), using ref to avoid lint warning
  const savedBetIds = useRef<Set<string>>(new Set(
    existingBets
      .filter((eb) => eb.bet_value != null && Object.keys(eb.bet_value as object).length > 0)
      .map((eb) => eb.bet_type)
  ));

  // Build form state from existing bets
  const getExisting = (betType: string) => {
    const b = existingBets.find((e) => e.bet_type === betType);
    return b?.bet_value as Record<string, unknown> | undefined;
  };

  const [values, setValues] = useState<Record<string, Record<string, unknown>>>(() => {
    const init: Record<string, Record<string, unknown>> = {};
    TURNERING_BETS.forEach((bet) => {
      const ex = existingBets.find((e) => e.bet_type === bet.id);
      init[bet.id] = (ex?.bet_value as Record<string, unknown>) ?? {};
    });
    return init;
  });

  function updateValue(betType: string, key: string, val: unknown) {
    setValues((prev) => ({ ...prev, [betType]: { ...prev[betType], [key]: val } }));
  }

  function handleSosSuggestion(betType: string, value: unknown) {
    const bet = TURNERING_BETS.find((b) => b.id === betType)!;
    if (bet.inputType === "team") {
      updateValue(betType, "team", value);
    } else if (bet.inputType === "two-teams") {
      const v = value as { team1: string; team2: string };
      updateValue(betType, "team1", v.team1);
      updateValue(betType, "team2", v.team2);
    } else if (bet.inputType === "player") {
      updateValue(betType, "player", value);
    } else if (bet.inputType === "number") {
      updateValue(betType, "goals", value);
    } else if (bet.inputType === "group") {
      updateValue(betType, "group", value);
    }
    setActiveSos(null);
  }

  function submitBet(betType: string, betValue: Record<string, unknown>, points: number) {
    startTransition(async () => {
      const result = await saveBet({
        betType,
        betCategory: "turnering",
        betValue,
        pointsWager: points,
        lockTime: TOURNAMENT_LOCK,
      });
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(`Gissning sparad! +${points}p ✅`, "success");

        savedBetIds.current.add(betType);
        const allIds = TURNERING_BETS.map((b) => b.id);
        const allFilled = allIds.every((id) => savedBetIds.current.has(id));
        if (allFilled && !allDone) {
          showToast("Alla turneringsgissningar klara! 🏆", "badge");
          setAllDone(true);
        }
      }
    });
  }

  return (
    <div className="space-y-4">
      <ConfettiTrigger trigger={allDone} preset="badge" />

      {TURNERING_BETS.map((bet) => {
        const val = values[bet.id] ?? {};
        const existing = getExisting(bet.id);
        const hasValue = existing && Object.keys(existing).length > 0;

        return (
          <div
            key={bet.id}
            className={`rounded-xl border p-5 space-y-3 ${hasValue ? "border-blue-500/40 bg-blue-900/20" : "border-pitch-light/30 bg-pitch/40"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-white font-bold text-base">{bet.label}</h3>
                <p className="text-green-400 text-xs mt-0.5">{bet.description}</p>
                {POINTS_BREAKDOWN[bet.id] && (
                  <p className="text-blue-300 text-xs mt-0.5">{POINTS_BREAKDOWN[bet.id]}</p>
                )}
              </div>
              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                {bet.points}p
              </span>
            </div>

            {hasValue && !isLocked && (
              <p className="text-green-400 text-xs">
                ✓ Gissning sparad:{" "}
                <span className="text-white font-semibold">
                  {Object.values(existing!).join(" vs ")}
                </span>
              </p>
            )}

            {!isLocked && (
              <div className="space-y-2">
                {bet.inputType === "team" && (
                  <TeamSelect
                    value={(val.team as string) ?? ""}
                    onChange={(v) => updateValue(bet.id, "team", v)}
                  />
                )}
                {bet.inputType === "two-teams" && (
                  <div className="grid grid-cols-2 gap-2">
                    <TeamSelect value={(val.team1 as string) ?? ""} onChange={(v) => updateValue(bet.id, "team1", v)} />
                    <TeamSelect value={(val.team2 as string) ?? ""} onChange={(v) => updateValue(bet.id, "team2", v)} />
                  </div>
                )}
                {bet.inputType === "player" && (
                  <PlayerSelect
                    value={(val.player as string) ?? ""}
                    onChange={(v) => updateValue(bet.id, "player", v)}
                    accentClass="focus:ring-gold/30 focus:border-gold/40"
                  />
                )}
                {bet.inputType === "number" && (
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={(val.goals as number) ?? ""}
                    onChange={(e) => updateValue(bet.id, "goals", parseInt(e.target.value))}
                    placeholder="Antal mål..."
                    className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                )}
                {bet.inputType === "group" && (
                  <div className="flex flex-wrap gap-2">
                    {WC_GROUPS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateValue(bet.id, "group", g)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${val.group === g ? "bg-blue-500 text-white scale-110" : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-blue-400/60"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => submitBet(bet.id, val, bet.points)}
                    disabled={isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bebas text-lg tracking-widest py-2.5 rounded-xl transition-all active:scale-95"
                  >
                    {hasValue ? "UPPDATERA GISSNING" : "SPARA GISSNING"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSos(activeSos === bet.id ? null : bet.id)}
                    className="px-3 py-2.5 rounded-xl bg-pitch-dark border border-gold/30 text-gold text-sm hover:bg-pitch-light/20 transition"
                    title="Hjälp mig gissa"
                  >
                    🤔
                  </button>
                </div>
              </div>
            )}

            {isLocked && hasValue && (() => {
              const eb = existingBets.find((e) => e.bet_type === bet.id);
              return (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-amber-400/80 text-xs">🔒 {Object.values(existing!).join(" vs ")}</p>
                  <StatusPill points_awarded={eb?.points_awarded ?? null} is_correct={eb?.is_correct ?? null} />
                </div>
              );
            })()}
            {isLocked && !hasValue && (
              <p className="text-red-400 text-xs">🔒 Ingen gissning lagd — turneringen har börjat.</p>
            )}
          </div>
        );
      })}

      {activeSos && (
        <StodSupportern
          betType={activeSos}
          onSelect={(value) => handleSosSuggestion(activeSos, value)}
        />
      )}
    </div>
  );
}
