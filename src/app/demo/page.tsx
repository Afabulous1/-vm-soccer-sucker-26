"use client";

import { useState } from "react";
import Link from "next/link";
import { AVATARS } from "@/lib/avatars";
import { TURNERING_BETS, KAOS_BETS, WC_GROUPS } from "@/lib/bets";
import { WC_TEAMS, FAMOUS_PLAYERS } from "@/lib/teams";
import { getFlag } from "@/lib/flags";

// ─── Simulated World Cup data ────────────────────────────────────────────────

const DEMO_RESULTS = [
  { home: "USA", away: "Mexiko", hs: 2, as: 1, group: "C" },
  { home: "Brasilien", away: "England", hs: 3, as: 0, group: "D" },
  { home: "Spanien", away: "Tyskland", hs: 2, as: 2, group: "E" },
];

const DEMO_UPCOMING = [
  { home: "Frankrike", away: "Argentina", time: "15 jun · 21:00", group: "A" },
  { home: "Portugal", away: "Brasilien", time: "16 jun · 18:00", group: "B" },
  { home: "Sverige", away: "Japan", time: "17 jun · 15:00", group: "F" },
  { home: "England", away: "Spanien", time: "18 jun · 21:00", group: "G" },
];

const DEMO_LEADERBOARD_BASE = [
  { username: "Taktik-Torsten", avatarKey: "hat_trick_harry", points: 8450, rank: 1 },
  { username: "VAR-Vendela", avatarKey: "var_karen", points: 7200, rank: 2 },
  // rank 3 is the demo user — injected dynamically
  { username: "Felläges-Frida", avatarKey: "offside_olga", points: 3820, rank: 4 },
  { username: "Evige Svensson", avatarKey: "sucker_steve", points: 2310, rank: 5 },
];

const DEMO_TRASH = [
  { username: "Taktik-Torsten", avatarKey: "hat_trick_harry", msg: "Spanien vinner VM, det sa jag från dag 1! 🏆" },
  { username: "VAR-Vendela", avatarKey: "var_karen", msg: "Fel! Frankrike vinner klart. Titta på min liga!" },
  { username: "Felläges-Frida", avatarKey: "offside_olga", msg: "Sverige till final... höll på att skriva 😅" },
];

const POWER_UPS = [
  { emoji: "⚡", name: "Dubbel eller ingenting", qty: 3, desc: "2× om rätt, 0 om fel", color: "text-gold border-gold/30 bg-gold/10" },
  { emoji: "🧠", name: "Taktikgeniet", qty: 3, desc: "50% poäng om rätt sida men fel resultat", color: "text-blue-300 border-blue-500/30 bg-blue-900/20" },
  { emoji: "✨", name: "Sexpoängaren", qty: 3, desc: "+600p bonus utöver vanliga poäng", color: "text-violet-300 border-violet-500/30 bg-violet-900/20" },
  { emoji: "⏪", name: "Tidsmaskinen", qty: 2, desc: "Ändra gissning en gång efter avspark", color: "text-cyan-300 border-cyan-500/30 bg-cyan-900/20" },
  { emoji: "🛡️", name: "Försäkringen", qty: 2, desc: "Behåll 50% om du har fel (sköld)", color: "text-green-300 border-green-500/30 bg-green-900/20" },
  { emoji: "🃏", name: "Joker", qty: 1, desc: "Stjäl poängen från en annan spelares matchvinst", color: "text-purple-300 border-purple-500/30 bg-purple-900/20" },
];

const STEPS = [
  { id: "welcome", label: "Välkommen" },
  { id: "persona", label: "Persona" },
  { id: "turnering", label: "Turnering" },
  { id: "match", label: "Match" },
  { id: "kaos", label: "Kaos" },
  { id: "dashboard", label: "Dashboard" },
  { id: "done", label: "Klart!" },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function DemoToast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-green-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-bounce_in whitespace-nowrap">
      {msg}
    </div>
  );
}

