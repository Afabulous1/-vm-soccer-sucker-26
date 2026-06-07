"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { randomBetAllGroupGames } from "./random-bets";

export default function RandomBetButton({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setConfirmed(false);
    startTransition(async () => {
      const r = await randomBetAllGroupGames();
      setResult({ ok: r.ok, message: r.message });
      if (r.ok) router.refresh();
    });
  }

  if (result) {
    return (
      <div className={`rounded-2xl border p-4 text-sm font-semibold text-center ${
        result.ok
          ? "border-green-500/40 bg-green-900/20 text-green-300"
          : "border-red-500/40 bg-red-900/20 text-red-300"
      }`}>
        {result.message}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-rose-500/30 bg-rose-900/10 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0">🎲</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Jag-kan-och-bryr-mig-inte-knappen</p>
          <p className="text-rose-300/70 text-xs mt-0.5">
            Slumpar 1X2 + mål-gissningar på alla {remaining} kvarvarande öppna matcher automatiskt.
            För dig som vill vara med men inte orkar välja varje match.
          </p>
        </div>
      </div>

      {confirmed ? (
        <div className="space-y-2">
          <p className="text-amber-300 text-xs text-center font-semibold">
            Säker? Slumpar gissningar på {remaining} matcher — kan inte ångras.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmed(false)}
              className="flex-1 border border-pitch-light/30 text-green-400 font-semibold py-2.5 rounded-xl text-sm transition-all hover:bg-pitch-light/10"
            >
              Avbryt
            </button>
            <button
              onClick={handleClick}
              disabled={isPending}
              className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bebas text-lg tracking-widest py-2.5 rounded-xl transition-all active:scale-95 touch-manipulation"
            >
              {isPending ? "⏳ Slumpar…" : "JA, KÖR DET!"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={isPending}
          className="w-full bg-rose-600/80 hover:bg-rose-600 disabled:opacity-50 border border-rose-500/40 text-white font-bebas text-xl tracking-widest py-3 rounded-2xl transition-all active:scale-95 touch-manipulation"
        >
          🎲 SLUMPA ALLA KVARVARANDE MATCHER
        </button>
      )}
    </div>
  );
}
