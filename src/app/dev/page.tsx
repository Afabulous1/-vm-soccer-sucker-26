"use client";

// DEV-ONLY time machine — not linked from any page in production.
// Visit http://localhost:3000/dev to fast-forward to any tournament phase.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { grantJoker } from "./actions";

const PRESETS = [
  {
    label: "Riktig tid (nollställ)",
    date: null,
    desc: "Ta bort simuleringen — kör med verklig tid.",
    color: "border-green-600/40 text-green-300 hover:bg-green-900/20",
  },
  {
    label: "⏳ Före 1 juni",
    date: "2026-05-20T12:00:00+02:00",
    desc: "Gissningarna är inte öppna än — stor countdown visas.",
    color: "border-pitch-light/30 text-green-400 hover:bg-pitch-light/10",
  },
  {
    label: "📅 1 juni — Gissningarna öppnar",
    date: "2026-06-01T08:00:00+02:00",
    desc: "Gissningsperioden är öppen. Turnering, Kaos och Match-bets tillgängliga.",
    color: "border-pitch-light/30 text-green-400 hover:bg-pitch-light/10",
  },
  {
    label: "⏰ 11 juni kl 16:00 — En timme kvar",
    date: "2026-06-11T16:00:00Z",
    desc: "Röd nedräkning visas i bets-layouten — en timme till att Turnering + Kaos låser.",
    color: "border-amber-500/40 text-amber-300 hover:bg-amber-900/20",
  },
  {
    label: "🔒 11 juni kl 17:01 — Precis låst",
    date: "2026-06-11T17:01:00Z",
    desc: "Turnering + Kaos är nu låsta. Match-bets är fortfarande öppna.",
    color: "border-amber-500/40 text-amber-300 hover:bg-amber-900/20",
  },
  {
    label: "⚽ 15 juni — Mitt i gruppspelet",
    date: "2026-06-15T18:00:00Z",
    desc: "Några matcher färdiga (med resultat), kommande matcher har nedräkning.",
    color: "border-violet-500/40 text-violet-300 hover:bg-violet-900/20",
  },
  {
    label: "🏆 8 juli — Semifinal (Joker aktiveras!)",
    date: "2026-07-08T19:00:00Z",
    desc: "Joker-kraften blir aktiv på dashboarden från detta datum.",
    color: "border-purple-500/40 text-purple-300 hover:bg-purple-900/20",
  },
  {
    label: "🎉 19 juli — VM-finalen",
    date: "2026-07-19T20:00:00Z",
    desc: "Sista matchen. Alla gissningar låsta. Slutlig ligatabell.",
    color: "border-gold/40 text-gold hover:bg-gold/10",
  },
];

export default function DevPage() {
  const router = useRouter();
  const [jokerMsg, setJokerMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [jokerPending, setJokerPending] = useState(false);

  function apply(isoDate: string | null) {
    if (isoDate === null) {
      document.cookie = "vm26_sim=; path=/; max-age=0";
    } else {
      document.cookie = `vm26_sim=${encodeURIComponent(isoDate)}; path=/; max-age=86400`;
    }
    router.refresh();
    router.push("/dashboard");
  }

  async function handleGrantJoker() {
    setJokerPending(true);
    setJokerMsg(null);
    const result = await grantJoker();
    setJokerMsg(result);
    setJokerPending(false);
    if (result.ok) router.refresh();
  }

  return (
    <div className="pitch-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-3">🕰️</p>
          <h1 className="font-bebas text-5xl text-gold tracking-widest">TIDSMASKIN</h1>
          <p className="text-green-400 text-sm mt-1">Välj en fas — appen beter sig som om det är det datumet.</p>
          <p className="text-green-700 text-xs mt-1">Kör bara lokalt · Finns inte i produktion</p>
        </div>

        <div className="space-y-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => apply(p.date)}
              className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${p.color}`}
            >
              <div className="font-semibold text-sm">{p.label}</div>
              <div className="text-xs opacity-60 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>

        {/* ── Joker dev tools ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-purple-500/40 bg-purple-900/20 p-4 space-y-3">
          <p className="font-bebas text-purple-300 text-xl tracking-widest">🃏 JOKER — DEV VERKTYG</p>

          <div className="rounded-lg bg-pitch-dark border border-red-500/30 px-3 py-2 text-xs font-mono text-red-300 leading-relaxed">
            <p className="text-red-400 font-bold mb-1">Kör i Supabase SQL Editor FÖRST:</p>
            <p>ALTER TYPE powerup_type ADD VALUE IF NOT EXISTS &apos;joker&apos;;</p>
          </div>

          <button
            onClick={handleGrantJoker}
            disabled={jokerPending}
            className="w-full rounded-xl border border-purple-500/60 bg-purple-900/30 text-purple-300 font-bebas text-lg tracking-widest py-2.5 hover:bg-purple-800/40 transition-all disabled:opacity-50"
          >
            {jokerPending ? "LÄGGER TILL..." : "🃏 GE MIG EN JOKER"}
          </button>

          {jokerMsg && (
            <div className={`rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${jokerMsg.ok ? "bg-green-900/30 text-green-300 border border-green-500/30" : "bg-red-900/30 text-red-300 border border-red-500/30"}`}>
              {jokerMsg.message}
            </div>
          )}

          <p className="text-green-700 text-xs">
            Gå sedan till <strong className="text-purple-400">🏆 8 juli — Semifinal</strong> ovan för att se Joker-kortet på dashboarden.
          </p>
        </div>
      </div>
    </div>
  );
}