function StepNav({
  step, onPrev, onNext, nextLabel = "NÄSTA →",
}: {
  step: number; onPrev: () => void; onNext: () => void; nextLabel?: string;
}) {
  return (
    <div className="flex gap-2 pt-4 sticky bottom-4">
      {step > 0 && (
        <button
          onClick={onPrev}
          className="flex-1 border border-pitch-light/30 text-green-400 font-semibold py-3 rounded-xl text-sm hover:bg-pitch-light/10 transition-all"
        >
          ← Tillbaka
        </button>
      )}
      <button
        onClick={onNext}
        className="flex-1 bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-xl tracking-widest py-3 rounded-xl transition-all active:scale-95"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-4">
      <div className="flex justify-center gap-1.5 mb-2">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === step ? "bg-gold w-5" : i < step ? "bg-gold/40 w-3" : "bg-pitch-light/30 w-1.5"
            }`}
          />
        ))}
      </div>
      <p className="text-center text-green-600 text-xs">
        Steg {step + 1} av {total} — <span className="text-green-400">{STEPS[step]?.label}</span>
      </p>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="text-8xl">🎭</div>
        <h1 className="font-bebas text-5xl text-gold tracking-widest leading-none">
          GUIDED TOUR
        </h1>
        <div className="rounded-2xl border-2 border-amber-400/60 bg-amber-400/10 p-4 text-amber-200 text-sm space-y-1">
          <p className="font-bold text-amber-300 text-base">Detta är en 100% simulerad demonstration.</p>
          <p>Inget sparas på riktigt. Du behöver inget konto. Prova allt fritt!</p>
        </div>
        <p className="text-green-300 text-sm leading-relaxed">
          Den här guiden tar dig igenom hela appen — från att skapa din persona till att lägga gissningar och
          följa ligatabellen. Du ser exakt hur VM Soccer Sucker 26 fungerar.
        </p>
      </div>

      <div className="rounded-2xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-2.5 text-sm">
        {[
          { emoji: "🏟️", text: "Välj din VM-persona och avatar" },
          { emoji: "🏆", text: "Lägg turneringsgissningar (VM-vinnare, skyttekung, finalisterna...)" },
          { emoji: "⚽", text: "Gissa enskilda matchresultat med power-ups" },
          { emoji: "🔥", text: "Kaosgissningar — 10 000p om du har rätt" },
          { emoji: "📊", text: "Se dashboarden med ligatablell och matchresultat" },
        ].map(f => (
          <div key={f.text} className="flex items-center gap-3">
            <span className="text-xl shrink-0">{f.emoji}</span>
            <span className="text-green-300">{f.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-2xl tracking-widest py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-gold/25"
      >
        STARTA TUREN →
      </button>
    </div>
  );
}

function StepPersona({
  username, avatarKey, onUsernameChange, onAvatarChange, onNext, onPrev,
}: {
  username: string;
  avatarKey: string | null;
  onUsernameChange: (v: string) => void;
  onAvatarChange: (v: string) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const selectedAv = AVATARS.find(a => a.key === avatarKey);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-2">🏟️</div>
        <h2 className="font-bebas text-4xl text-gold tracking-widest">VÄLJ DIN PERSONA!</h2>
        <p className="text-green-400 text-sm mt-1">Vem är du på läktaren? Välj klokt.</p>
      </div>

      <div>
        <label className="text-green-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">
          Ditt spelarnamn
        </label>
        <input
          type="text"
          value={username}
          onChange={e => onUsernameChange(e.target.value.slice(0, 20))}
          placeholder="Välj ett nickname..."
          className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-white text-sm placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto">
        {AVATARS.map(av => {
          const isSelected = avatarKey === av.key;
          return (
            <button
              key={av.key}
              type="button"
              onClick={() => onAvatarChange(av.key)}
              className={`relative rounded-xl p-3 text-center transition-all duration-200 active:scale-95 bg-gradient-to-br ${av.gradient} ${
                isSelected
                  ? `ring-4 ${av.ringColor} ring-offset-2 ring-offset-pitch-dark scale-[1.03] shadow-lg`
                  : "ring-2 ring-transparent hover:ring-white/20"
              }`}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 bg-white rounded-full w-5 h-5 flex items-center justify-center">
                  <span className="text-pitch-dark text-xs font-bold">✓</span>
                </div>
              )}
              <div className="text-4xl mb-1">{av.emoji}</div>
              <p className="text-white font-bold text-xs leading-tight">{av.name}</p>
              <p className="text-white/70 text-[10px] leading-tight mt-0.5 line-clamp-2">{av.tagline}</p>
            </button>
          );
        })}
      </div>

      {selectedAv && (
        <div className={`rounded-xl p-4 bg-gradient-to-r ${selectedAv.gradient} text-center`}>
          <div className="text-4xl mb-1">{selectedAv.emoji}</div>
          <p className="text-white font-semibold text-sm">{selectedAv.name}</p>
          <p className="text-white/80 text-xs italic mt-0.5">&ldquo;{selectedAv.tagline}&rdquo;</p>
        </div>
      )}

      <StepNav step={1} onPrev={onPrev} onNext={onNext} nextLabel={avatarKey ? "KLAR MED PERSONA →" : "Välj en avatar för att fortsätta"} />
    </div>
  );
}

function StepTurnering({
  onNext, onPrev, showToast,
}: { onNext: () => void; onPrev: () => void; showToast: (msg: string) => void }) {
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>(() => {
    const init: Record<string, Record<string, unknown>> = {};
    TURNERING_BETS.forEach(b => { init[b.id] = {}; });
    return init;
  });
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState("");

  function update(betId: string, key: string, val: unknown) {
    setValues(prev => ({ ...prev, [betId]: { ...prev[betId], [key]: val } }));
  }

  function saveBet(betId: string, points: number) {
    setSaved(prev => { const s = new Set(prev); s.add(betId); return s; });
    showToast(`Gissning sparad! +${points}p ✅ (simulering)`);
  }

  const filteredTeams = WC_TEAMS.filter(t => t.toLowerCase().includes(teamSearch.toLowerCase())).slice(0, 12);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bebas text-4xl text-gold tracking-widest">TURNERINGSGISSNINGAR</h2>
        <p className="text-green-400 text-sm mt-1">
          6 gissningar om hela turneringen · låser 11 juni ·{" "}
          <span className="text-blue-300 font-semibold">{saved.size}/{TURNERING_BETS.length} sparade</span>
        </p>
      </div>

      {TURNERING_BETS.map(bet => {
        const val = values[bet.id] ?? {};
        const isSaved = saved.has(bet.id);

        return (
          <div
            key={bet.id}
            className={`rounded-xl border p-4 space-y-3 ${isSaved ? "border-blue-500/40 bg-blue-900/15" : "border-pitch-light/30 bg-pitch/40"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-white font-bold text-sm">{bet.label}</h3>
                <p className="text-green-400 text-xs mt-0.5">{bet.description}</p>
              </div>
              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                {bet.points}p
              </span>
            </div>

            {isSaved && (
              <p className="text-green-400 text-xs">
                ✓ Sparad:{" "}
                <span className="text-white font-semibold">
                  {Object.values(val).filter(Boolean).join(" vs ") || "—"}
                </span>
              </p>
            )}

            <div className="space-y-2">
              {bet.inputType === "team" && (
                <div className="relative">
                  <div
                    className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-sm cursor-pointer flex justify-between items-center hover:border-gold/40"
                    onClick={() => { setOpenDropdown(openDropdown === bet.id ? null : bet.id); setTeamSearch(""); }}
                  >
                    <span className={(val.team as string) ? "text-white" : "text-green-700"}>
                      {(val.team as string) ? `${getFlag(val.team as string)} ${val.team}` : "Välj lag..."}
                    </span>
                    <span className="text-green-600 text-xs">{openDropdown === bet.id ? "▲" : "▼"}</span>
                  </div>
                  {openDropdown === bet.id && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-pitch-dark border border-pitch-light/50 rounded-lg shadow-xl overflow-hidden">
                      <input autoFocus value={teamSearch} onChange={e => setTeamSearch(e.target.value)} placeholder="Sök lag..." className="w-full bg-pitch-dark px-3 py-2 text-sm text-white placeholder-green-700 border-b border-pitch-light/30 outline-none" />
                      <div className="max-h-40 overflow-y-auto">
                        {filteredTeams.map(t => (
                          <button key={t} type="button" className="w-full text-left px-3 py-2 text-sm text-white hover:bg-pitch-light/30 transition-colors"
                            onClick={() => { update(bet.id, "team", t); setOpenDropdown(null); }}>
                            {getFlag(t)} {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {bet.inputType === "two-teams" && (
                <div className="grid grid-cols-2 gap-2">
                  {["team1", "team2"].map(key => (
                    <div key={key} className="relative">
                      <div className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-sm cursor-pointer flex justify-between items-center hover:border-gold/40"
                        onClick={() => { setOpenDropdown(openDropdown === `${bet.id}_${key}` ? null : `${bet.id}_${key}`); setTeamSearch(""); }}>
                        <span className={(val[key] as string) ? "text-white text-xs" : "text-green-700 text-xs"}>
                          {(val[key] as string) ? `${getFlag(val[key] as string)} ${val[key]}` : "Välj lag..."}
                        </span>
                      </div>
                      {openDropdown === `${bet.id}_${key}` && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-pitch-dark border border-pitch-light/50 rounded-lg shadow-xl overflow-hidden">
                          <input autoFocus value={teamSearch} onChange={e => setTeamSearch(e.target.value)} placeholder="Sök..." className="w-full bg-pitch-dark px-3 py-2 text-sm text-white placeholder-green-700 border-b border-pitch-light/30 outline-none" />
                          <div className="max-h-36 overflow-y-auto">
                            {filteredTeams.map(t => (
                              <button key={t} type="button" className="w-full text-left px-3 py-2 text-xs text-white hover:bg-pitch-light/30"
                                onClick={() => { update(bet.id, key, t); setOpenDropdown(null); }}>
                                {getFlag(t)} {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {bet.inputType === "player" && (
                <select
                  value={(val.player as string) ?? ""}
                  onChange={e => update(bet.id, "player", e.target.value)}
                  className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Välj spelare...</option>
                  {FAMOUS_PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}

              {bet.inputType === "number" && (
                <input type="number" min={0} max={500} value={(val.goals as number) ?? ""}
                  onChange={e => update(bet.id, "goals", parseInt(e.target.value))}
                  placeholder="Antal mål..."
                  className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              )}

              {bet.inputType === "group" && (
                <div className="flex flex-wrap gap-2">
                  {WC_GROUPS.map(g => (
                    <button key={g} type="button" onClick={() => update(bet.id, "group", g)}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${val.group === g ? "bg-blue-500 text-white scale-110" : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-blue-400/60"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => saveBet(bet.id, bet.points)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bebas text-lg tracking-widest py-2.5 rounded-xl transition-all active:scale-95"
              >
                {isSaved ? "UPPDATERA GISSNING" : "SPARA GISSNING"}
              </button>
            </div>
          </div>
        );
      })}

      <StepNav step={2} onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

function StepMatch({
  onNext, onPrev, showToast,
}: { onNext: () => void; onPrev: () => void; showToast: (msg: string) => void }) {
  const [result, setResult] = useState<"1" | "X" | "2" | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [scorer, setScorer] = useState("");
  const [redCard, setRedCard] = useState<boolean | null>(null);
  const [powerUp, setPowerUp] = useState<string | null>(null);
  const [shield, setShield] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    showToast("Matchgissning sparad! +113p 🧠 (simulering)");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bebas text-4xl text-gold tracking-widest">MATCHGISSNING</h2>
        <p className="text-green-400 text-sm mt-1">Gissa per match — låser vid avspark · power-ups tillgängliga</p>
      </div>

      {/* Match card */}
      <div className="rounded-2xl border border-violet-500/30 bg-violet-900/10 p-5">
        <p className="text-violet-300 text-xs font-semibold mb-3">Grupp A · 15 jun · 21:00 CET</p>
        <div className="flex items-center justify-between gap-4 text-center">
          <div className="flex-1">
            <div className="text-4xl mb-1">{getFlag("Frankrike")}</div>
            <p className="text-white font-bold">Frankrike</p>
          </div>
          <div className="shrink-0">
            <p className="font-bebas text-3xl text-gold tracking-widest">VS</p>
          </div>
          <div className="flex-1">
            <div className="text-4xl mb-1">{getFlag("Argentina")}</div>
            <p className="text-white font-bold">Argentina</p>
          </div>
        </div>
      </div>

      {/* Match result */}
      <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Matchresultat</h3>
            <p className="text-green-400 text-xs">Hemmavinst / Oavgjort / Bortavinst</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 font-semibold">10p</span>
        </div>
        <div className="flex gap-2">
          {(["1", "X", "2"] as const).map(opt => (
            <button key={opt} type="button" onClick={() => setResult(opt)}
              className={`flex-1 py-3 rounded-xl font-bebas text-2xl tracking-widest transition-all ${result === opt ? "bg-violet-600 text-white scale-105 shadow-lg" : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-violet-400/50"}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Exact score */}
      <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Exakt slutresultat</h3>
            <p className="text-green-400 text-xs">Gissa exakt slutresultat</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 font-semibold">50p</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="number" min={0} max={20} value={homeScore} onChange={e => setHomeScore(e.target.value)} placeholder="0" className="flex-1 bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-sm text-white text-center placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
          <span className="font-bebas text-2xl text-gold">–</span>
          <input type="number" min={0} max={20} value={awayScore} onChange={e => setAwayScore(e.target.value)} placeholder="0" className="flex-1 bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-sm text-white text-center placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
        </div>
      </div>

      {/* First scorer */}
      <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Första målskytt</h3>
            <p className="text-green-400 text-xs">Vem gör matchens första mål?</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 font-semibold">30p</span>
        </div>
        <select value={scorer} onChange={e => setScorer(e.target.value)}
          className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30">
          <option value="">Välj spelare...</option>
          {FAMOUS_PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Red card */}
      <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Rött kort visas</h3>
            <p className="text-green-400 text-xs">Visas något rött kort i matchen?</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 font-semibold">15p</span>
        </div>
        <div className="flex gap-2">
          {[true, false].map(v => (
            <button key={String(v)} type="button" onClick={() => setRedCard(v)}
              className={`flex-1 py-3 rounded-xl font-bebas text-xl tracking-widest transition-all ${redCard === v ? (v ? "bg-green-600 text-white scale-105" : "bg-red-600 text-white scale-105") : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-rose-400/50"}`}>
              {v ? "JA! 🔥" : "NEJ 🧊"}
            </button>
          ))}
        </div>
      </div>

      {/* Power-ups */}
      <div className="rounded-xl border border-pitch-light/20 bg-pitch/30 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-green-600 font-semibold">POWER-UPS (simulering)</p>
        <div className="flex flex-wrap gap-1.5">
          {POWER_UPS.filter(p => p.emoji !== "🃏" && p.emoji !== "🛡️").map(pu => (
            <button key={pu.name} type="button" onClick={() => setPowerUp(powerUp === pu.name ? null : pu.name)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all border ${powerUp === pu.name ? "bg-gold text-pitch-dark border-gold shadow shadow-gold/30 scale-105" : "bg-pitch-dark text-green-300 border-pitch-light/40 hover:border-gold/40"}`}>
              {pu.emoji} <span className="hidden sm:inline">{pu.name}</span> <span className="text-[10px] opacity-70">×{pu.qty}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-green-600 font-semibold">SKÖLD</p>
        <div className="flex flex-wrap gap-1.5">
          {POWER_UPS.filter(p => p.emoji === "🛡️").map(pu => (
            <button key={pu.name} type="button" onClick={() => setShield(shield === pu.name ? null : pu.name)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all border ${shield === pu.name ? "bg-blue-500 text-white border-blue-400 shadow shadow-blue-500/30 scale-105" : "bg-pitch-dark text-blue-300 border-blue-500/30 hover:border-blue-400/50"}`}>
              {pu.emoji} {pu.name} <span className="text-[10px] opacity-70">×{pu.qty}</span>
            </button>
          ))}
        </div>
        {(powerUp || shield) && (
          <p className="text-[11px] text-amber-300 border-t border-pitch-light/20 pt-2">
            {powerUp && <>{POWER_UPS.find(p => p.name === powerUp)?.emoji} <strong>{powerUp}:</strong> {POWER_UPS.find(p => p.name === powerUp)?.desc}</>}
            {powerUp && shield && " · "}
            {shield && <>{POWER_UPS.find(p => p.name === shield)?.emoji} <strong>{shield}:</strong> {POWER_UPS.find(p => p.name === shield)?.desc}</>}
          </p>
        )}
      </div>

      <button onClick={save} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bebas text-xl tracking-widest py-3 rounded-xl transition-all active:scale-95">
        {saved ? "✓ UPPDATERA MATCHGISSNING" : "SPARA MATCHGISSNING"}
      </button>

      <StepNav step={3} onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

function StepKaos({
  onNext, onPrev, showToast,
}: { onNext: () => void; onPrev: () => void; showToast: (msg: string) => void }) {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>(() => {
    const init: Record<string, boolean | null> = {};
    KAOS_BETS.forEach(b => { init[b.id] = null; });
    return init;
  });
  const [saved, setSaved] = useState<Set<string>>(new Set());

  function save(betId: string) {
    setSaved(prev => { const s = new Set(prev); s.add(betId); return s; });
    showToast("Kaosgissning sparad! +10 000p 🔥 (simulering)");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bebas text-4xl text-gold tracking-widest">KAOSGISSNINGAR</h2>
        <p className="text-green-400 text-sm mt-1">
          6 vilda gissningar · 10 000p styck · låser 11 juni ·{" "}
          <span className="text-rose-300 font-semibold">{saved.size}/{KAOS_BETS.length} sparade</span>
        </p>
      </div>

      {KAOS_BETS.map(bet => {
        const isSaved = saved.has(bet.id);
        const answer = answers[bet.id];

        return (
          <div key={bet.id} className={`rounded-xl border p-4 space-y-3 ${isSaved ? "border-rose-500/40 bg-rose-900/10" : "border-pitch-light/30 bg-pitch/40"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-white font-bold text-sm">{bet.label}</h3>
                <p className="text-rose-300/80 text-xs mt-0.5">{bet.description}</p>
              </div>
              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-300 font-semibold">10 000p</span>
            </div>

            {isSaved && (
              <p className="text-green-400 text-xs">
                ✓ Sparad: <span className="text-white font-semibold">{answer === true ? "JA 🔥" : "NEJ 🧊"}</span>
              </p>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button key={String(v)} type="button" onClick={() => setAnswers(prev => ({ ...prev, [bet.id]: v }))}
                    className={`flex-1 py-3 rounded-xl font-bebas text-xl tracking-widest transition-all active:scale-95 ${answer === v ? (v ? "bg-green-600 text-white scale-105 shadow-lg shadow-green-900/50" : "bg-red-600 text-white scale-105 shadow-lg shadow-red-900/50") : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-rose-400/50"}`}>
                    {v ? "JA! 🔥" : "NEJ 🧊"}
                  </button>
                ))}
              </div>
              <button onClick={() => save(bet.id)} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bebas text-lg tracking-widest py-2.5 rounded-xl transition-all active:scale-95">
                {isSaved ? "UPPDATERA GISSNING" : "SPARA GISSNING"}
              </button>
            </div>
          </div>
        );
      })}

      <StepNav step={4} onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

function StepDashboard({
  username, avatarKey, onNext, onPrev,
}: { username: string; avatarKey: string | null; onNext: () => void; onPrev: () => void }) {
  const selectedAv = AVATARS.find(a => a.key === avatarKey);
  const displayName = username || "Demo-Spelaren";

  const leaderboard = [
    DEMO_LEADERBOARD_BASE[0],
    DEMO_LEADERBOARD_BASE[1],
    { username: displayName, avatarKey: avatarKey ?? "el_capitan", points: 4820, rank: 3, isMe: true },
    DEMO_LEADERBOARD_BASE[2],
    DEMO_LEADERBOARD_BASE[3],
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bebas text-4xl text-gold tracking-widest">DITT DASHBOARD</h2>
        <p className="text-green-400 text-sm mt-1">Så här ser dashboarden ut under turneringen</p>
      </div>

      {/* Hero card */}
      <div className="rounded-3xl border border-gold/15 bg-gradient-to-br from-pitch-dark/90 via-pitch/70 to-pitch-dark/80 p-5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-br ${selectedAv?.gradient ?? "from-pitch to-pitch-light"} shadow-inner`}>
            {selectedAv?.emoji ?? "⚽"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-green-600 text-[10px] uppercase tracking-widest">Välkommen tillbaka</p>
            <h3 className="font-bebas text-3xl text-gold tracking-widest truncate">{displayName.toUpperCase()}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-white font-bold text-xl">4 820 p</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold bg-amber-700/20 text-amber-500 border-amber-700/40">#3</span>
              <span className="text-xs bg-orange-900/40 border border-orange-600/30 text-orange-400 font-semibold px-2 py-0.5 rounded-full">🔥 3 rätt i rad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live VM banner */}
      <div className="rounded-2xl border border-green-500/25 bg-gradient-to-br from-green-900/20 to-green-800/10 px-5 py-4 text-center">
        <p className="text-green-400 font-bebas text-2xl tracking-widest">🏟️ VM 2026 ÄR LIVE!</p>
        <p className="text-green-600 text-xs mt-1">Matcherna pågår — följ poängen nedan</p>
      </div>

      {/* Recent results */}
      <div>
        <h3 className="font-bebas text-xl text-gold tracking-widest mb-2">SENASTE RESULTAT</h3>
        <div className="space-y-2">
          {DEMO_RESULTS.map((m, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-pitch-light/20 bg-pitch/30 px-4 py-3">
              <div className="flex-1 text-right">
                <p className="text-white font-semibold text-sm">{getFlag(m.home)} {m.home}</p>
              </div>
              <div className="shrink-0 text-center px-3">
                <p className="font-bebas text-xl text-gold">{m.hs} – {m.as}</p>
                <p className="text-green-700 text-[10px]">Grupp {m.group}</p>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{getFlag(m.away)} {m.away}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="font-bebas text-xl text-gold tracking-widest mb-2">KOMMANDE MATCHER</h3>
        <div className="space-y-2">
          {DEMO_UPCOMING.slice(0, 3).map((m, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-900/10 px-4 py-3">
              <div className="flex-1 text-right">
                <p className="text-white font-semibold text-sm">{getFlag(m.home)} {m.home}</p>
              </div>
              <div className="shrink-0 text-center px-3">
                <p className="text-green-700 font-bold text-xs">vs</p>
                <p className="text-violet-400 text-[10px] mt-0.5">{m.time}</p>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{getFlag(m.away)} {m.away}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h3 className="font-bebas text-xl text-gold tracking-widest mb-2">LIGATABELLEN</h3>
        <div className="rounded-2xl border border-pitch-light/20 bg-pitch/40 divide-y divide-pitch-light/10">
          {leaderboard.map((p, i) => {
            const av = AVATARS.find(a => a.key === p.avatarKey);
            const isMe = "isMe" in p && p.isMe;
            const rankMedal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-gold/5" : ""}`}>
                <span className="text-sm w-6 shrink-0">{rankMedal}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 bg-gradient-to-br ${av?.gradient ?? "from-pitch to-pitch-light"}`}>
                  {av?.emoji ?? "⚽"}
                </div>
                <span className={`font-semibold text-sm flex-1 truncate ${isMe ? "text-gold" : "text-white"}`}>
                  {p.username}{isMe ? " (du)" : ""}
                </span>
                <span className="text-green-400 text-xs tabular-nums shrink-0">
                  {p.points.toLocaleString("sv-SE")} p
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trash talk */}
      <div>
        <h3 className="font-bebas text-xl text-gold tracking-widest mb-2">SKRÄPSNACK</h3>
        <div className="rounded-2xl border border-pitch-light/20 bg-pitch/40 divide-y divide-pitch-light/10">
          {DEMO_TRASH.map((msg, i) => {
            const av = AVATARS.find(a => a.key === msg.avatarKey);
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 bg-gradient-to-br ${av?.gradient ?? "from-pitch to-pitch-light"}`}>
                  {av?.emoji ?? "⚽"}
                </div>
                <div>
                  <p className="text-gold text-xs font-semibold">{msg.username}</p>
                  <p className="text-green-300 text-sm mt-0.5">{msg.msg}</p>
                </div>
              </div>
            );
          })}
          <div className="px-4 py-3">
            <div className="flex gap-2">
              <input disabled value="Skriv ditt skräpsnack här... (simulering)" className="flex-1 bg-pitch-dark border border-pitch-light/30 rounded-lg px-3 py-2 text-xs text-green-700 opacity-60 cursor-not-allowed" />
              <button disabled className="bg-pitch-light/20 text-green-700 text-xs px-3 rounded-lg cursor-not-allowed">SKICKA</button>
            </div>
          </div>
        </div>
      </div>

      <StepNav step={5} onPrev={onPrev} onNext={onNext} nextLabel="SE SAMMANFATTNING →" />
    </div>
  );
}

function StepDone({ avatarKey }: { avatarKey: string | null }) {
  const selectedAv = AVATARS.find(a => a.key === avatarKey);
  return (
    <div className="space-y-6 text-center">
      <div className="text-8xl">{selectedAv?.emoji ?? "🏆"}</div>

      <div>
        <h2 className="font-bebas text-5xl text-gold tracking-widest leading-none">
          DU ÄR REDO!
        </h2>
        <p className="text-green-300 text-sm mt-3 leading-relaxed">
          Nu har du sett hela appen. Dags att skapa ditt riktiga konto och börja tävla mot dina kompisar på riktigt!
        </p>
      </div>

      <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-amber-200 text-sm space-y-1">
        <p className="font-bold text-amber-300">Kom ihåg:</p>
        <p>Det du gjorde i denna demo sparades inte. Skapa ett konto för att börja på riktigt.</p>
      </div>

      <div className="rounded-2xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-2.5 text-left text-sm">
        {[
          "✅ Turneringsgissningar öppnar 1 juni 2026",
          "✅ Matchgissningar tillgängliga hela VM",
          "✅ Power-ups och Joker ingår för alla",
          "✅ Live ligatabell och skräpsnack",
          "✅ Gratis att använda — inga pengar, bara ära",
        ].map(t => <p key={t} className="text-green-300">{t}</p>)}
      </div>

      <div className="space-y-3">
        <Link
          href="/auth"
          className="block bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-2xl tracking-widest px-10 py-4 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-gold/25"
        >
          SKAPA KONTO &amp; BÖRJA GISSA 🚀
        </Link>
        <Link href="/" className="block text-green-600 text-xs hover:text-green-400 transition-colors">
          ← Tillbaka till startsidan
        </Link>
      </div>
    </div>
  );
}

// ─── Main demo page ───────────────────────────────────────────────────────────

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [username, setUsername] = useState("MittNamn");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function prev() { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return (
    <div className="pitch-bg min-h-screen pb-12">
      <div className="relative max-w-xl mx-auto px-4 py-6">
        <ProgressBar step={step} total={STEPS.length} />

        {step === 0 && <StepWelcome onNext={next} />}
        {step === 1 && (
          <StepPersona
            username={username}
            avatarKey={avatarKey}
            onUsernameChange={setUsername}
            onAvatarChange={setAvatarKey}
            onNext={avatarKey ? next : () => showToast("Välj en avatar först!")}
            onPrev={prev}
          />
        )}
        {step === 2 && <StepTurnering onNext={next} onPrev={prev} showToast={showToast} />}
        {step === 3 && <StepMatch onNext={next} onPrev={prev} showToast={showToast} />}
        {step === 4 && <StepKaos onNext={next} onPrev={prev} showToast={showToast} />}
        {step === 5 && (
          <StepDashboard username={username} avatarKey={avatarKey} onNext={next} onPrev={prev} />
        )}
        {step === 6 && <StepDone avatarKey={avatarKey} />}
      </div>

      <DemoToast msg={toast} />
    </div>
  );
}
