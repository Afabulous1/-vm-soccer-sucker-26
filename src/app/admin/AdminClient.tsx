"use client";

import { useState, useTransition } from "react";
import { WC_TEAMS, FAMOUS_PLAYERS } from "@/lib/teams";
import { TURNERING_BETS, KAOS_BETS, WC_GROUPS } from "@/lib/bets";
import {
  saveOutcome,
  computeAutoOutcomes,
  scoreMatchBets,
  scoreTournamentKaos,
  overrideMatch,
  grantKnockoutPowerups,
  resetMatchScoring,
  resetTournamentKaos,
} from "./actions";
import type { AdminMatch, AdminOutcome } from "./page";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  outcomes: AdminOutcome[];
  pendingCounts: {
    match: number;
    turnering: number;
    kaos: number;
    turneringKaos: number;
  };
  matches: AdminMatch[];
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function SourceBadge({ source }: { source: string | null }) {
  if (!source || source === "")
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-500/40 bg-slate-500/10 text-slate-400">
        Ej satt
      </span>
    );
  if (source === "admin")
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full border border-gold/40 bg-gold/10 text-gold font-semibold">
        admin
      </span>
    );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-400/40 bg-blue-500/10 text-blue-300 font-semibold">
      api
    </span>
  );
}

function LogOutput({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <pre className="mt-3 text-[11px] rounded-lg bg-black/60 border border-pitch-light/20 p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">
      {lines.map((line, i) => {
        const isError = line.startsWith("[ERROR]");
        const isOk = line.startsWith("[OK]");
        const isWarn = line.startsWith("[WARN]") || line.startsWith("[SKIP]");
        return (
          <span
            key={i}
            className={
              isError
                ? "text-red-400"
                : isOk
                  ? "text-green-400"
                  : isWarn
                    ? "text-amber-400"
                    : "text-slate-300"
            }
          >
            {line}
            {"\n"}
          </span>
        );
      })}
    </pre>
  );
}

