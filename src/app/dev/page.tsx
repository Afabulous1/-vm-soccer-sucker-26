"use client";

// DEV-ONLY simulation console — not linked from any production page.
// Visit http://localhost:3000/dev to fast-forward through the entire tournament.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  grantJoker,
  grantTrackBPowers,
  refillAllPowers,
  seedDemoMatches,
  seedGroupStageFixtures,
  finalizeSemiFinal,
  finalizeFinal,
  clearDemoMatches,
  seedDemoOutcomes,
} from "./actions";

// ── Time presets ──────────────────────────────────────────────────────────────

const TIME_PRESETS = [
  {
    label: "🕐 Riktig tid (nollställ)",
    date: null,
    desc: "Tar bort simuleringen — kör med verklig klocka.",
    color: "border-green-600/40 bg-green-900/10 text-green-300 hover:bg-green-900/20",
  },
  {
    label: "⏳ Maj 20 — Före öppning",
    date: "2026-05-20T12:00:00+02:00",
    desc: "Gissningar inte öppna ännu — stor nedräkning visas.",
    color: "border-slate-500/30 text-slate-400 hover:bg-pitch-light/10",
  },
  {
    label: "📅 1 juni — Gissningarna öppnar",
    date: "2026-06-01T08:00:00+02:00",
    desc: "Track A + Track B aktiva. Urgency CTA syns på dashboarden.",
    color: "border-blue-500/30 text-blue-300 hover:bg-blue-900/10",
  },
  {
    label: "⏰ 11 juni 16:00 — Sista timmen",
    date: "2026-06-11T16:00:00Z",
    desc: "Röd nedräkning — Turnering + Kaos låser om 60 min.",
    color: "border-amber-500/40 text-amber-300 hover:bg-amber-900/10",
  },
  {
    label: "🔒 11 juni 17:01 — Precis låst",
    date: "2026-06-11T17:01:00Z",
    desc: "Turnering + Kaos låsta. Matchgissningar fortfarande öppna.",
    color: "border-amber-500/40 text-amber-300 hover:bg-amber-900/10",
  },
  {
    label: "⚽ 15 juni — Mitt i gruppspelet",
    date: "2026-06-15T18:00:00Z",
    desc: "Grupp-matcher pågår. Resultat visas för seedade demo-matcher.",
    color: "border-violet-500/40 text-violet-300 hover:bg-violet-900/10",
  },
  {
    label: "🏟️ 1 juli — Åttondelsfinaler",
    date: "2026-07-01T20:00:00Z",
    desc: "Knockout-fasen börjar. Matchgissningar för R16 öppna.",
    color: "border-violet-500/40 text-violet-300 hover:bg-violet-900/10",
  },
  {
    label: "⚡ 4 juli — Kvartsfinaler",
    date: "2026-07-04T20:00:00Z",
    desc: "QF-matcher. Sabotage + Punto Bandito kan användas mot rivaler.",
    color: "border-purple-500/40 text-purple-300 hover:bg-purple-900/10",
  },
  {
    label: "🃏 8 juli — Semifinal (Joker + Party Krafter aktiveras!)",
    date: "2026-07-08T19:00:00Z",
    desc: "Joker-kortet dyker upp på dashboarden. Sabotage är fullt aktivt.",
    color: "border-purple-500/40 text-purple-300 hover:bg-purple-900/20 font-semibold",
  },
  {
    label: "🏆 19 juli — VM-finalen",
    date: "2026-07-19T19:00:00Z",
    desc: "Allt låst. Slutresultat. Ligatabell färdig. Vem vann VM Soccer Sucker?",
    color: "border-gold/40 text-gold hover:bg-gold/10 font-semibold",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

type MsgState = { ok: boolean; text: string } | null;

function ActionBtn({
  label,
  onClick,
  pending,
  color = "border-pitch-light/30 text-green-300 hover:bg-pitch-light/10",
}: {
  label: string;
  onClick: () => void;
  pending: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-all disabled:opacity-40 text-sm font-semibold ${color}`}
    >
      {pending ? "⏳ Jobbar..." : label}
    </button>
  );
}

function Msg({ msg }: { msg: MsgState }) {
  if (!msg) return null;
  return (
    <div
      className={`rounded-lg px-3 py-2 text-xs whitespace-pre-wrap leading-relaxed ${
        msg.ok
          ? "bg-green-900/30 text-green-300 border border-green-500/30"
          : "bg-red-900/30 text-red-300 border border-red-500/30"
      }`}
    >
      {msg.text}
    </div>
  );
}

export default function DevPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [msgs, setMsgs] = useState<Record<string, MsgState>>({});
  const setMsg = (key: string, m: MsgState) => setMsgs((p) => ({ ...p, [key]: m }));

  function applyTime(isoDate: string | null) {
    if (isoDate === null) {
      document.cookie = "vm26_sim=; path=/; max-age=0";
    } else {
      document.cookie = `vm26_sim=${encodeURIComponent(isoDate)}; path=/; max-age=86400`;
    }
    router.refresh();
    router.push("/dashboard");
  }

  function run(key: string, fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      setMsg(key, null);
      const r = await fn();
      setMsg(key, { ok: r.ok, text: r.message });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="pitch-bg min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-5xl">🎮</p>
          <h1 className="font-bebas text-5xl text-gold tracking-widest leading-none">
            SIMULATION CONSOLE
          </h1>
          <p className="text-green-400 text-sm">VM Soccer Sucker · Dev-only</p>
          <p className="text-green-700 text-xs">Kör bara lokalt · Synkar inte till produktion</p>
        </div>

        {/* ── Migrations checklist ────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-500/40 bg-amber-900/15 p-4 text-xs text-amber-200 space-y-3">
          <p className="font-bold text-amber-300 text-sm">⚠️ Kör dessa migrationer FÖRST i Supabase SQL Editor</p>

          <div className="space-y-1">
            <p className="text-amber-400 font-semibold">1. Admin — migration 005_admin.sql</p>
            <code className="block font-mono text-[10px] bg-pitch-dark/70 px-3 py-2 rounded text-amber-100 leading-relaxed whitespace-pre">
              {`-- Kör hela filen: supabase/migrations/005_admin.sql`}
            </code>
          </div>

          <div className="space-y-1">
            <p className="text-amber-400 font-semibold">2. Track B power-ups — migration 006_track_b_powerups.sql</p>
            <code className="block font-mono text-[10px] bg-pitch-dark/70 px-3 py-2 rounded text-amber-100 leading-relaxed whitespace-pre">
              {`ALTER TYPE powerup_type ADD VALUE IF NOT EXISTS 'sabotage';
ALTER TYPE powerup_type ADD VALUE IF NOT EXISTS 'punto_bandito';`}
            </code>
          </div>

          <div className="space-y-1">
            <p className="text-amber-400 font-semibold">3. Party actions — migration 007_party_actions.sql</p>
            <code className="block font-mono text-[10px] bg-pitch-dark/70 px-3 py-2 rounded text-amber-100 leading-relaxed whitespace-pre">
              {`-- Kör hela filen: supabase/migrations/007_party_actions.sql
-- Krävs för: Sabotage + Punto Bandito mot rivaler per match`}
            </code>
          </div>

          <div className="space-y-1">
            <p className="text-amber-400 font-semibold">4. Seeda fixtures — supabase/seeds/wc2026_group_stage.sql</p>
            <code className="block font-mono text-[10px] bg-pitch-dark/70 px-3 py-2 rounded text-amber-100 leading-relaxed whitespace-pre">
              {`-- Kör hela filen: supabase/seeds/wc2026_group_stage.sql
-- Sätter in alla 72 gruppspelsmatcher — idempotent (kan köras igen)`}
            </code>
          </div>

          <div className="rounded bg-pitch-dark/50 px-3 py-2 text-amber-400/80">
            Sedan: Dashboard → Project Settings → API → <strong className="text-amber-300">Reload schema cache</strong>
          </div>
        </div>

        {/* ── Step 0: seed matches ─────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="font-bebas text-2xl text-violet-300 tracking-widest flex items-center gap-2">
            STEG 0 — SEEDA DEMO-MATCHER
          </h2>
          <p className="text-green-600 text-xs">
            Skapar 16 matcher: grupp → åttondel → kvart → semi → final. Kör detta FÖRST.
          </p>
          <div className="space-y-1.5">
            <ActionBtn
              label="🌍 Seeda ALLA 72 gruppspelsmatcher (alla 12 grupper)"
              onClick={() => run("groupstage", seedGroupStageFixtures)}
              pending={pending}
              color="border-green-500/40 text-green-300 hover:bg-green-900/10"
            />
            <ActionBtn
              label="⚽ Seeda demo-matcher (grupp → final, 16 st)"
              onClick={() => run("seed", seedDemoMatches)}
              pending={pending}
              color="border-violet-500/40 text-violet-300 hover:bg-violet-900/10"
            />
            <ActionBtn
              label="📋 Seeda demo-utfall (12 st — för scoring)"
              onClick={() => run("outcomes", seedDemoOutcomes)}
              pending={pending}
              color="border-blue-500/40 text-blue-300 hover:bg-blue-900/10"
            />
            <ActionBtn
              label="🗑️ Rensa demo-matcher"
              onClick={() => run("clear", clearDemoMatches)}
              pending={pending}
              color="border-red-500/30 text-red-400 hover:bg-red-900/10"
            />
          </div>
          <Msg msg={msgs["groupstage"]} />
          <Msg msg={msgs["seed"]} />
          <Msg msg={msgs["outcomes"]} />
          <Msg msg={msgs["clear"]} />
        </section>

        {/* ── Step 1: time travel ──────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="font-bebas text-2xl text-gold tracking-widest flex items-center gap-2">
            STEG 1 — TIDSMASKIN
          </h2>
          <p className="text-green-600 text-xs">
            Välj en fas — appen beter sig som om det är det datumet.
          </p>
          <div className="space-y-1.5">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyTime(p.date)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${p.color}`}
              >
                <div className="text-sm">{p.label}</div>
                <div className="text-xs opacity-60 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Step 2: match progression ────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="font-bebas text-2xl text-purple-300 tracking-widest">
            STEG 2 — MATCHEN SLUTAR (KNOCKOUT)
          </h2>
          <p className="text-green-600 text-xs">
            Sätt semifinal 2 och finalen till &ldquo;finished&rdquo; med resultat — simulerar att resultaten kommer in live.
          </p>
          <div className="space-y-1.5">
            <ActionBtn
              label="⚽ Semifinal 2 slutar: Brasilien 2–3 Argentina"
              onClick={() => run("sf2", finalizeSemiFinal)}
              pending={pending}
              color="border-purple-500/40 text-purple-300 hover:bg-purple-900/10"
            />
            <ActionBtn
              label="🏆 VM-FINALEN slutar: England 2–1 Argentina"
              onClick={() => run("final", finalizeFinal)}
              pending={pending}
              color="border-gold/40 text-gold hover:bg-gold/10"
            />
          </div>
          <Msg msg={msgs["sf2"]} />
          <Msg msg={msgs["final"]} />
          <p className="text-green-700 text-xs mt-1">
            Gå sedan till <strong className="text-green-400">/admin</strong> → Poängsätt match-spel + Poängsätt turnering/kaos → Ligatabell byggs!
          </p>
        </section>

        {/* ── Step 3: power-ups ────────────────────────────────────────── */}
        <section className="space-y-2">
          <h2 className="font-bebas text-2xl text-rose-300 tracking-widest">
            STEG 3 — KRAFTER &amp; POWER-UPS
          </h2>
          <p className="text-green-600 text-xs">
            Fyll på dina krafter för att testa alla features — Track A och Party Track.
          </p>
          <div className="space-y-1.5">
            <ActionBtn
              label="⚡ Fyll på ALLA krafter till max"
              onClick={() => run("refill", refillAllPowers)}
              pending={pending}
              color="border-gold/40 text-gold hover:bg-gold/10"
            />
            <ActionBtn
              label="🃏 Ge mig en Joker (kräver tid ≥ 8 juli)"
              onClick={() => run("joker", grantJoker)}
              pending={pending}
              color="border-purple-500/40 text-purple-300 hover:bg-purple-900/10"
            />
            <ActionBtn
              label="🧊🦊 Ge mig Sabotage + Punto Bandito (×2)"
              onClick={() => run("trackb", grantTrackBPowers)}
              pending={pending}
              color="border-rose-500/40 text-rose-300 hover:bg-rose-900/10"
            />
          </div>
          <Msg msg={msgs["refill"]} />
          <Msg msg={msgs["joker"]} />
          <Msg msg={msgs["trackb"]} />
        </section>

        {/* ── Full simulation walkthrough ──────────────────────────────── */}
        <section className="rounded-2xl border border-pitch-light/20 bg-pitch/40 p-4 space-y-3">
          <h2 className="font-bebas text-xl text-gold tracking-widest">
            🎮 FULL SIMULATION WALKTHROUGH
          </h2>
          <p className="text-green-600 text-[10px]">
            Simulerar hela spelupplevelsen från 1 juni till 19 juli — Fan Track + Party Track.
          </p>
          <ol className="space-y-2.5 text-xs text-green-400 list-decimal list-inside leading-relaxed">
            <li>
              <strong className="text-white">Seeda 72 matcher</strong>{" "}
              — klicka <em>Seeda ALLA 72 gruppspelsmatcher</em> ovan
            </li>
            <li>
              <strong className="text-white">Seeda demo-matcher + utfall</strong>{" "}
              — klicka <em>Seeda demo-matcher</em> + <em>Seeda demo-utfall</em> (för knockout-fasen)
            </li>
            <li>
              <strong className="text-white">Fyll på krafter</strong>{" "}
              — klicka <em>Fyll på ALLA krafter</em> (inkl. 🧊 Sabotage + 🦊 Punto Bandito)
            </li>
            <li>
              <strong className="text-white">Res till 1 juni</strong>{" "}
              — Tidsmaskin: &ldquo;1 juni — Gissningarna öppnar&rdquo;
            </li>
            <li>
              <strong className="text-white">Lägg Fan Track-gissningar</strong>{" "}
              → <a href="/bets/turnering" className="text-blue-400 underline">/bets/turnering</a>{" "}
              och <a href="/bets/match" className="text-violet-400 underline">/bets/match</a>{" "}
              — alla 72 matcher öppna, inga låsta
            </li>
            <li>
              <strong className="text-white">Lägg Kaos-gissningar</strong>{" "}
              → <a href="/bets/kaos" className="text-rose-400 underline">/bets/kaos</a>{" "}
              — 6 JA/NEJ scenarion
            </li>
            <li>
              <strong className="text-white">Testa Party Track per match</strong>{" "}
              — gå till en matchsida, skrolla till 🔥 Party Track-sektionen längst ner.
              Före lock: aktivera 🦊 Punto Bandito. Res sedan till{" "}
              <em>&ldquo;11 juni 17:01 — Precis låst&rdquo;</em>{" "}
              och revisita matchen — nu ser du spelarnas val och 🧊 Sabotera-knappar visas
            </li>
            <li>
              <strong className="text-white">Res till 15 juni</strong>{" "}
              — gruppspelet pågår, demo-matchresultat visas
            </li>
            <li>
              <strong className="text-white">Poängsätt match-spel</strong>{" "}
              → <a href="/admin" className="text-green-400 underline">/admin</a>{" "}
              — klicka &ldquo;Poängsätt match-spel&rdquo; — Sabotage + Punto Bandito löses samtidigt
            </li>
            <li>
              <strong className="text-white">Res till 8 juli</strong>{" "}
              — Joker aktiveras på dashboarden
            </li>
            <li>
              <strong className="text-white">Slutföra finalen</strong>{" "}
              — klicka <em>VM-FINALEN slutar</em> ovan
            </li>
            <li>
              <strong className="text-white">Poängsätt allt</strong>{" "}
              → <a href="/admin" className="text-green-400 underline">/admin</a>{" "}
              — &ldquo;Poängsätt turnering/kaos&rdquo; → ligatabell klar!
            </li>
            <li>
              <strong className="text-white">Res till 19 juli</strong>{" "}
              → <a href="/dashboard" className="text-gold underline">/dashboard</a>{" "}
              — vem vann VM Soccer Sucker?
            </li>
          </ol>

          <div className="rounded-lg border border-green-600/30 bg-green-900/10 p-3 text-[10px] text-green-400 space-y-1">
            <p className="font-bold text-green-300">💡 Hur Party Track-sektionen beter sig per fas</p>
            <p>🟢 <strong>Öppen match (före lock)</strong>: visar spelarantal + Punto Bandito-knapp</p>
            <p>🔒 <strong>Låst match (15 min före kick-off)</strong>: visar alla spelares val + 🧊 Sabotera-knappar</p>
            <p>⚠️ <strong>Du saboterades</strong>: varningsruta visas på din matchsida om du är målad</p>
            <p>✅ <strong>Löst vid bedömning</strong>: admin /admin Poängsätt match → partykrafter processas automatiskt</p>
          </div>
        </section>

      </div>
    </div>
  );
}