function TeamSelect({
  value,
  onChange,
  placeholder = "Välj lag...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = WC_TEAMS.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 12);

  return (
    <div className="relative">
      <div
        className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2 text-sm cursor-pointer flex justify-between items-center hover:border-gold/40"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "text-white" : "text-green-700"}>
          {value || placeholder}
        </span>
        <span className="text-green-600 text-xs">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-pitch-dark border border-pitch-light/50 rounded-lg shadow-xl overflow-hidden">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök lag..."
            className="w-full bg-pitch-dark px-3 py-2 text-sm text-white placeholder-green-700 border-b border-pitch-light/30 outline-none"
          />
          <div className="max-h-40 overflow-y-auto">
            {filtered.map((t) => (
              <button
                key={t}
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-pitch-light/30 transition-colors"
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                  setSearch("");
                }}
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

function PlayerSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = FAMOUS_PLAYERS.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 12);

  return (
    <div className="relative">
      <div
        className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2 text-sm cursor-pointer flex justify-between items-center hover:border-gold/40"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "text-white" : "text-green-700"}>
          {value || "Välj spelare..."}
        </span>
        <span className="text-green-600 text-xs">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-pitch-dark border border-pitch-light/50 rounded-lg shadow-xl overflow-hidden">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök spelare..."
            className="w-full bg-pitch-dark px-3 py-2 text-sm text-white placeholder-green-700 border-b border-pitch-light/30 outline-none"
          />
          <div className="max-h-40 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p}
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-pitch-light/30 transition-colors"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {p}
              </button>
            ))}
            {/* Allow free-text entry if not in list */}
            {search && !filtered.includes(search) && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gold hover:bg-pitch-light/30 transition-colors"
                onClick={() => {
                  onChange(search);
                  setOpen(false);
                  setSearch("");
                }}
              >
                + Använd &quot;{search}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TurneringOutcomeCard
// ---------------------------------------------------------------------------

function TurneringOutcomeCard({
  betDef,
  existing,
  onAutoCompute,
}: {
  betDef: (typeof TURNERING_BETS)[0];
  existing: AdminOutcome | undefined;
  onAutoCompute: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const autoComputable = [
    "vm_winner",
    "finalists",
    "total_goals",
    "most_red_cards",
  ].includes(betDef.id);

  // Form values
  const [teamVal, setTeamVal] = useState(
    (existing?.value_json?.team as string) ?? "",
  );
  const [team1Val, setTeam1Val] = useState(
    (existing?.value_json?.team1 as string) ?? "",
  );
  const [team2Val, setTeam2Val] = useState(
    (existing?.value_json?.team2 as string) ?? "",
  );
  const [playerVal, setPlayerVal] = useState(
    (existing?.value_json?.player as string) ?? "",
  );
  const [goalsVal, setGoalsVal] = useState(
    String(existing?.value_json?.goals ?? ""),
  );
  const [groupVal, setGroupVal] = useState(
    (existing?.value_json?.group as string) ?? "",
  );

  function buildValueJson(): Record<string, unknown> {
    switch (betDef.inputType) {
      case "team":
        return { team: teamVal };
      case "two-teams":
        return { team1: team1Val, team2: team2Val };
      case "player":
        return { player: playerVal };
      case "number":
        return { goals: parseInt(goalsVal) || 0 };
      case "group":
        return { group: groupVal };
      default:
        return {};
    }
  }

  function displayCurrent() {
    if (!existing?.value_json) return "—";
    const v = existing.value_json;
    if (v.team) return v.team as string;
    if (v.team1 && v.team2) return `${v.team1} vs ${v.team2}`;
    if (v.player) return v.player as string;
    if (v.goals !== undefined) return `${v.goals} mål`;
    if (v.group) return `Grupp ${v.group}`;
    return JSON.stringify(v);
  }

  function handleSave() {
    setErr(null);
    setSaved(null);
    startTransition(async () => {
      const result = await saveOutcome(betDef.id, buildValueJson(), notes);
      if (result.ok) setSaved("Sparat!");
      else setErr(result.error ?? "Okänt fel");
    });
  }

  return (
    <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-sm">{betDef.label}</h3>
            <SourceBadge source={existing?.source ?? null} />
          </div>
          <p className="text-green-700 text-xs mt-0.5">{betDef.description}</p>
          {existing?.value_json && (
            <p className="text-green-400 text-xs mt-1">
              Nuvarande:{" "}
              <span className="text-white font-semibold">{displayCurrent()}</span>
            </p>
          )}
          {existing?.updated_by && (
            <p className="text-slate-500 text-[10px]">
              av {existing.updated_by}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
          {betDef.points}p
        </span>
      </div>

      {/* Input form */}
      <div className="space-y-2">
        {betDef.inputType === "team" && (
          <TeamSelect value={teamVal} onChange={setTeamVal} />
        )}
        {betDef.inputType === "two-teams" && (
          <div className="grid grid-cols-2 gap-2">
            <TeamSelect value={team1Val} onChange={setTeam1Val} placeholder="Lag 1..." />
            <TeamSelect value={team2Val} onChange={setTeam2Val} placeholder="Lag 2..." />
          </div>
        )}
        {betDef.inputType === "player" && (
          <PlayerSelect value={playerVal} onChange={setPlayerVal} />
        )}
        {betDef.inputType === "number" && (
          <input
            type="number"
            min={0}
            max={1000}
            value={goalsVal}
            onChange={(e) => setGoalsVal(e.target.value)}
            placeholder="Antal mål..."
            className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-3 py-2 text-sm text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        )}
        {betDef.inputType === "group" && (
          <div className="flex flex-wrap gap-2">
            {WC_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupVal(g)}
                className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${
                  groupVal === g
                    ? "bg-blue-500 text-white scale-110"
                    : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-blue-400/60"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anteckningar (källhänvisning, etc.)..."
          rows={2}
          className="w-full bg-pitch-dark border border-pitch-light/30 rounded-lg px-3 py-2 text-xs text-white placeholder-green-700 focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 bg-gold hover:bg-yellow-400 disabled:opacity-50 text-pitch-dark font-bebas text-base tracking-widest py-2 rounded-xl transition-all active:scale-95"
          >
            {isPending ? "SPARAR..." : "SPARA"}
          </button>
          {autoComputable && (
            <button
              type="button"
              onClick={onAutoCompute}
              disabled={isPending}
              className="px-3 py-2 rounded-xl bg-pitch-dark border border-blue-400/30 text-blue-300 text-xs hover:bg-pitch-light/20 transition shrink-0"
              title="Auto-beräkna från matchdata"
            >
              🔄 Auto
            </button>
          )}
        </div>

        {saved && <p className="text-green-400 text-xs">{saved}</p>}
        {err && <p className="text-red-400 text-xs">{err}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KaosOutcomeCard
// ---------------------------------------------------------------------------

const KAOS_VERIFIABILITY: Record<
  string,
  { type: "api" | "admin"; note?: string }
> = {
  goalkeeper_goal: {
    type: "admin",
    note: "football-data.org rapporterar inte målvaktsspecifika mål — verifiera manuellt via FIFA/Transfermarkt.",
  },
  coach_sent_off: {
    type: "admin",
    note: "football-data.org rapporterar inte tränardisciplin — verifiera manuellt via FIFA-rapport.",
  },
  comeback_win: {
    type: "admin",
    note: "API saknar comeback-data — verifiera manuellt: lag vänder 0–3 och vinner i förlängning/straffar.",
  },
  final_penalty_miss: {
    type: "admin",
    note: "API saknar straffmissdata — verifiera manuellt: finalen avgörs på straffar + minst 3 missade.",
  },
  sweden_final: {
    type: "api",
    note: "Auto-beräknas från matchdata.",
  },
  knockout_hattrick: {
    type: "admin",
    note: "API-data kan sakna hattrick-info för knockout — verifiera manuellt via FIFA/Transfermarkt.",
  },
};

function KaosOutcomeCard({
  betDef,
  existing,
}: {
  betDef: (typeof KAOS_BETS)[0];
  existing: AdminOutcome | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [answer, setAnswer] = useState<boolean | null>(
    existing?.value_json?.answer === true
      ? true
      : existing?.value_json?.answer === false
        ? false
        : null,
  );
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const verif = KAOS_VERIFIABILITY[betDef.id];

  function handleSave() {
    if (answer === null) { setErr("Välj Ja eller Nej först."); return; }
    setErr(null);
    setSaved(null);
    startTransition(async () => {
      const result = await saveOutcome(betDef.id, { answer }, notes);
      if (result.ok) setSaved("Sparat!");
      else setErr(result.error ?? "Okänt fel");
    });
  }

  return (
    <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-sm">{betDef.label}</h3>
            <SourceBadge source={existing?.source ?? null} />
            {verif?.type === "api" ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-500/40 bg-green-500/10 text-green-400">
                API-automatisk
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400">
                Admin-only
              </span>
            )}
          </div>
          <p className="text-rose-300/70 text-xs mt-0.5">{betDef.description}</p>
          {verif?.note && (
            <p className="text-amber-400/70 text-[10px] mt-1 italic">
              {verif.note}
            </p>
          )}
          {existing?.value_json?.answer !== undefined && (
            <p className="text-green-400 text-xs mt-1">
              Nuvarande:{" "}
              <span className="text-white font-semibold">
                {existing.value_json.answer ? "JA" : "NEJ"}
              </span>
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
          10 000p
        </span>
      </div>

      <div className="flex gap-2">
        {(["yes", "no"] as const).map((opt) => {
          const isYes = opt === "yes";
          const selected = answer === isYes;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setAnswer(isYes)}
              className={`flex-1 py-2.5 rounded-xl font-bebas text-lg tracking-widest transition-all active:scale-95 ${
                selected
                  ? isYes
                    ? "bg-green-600 text-white scale-105 shadow-lg shadow-green-900/50"
                    : "bg-red-600 text-white scale-105 shadow-lg shadow-red-900/50"
                  : "bg-pitch-dark border border-pitch-light/40 text-green-400 hover:border-rose-400/50"
              }`}
            >
              {isYes ? "JA" : "NEJ"}
            </button>
          );
        })}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anteckningar (källhänvisning, etc.)..."
        rows={2}
        className="w-full bg-pitch-dark border border-pitch-light/30 rounded-lg px-3 py-2 text-xs text-white placeholder-green-700 focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
      />

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bebas text-base tracking-widest py-2 rounded-xl transition-all active:scale-95"
      >
        {isPending ? "SPARAR..." : "SPARA UTFALL"}
      </button>

      {saved && <p className="text-green-400 text-xs">{saved}</p>}
      {err && <p className="text-red-400 text-xs">{err}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MatchOverrideRow
// ---------------------------------------------------------------------------

function MatchOverrideRow({ match }: { match: AdminMatch }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [resetPending, startResetTransition] = useTransition();
  const [homeScore, setHomeScore] = useState(String(match.home_score ?? ""));
  const [awayScore, setAwayScore] = useState(String(match.away_score ?? ""));
  const [firstScorer, setFirstScorer] = useState(match.first_scorer ?? "");
  const [redCards, setRedCards] = useState(String(match.red_card_count ?? ""));
  const [yellowCards, setYellowCards] = useState(String(match.yellow_card_count ?? ""));
  const [status, setStatus] = useState(match.status);
  const [adminLocked, setAdminLocked] = useState(match.admin_locked ?? false);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [resetLog, setResetLog] = useState<string[]>([]);

  const kickoff = new Date(match.kickoff_at).toLocaleDateString("sv-SE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });

  function handleSave() {
    setErr(null);
    setSaved(null);
    const data: Parameters<typeof overrideMatch>[1] = {};
    if (homeScore !== "") data.home_score = parseInt(homeScore);
    if (awayScore !== "") data.away_score = parseInt(awayScore);
    if (firstScorer !== "") data.first_scorer = firstScorer;
    if (redCards !== "") data.red_card_count = parseInt(redCards);
    if (yellowCards !== "") data.yellow_card_count = parseInt(yellowCards);
    data.status = status;
    data.admin_locked = adminLocked;

    startTransition(async () => {
      const result = await overrideMatch(match.id, data);
      if (result.ok) setSaved("Sparat!");
      else setErr(result.error ?? "Okänt fel");
    });
  }

  return (
    <div className="border border-pitch-light/20 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-pitch-light/10 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-semibold truncate">
              {match.home_team} vs {match.away_team}
            </span>
            {match.admin_locked && (
              <span className="text-amber-400 text-xs">🔒</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-green-700 flex-wrap">
            <span>{kickoff}</span>
            <span>{match.stage}</span>
            <span
              className={
                match.status === "finished"
                  ? "text-green-400"
                  : match.status === "live"
                    ? "text-amber-400"
                    : "text-slate-400"
              }
            >
              {match.status}
            </span>
          </div>
        </div>
        {match.home_score !== null && match.away_score !== null && (
          <span className="font-bebas text-gold text-lg shrink-0">
            {match.home_score}–{match.away_score}
          </span>
        )}
        <span className="text-green-600 text-xs shrink-0">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div className="px-4 py-3 bg-pitch-dark/50 space-y-3 border-t border-pitch-light/10">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-green-700 text-[10px] block mb-1">
                Hemmalag mål
              </label>
              <input
                type="number"
                min={0}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-full bg-pitch-dark border border-pitch-light/40 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>
            <div>
              <label className="text-green-700 text-[10px] block mb-1">
                Bortalag mål
              </label>
              <input
                type="number"
                min={0}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-full bg-pitch-dark border border-pitch-light/40 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>
            <div>
              <label className="text-green-700 text-[10px] block mb-1">
                Röda kort (totalt)
              </label>
              <input
                type="number"
                min={0}
                value={redCards}
                onChange={(e) => setRedCards(e.target.value)}
                className="w-full bg-pitch-dark border border-pitch-light/40 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>
            <div>
              <label className="text-green-700 text-[10px] block mb-1">
                Gula kort (totalt)
              </label>
              <input
                type="number"
                min={0}
                value={yellowCards}
                onChange={(e) => setYellowCards(e.target.value)}
                className="w-full bg-pitch-dark border border-pitch-light/40 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>
          </div>

          <div>
            <label className="text-green-700 text-[10px] block mb-1">
              Första målskytt
            </label>
            <input
              type="text"
              value={firstScorer}
              onChange={(e) => setFirstScorer(e.target.value)}
              placeholder="Spelarnamn eller lämna tomt..."
              className="w-full bg-pitch-dark border border-pitch-light/40 rounded-lg px-2 py-1.5 text-sm text-white placeholder-green-700 focus:outline-none focus:ring-1 focus:ring-gold/30"
            />
          </div>

          <div>
            <label className="text-green-700 text-[10px] block mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-pitch-dark border border-pitch-light/40 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold/30"
            >
              <option value="scheduled">scheduled</option>
              <option value="live">live</option>
              <option value="finished">finished</option>
              <option value="postponed">postponed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`lock-${match.id}`}
              checked={adminLocked}
              onChange={(e) => setAdminLocked(e.target.checked)}
              className="rounded"
            />
            <label
              htmlFor={`lock-${match.id}`}
              className="text-amber-400 text-sm cursor-pointer"
            >
              Admin-låst (spel blockeras)
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full bg-gold hover:bg-yellow-400 disabled:opacity-50 text-pitch-dark font-bebas text-base tracking-widest py-2 rounded-xl transition-all active:scale-95"
          >
            {isPending ? "SPARAR..." : "SPARA OVERRIDE"}
          </button>

          {saved && <p className="text-green-400 text-xs">{saved}</p>}
          {err && <p className="text-red-400 text-xs">{err}</p>}

          <div className="border-t border-pitch-light/10 pt-3">
            <p className="text-amber-400/70 text-[10px] mb-2">
              Om spel redan är poängsatta med fel resultat — nollställ dem här, kör sedan &quot;Matchspel&quot; ovan.
            </p>
            <button
              onClick={() => {
                if (!confirm(`Nollställ alla poängsatta spel för ${match.home_team} vs ${match.away_team}? De kan sedan poängsättas om.`)) return;
                startResetTransition(async () => {
                  const r = await resetMatchScoring(match.id);
                  setResetLog(r.log);
                });
              }}
              disabled={resetPending}
              className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-bebas text-sm tracking-widest py-2 rounded-xl transition-all active:scale-95"
            >
              {resetPending ? "NOLLSTÄLLER..." : "NOLLSTÄLL SPEL FÖR DENNA MATCH"}
            </button>
            <LogOutput lines={resetLog} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AdminClient
// ---------------------------------------------------------------------------

export default function AdminClient({
  outcomes,
  pendingCounts,
  matches,
}: Props) {
  const [matchLog, setMatchLog] = useState<string[]>([]);
  const [tourLog, setTourLog] = useState<string[]>([]);
  const [resetTourLog, setResetTourLog] = useState<string[]>([]);
  const [autoLog, setAutoLog] = useState<string[]>([]);
  const [knockoutLog, setKnockoutLog] = useState<string[]>([]);
  const [matchPending, startMatchTransition] = useTransition();
  const [tourPending, startTourTransition] = useTransition();
  const [resetTourPending, startResetTourTransition] = useTransition();
  const [autoPending, startAutoTransition] = useTransition();
  const [knockoutPending, startKnockoutTransition] = useTransition();
  const [matchesOpen, setMatchesOpen] = useState(false);

  const outcomeMap = new Map<string, AdminOutcome>();
  for (const o of outcomes) outcomeMap.set(o.bet_type, o);

  function handleAutoCompute() {
    startAutoTransition(async () => {
      const result = await computeAutoOutcomes();
      const lines: string[] = [];
      if (result.computed.length > 0)
        lines.push(`[OK] Beräknade: ${result.computed.join(", ")}`);
      for (const e of result.errors) lines.push(`[ERROR] ${e}`);
      if (lines.length === 0) lines.push("[INFO] Inget att beräkna än.");
      setAutoLog(lines);
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-bebas text-4xl text-gold tracking-widest">
          ADMIN PANEL
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full border border-pitch-light/30 bg-pitch/40 text-slate-300">
            Match: <span className="text-amber-400 font-bold">{pendingCounts.match}</span> väntande
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full border border-pitch-light/30 bg-pitch/40 text-slate-300">
            Turnering: <span className="text-amber-400 font-bold">{pendingCounts.turnering}</span> väntande
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full border border-pitch-light/30 bg-pitch/40 text-slate-300">
            Kaos: <span className="text-amber-400 font-bold">{pendingCounts.kaos}</span> väntande
          </span>
        </div>
      </div>

      {/* ── Quick Score Actions ── */}
      <section className="space-y-3">
        <h2 className="font-bebas text-2xl text-gold tracking-widest">
          SNABBPOÄNGSÄTTNING
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-3">
            <button
              onClick={() =>
                startMatchTransition(async () => {
                  const r = await scoreMatchBets();
                  setMatchLog(r.log);
                })
              }
              disabled={matchPending}
              className="w-full bg-pitch-light hover:bg-pitch-light/80 disabled:opacity-50 text-white font-bebas text-lg tracking-widest py-3 rounded-xl transition-all active:scale-95"
            >
              {matchPending
                ? "BERÄKNAR..."
                : `MATCHSPEL (${pendingCounts.match} väntande)`}
            </button>
            <p className="text-green-700 text-xs">
              Poängsätter alla outvärderande matchspel för avslutade matcher.
            </p>
            <LogOutput lines={matchLog} />
          </div>

          <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 space-y-3">
            <button
              onClick={() =>
                startTourTransition(async () => {
                  const r = await scoreTournamentKaos();
                  setTourLog(r.log);
                })
              }
              disabled={tourPending}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bebas text-lg tracking-widest py-3 rounded-xl transition-all active:scale-95"
            >
              {tourPending
                ? "BERÄKNAR..."
                : `TURNERING + KAOS (${pendingCounts.turneringKaos} väntande)`}
            </button>
            <p className="text-green-700 text-xs">
              Kräver att alla 12 outcomes är satta nedan. Poängsätter turnering + kaosgissningar.
            </p>
            <LogOutput lines={tourLog} />

            <div className="border-t border-pitch-light/10 pt-3">
              <p className="text-amber-400/70 text-[10px] mb-2">
                Om ett outcome ändrades efter att spel redan poängsatts — nollställ och kör ovan igen.
              </p>
              <button
                onClick={() => {
                  if (!confirm("Nollställ ALLA poängsatta turnering- och kaosspel? De kan sedan poängsättas om med uppdaterade outcomes.")) return;
                  startResetTourTransition(async () => {
                    const r = await resetTournamentKaos();
                    setResetTourLog(r.log);
                  });
                }}
                disabled={resetTourPending}
                className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-bebas text-sm tracking-widest py-2 rounded-xl transition-all active:scale-95"
              >
                {resetTourPending ? "NOLLSTÄLLER..." : "NOLLSTÄLL ALLA TURNERING/KAOS-SPEL"}
              </button>
              <LogOutput lines={resetTourLog} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Tournament Outcomes ── */}
      <section className="space-y-3">
        <h2 className="font-bebas text-2xl text-gold tracking-widest">
          TURNERINGSGISSNINGAR — UTFALL
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TURNERING_BETS.map((bet) => (
            <TurneringOutcomeCard
              key={bet.id}
              betDef={bet}
              existing={outcomeMap.get(bet.id)}
              onAutoCompute={handleAutoCompute}
            />
          ))}
        </div>
      </section>

      {/* ── Kaos Outcomes ── */}
      <section className="space-y-3">
        <h2 className="font-bebas text-2xl text-gold tracking-widest">
          KAOSGISSNINGAR — UTFALL
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {KAOS_BETS.map((bet) => (
            <KaosOutcomeCard
              key={bet.id}
              betDef={bet}
              existing={outcomeMap.get(bet.id)}
            />
          ))}
        </div>
      </section>

      {/* ── Auto-compute ── */}
      <section className="space-y-3">
        <button
          onClick={handleAutoCompute}
          disabled={autoPending}
          className="w-full bg-pitch-dark border border-blue-400/30 hover:border-blue-400/60 disabled:opacity-50 text-blue-300 font-bebas text-lg tracking-widest py-3 rounded-xl transition-all active:scale-95"
        >
          {autoPending
            ? "BERÄKNAR..."
            : "AUTO-BERÄKNA FRÅN MATCHER (vm_winner, finalists, total_goals, most_red_cards, sweden_final)"}
        </button>
        <LogOutput lines={autoLog} />
      </section>

      {/* ── Party Powers ── */}
      <section className="space-y-3">
        <h2 className="font-bebas text-2xl text-rose-400 tracking-widest">
          PARTY POWERS — KNOCKOUT-BOOST
        </h2>
        <div className="rounded-xl border border-rose-500/30 bg-rose-900/10 p-4 space-y-3">
          <p className="text-rose-300/70 text-xs">
            Alla spelare startar med <strong className="text-white">10 sabotage + 10 punto_bandito</strong> för gruppspelet.
            Klicka nedan när knockout-fasen börjar för att ge alla <strong className="text-white">+5 av varje</strong>.
          </p>
          <button
            onClick={() =>
              startKnockoutTransition(async () => {
                const r = await grantKnockoutPowerups();
                setKnockoutLog(r.log);
              })
            }
            disabled={knockoutPending}
            className="w-full bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bebas text-lg tracking-widest py-3 rounded-xl transition-all active:scale-95"
          >
            {knockoutPending ? "BEVILJAR..." : "🔥 BEVILJA KNOCKOUT-POWERS (+5 TILL ALLA)"}
          </button>
          <LogOutput lines={knockoutLog} />
        </div>
      </section>

      {/* ── Match Override ── */}
      <section className="space-y-3">
        <button
          onClick={() => setMatchesOpen(!matchesOpen)}
          className="w-full flex items-center justify-between rounded-xl border border-pitch-light/30 bg-pitch/40 px-4 py-3 hover:bg-pitch-light/10 transition-colors"
        >
          <h2 className="font-bebas text-2xl text-gold tracking-widest">
            MATCHÖVERSTYRING ({matches.length} matcher)
          </h2>
          <span className="text-green-600">{matchesOpen ? "▲" : "▼"}</span>
        </button>

        {matchesOpen && (
          <div className="space-y-2">
            {matches.map((m) => (
              <MatchOverrideRow key={m.id} match={m} />
            ))}
            {matches.length === 0 && (
              <p className="text-green-700 text-sm text-center py-4">
                Inga matcher hittades.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
