"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { executeSabotage, executePuntoBandito } from "./party-actions";
import type { MatchPlayer, PartyAction, PartyInventory } from "./party-actions";

const AVATAR_EMOJI: Record<string, string> = {
  lion: "🦁", fox: "🦊", shark: "🦈", eagle: "🦅",
  wolf: "🐺", tiger: "🐯", dragon: "🐉", bear: "🐻",
};
function getAvatar(key: string): string {
  return AVATAR_EMOJI[key] ?? "👤";
}

const PICK_LABEL: Record<string, string> = { home: "1", draw: "X", away: "2" };

interface Props {
  matchId: string;
  isLocked: boolean;
  matchStatus: string;
  players: MatchPlayer[];
  myActions: PartyAction[];
  inventory: PartyInventory;
  incomingSabotages: number;
}

export default function PartyMatchSection({
  matchId,
  isLocked,
  matchStatus,
  players,
  myActions,
  inventory,
  incomingSabotages,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [localActions, setLocalActions] = useState<PartyAction[]>(myActions);
  const [localInventory, setLocalInventory] = useState<PartyInventory>(inventory);

  const isFinished = matchStatus === "finished";
  const mySabotage = localActions.find((a) => a.actionType === "sabotage");
  const myPuntoBandito = localActions.find((a) => a.actionType === "punto_bandito");

  function showFeedback(msg: string, ok: boolean) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleSabotage(targetUserId: string, targetUsername: string) {
    startTransition(async () => {
      const res = await executeSabotage(matchId, targetUserId);
      if (!res.ok) { showFeedback(res.error ?? "Fel", false); return; }
      setLocalActions((prev) => [
        ...prev,
        { id: crypto.randomUUID(), actionType: "sabotage", targetId: targetUserId, targetUsername, resolved: false },
      ]);
      setLocalInventory((prev) => ({ ...prev, sabotage: Math.max(0, prev.sabotage - 1) }));
      showFeedback(`🧊 ${targetUsername} saboterad! Deras rätta gissning nollas.`, true);
      router.refresh();
    });
  }

  function handlePuntoBandito() {
    startTransition(async () => {
      const res = await executePuntoBandito(matchId);
      if (!res.ok) { showFeedback(res.error ?? "Fel", false); return; }
      setLocalActions((prev) => [
        ...prev,
        { id: crypto.randomUUID(), actionType: "punto_bandito", targetId: null, targetUsername: null, resolved: false },
      ]);
      setLocalInventory((prev) => ({ ...prev, puntoBandito: Math.max(0, prev.puntoBandito - 1) }));
      showFeedback("🦊 Punto Bandito aktiverat! Du stjäl 200p från ledaren när matchen bedöms.", true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border-2 border-rose-500/40 bg-gradient-to-br from-rose-900/20 to-orange-900/10 p-5 space-y-4 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-900/40 border border-rose-500/30 px-2.5 py-1 rounded-full">
            🔥 Party Track
          </span>
          <span className="text-rose-300/50 text-xs">— sabotera dina kompisar</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] px-2 py-1 rounded-full bg-rose-900/40 border border-rose-500/30 text-rose-300">
            🧊 ×{localInventory.sabotage}
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-orange-900/40 border border-orange-500/30 text-orange-300">
            🦊 ×{localInventory.puntoBandito}
          </span>
        </div>
      </div>

      {/* Incoming warning */}
      {incomingSabotages > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-900/20 px-3 py-2">
          <span className="text-xl">⚠️</span>
          <p className="text-amber-300 text-xs font-bold">
            Någon har saboterat DIG på den här matchen! En korrekt gissning ger inga poäng.
          </p>
        </div>
      )}

      {/* My active actions */}
      {(mySabotage || myPuntoBandito) && (
        <div className="space-y-1.5">
          {mySabotage && (
            <div className="flex items-center gap-2 text-xs rounded-lg bg-rose-900/30 border border-rose-500/20 px-3 py-2">
              <span>🧊</span>
              <span className="text-rose-300">
                Sabotage aktiverat mot <strong>{mySabotage.targetUsername ?? "?"}</strong>
                {mySabotage.resolved ? " (löst)" : " (aktiv)"}
              </span>
            </div>
          )}
          {myPuntoBandito && (
            <div className="flex items-center gap-2 text-xs rounded-lg bg-orange-900/30 border border-orange-500/20 px-3 py-2">
              <span>🦊</span>
              <span className="text-orange-300">
                Punto Bandito aktiverat
                {myPuntoBandito.resolved
                  ? ` — ${myPuntoBandito.resolved ? "löst" : ""}`
                  : " — stjäl från ledaren vid bedömning"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Feedback toast */}
      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-sm font-bold text-center transition-all ${
          feedback.ok
            ? "bg-emerald-900/40 border border-emerald-500/40 text-emerald-300"
            : "bg-red-900/40 border border-red-500/40 text-red-300"
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Pre-lock: show player count only */}
      {!isLocked && !isFinished && (
        <div className="space-y-3">
          {players.length > 0 ? (
            <p className="text-rose-300/70 text-sm">
              <strong className="text-rose-300">{players.length}</strong> deltagare har redan gissat.
              Matchen låser 15 min före avspark — då ser du vad de gissade och kan slå till.
            </p>
          ) : (
            <p className="text-rose-300/40 text-sm italic">
              Inga andra deltagare har gissat på den här matchen än.
            </p>
          )}

          {/* Punto Bandito can be used at any time */}
          <div className="rounded-xl border border-orange-500/30 bg-pitch-dark/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl shrink-0">🦊</span>
                <div>
                  <p className="text-white font-bold text-sm">Punto Bandito</p>
                  <p className="text-orange-300/70 text-xs">Stjäl 200p från ligaledaren när matchen bedöms</p>
                </div>
              </div>
              {myPuntoBandito ? (
                <span className="text-[10px] px-2 py-1 rounded-full bg-orange-900/60 text-orange-300 shrink-0">Aktiverat</span>
              ) : (
                <button
                  onClick={handlePuntoBandito}
                  disabled={isPending || localInventory.puntoBandito < 1 || isFinished}
                  className="shrink-0 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 touch-manipulation"
                >
                  {localInventory.puntoBandito < 1 ? "0 kvar" : "Aktivera"}
                </button>
              )}
            </div>
          </div>

          <p className="text-rose-400/40 text-[11px] text-center italic">
            Kom tillbaka när matchen låser för att se vem du ska sabotera ↓
          </p>
        </div>
      )}

      {/* Post-lock: show player list with sabotage buttons */}
      {isLocked && !isFinished && (
        <div className="space-y-3">
          <p className="text-rose-300/60 text-xs">
            Matchen är låst — välj vem du ska sabotera
          </p>

          {players.length === 0 ? (
            <p className="text-rose-300/40 text-sm italic">Inga andra deltagare har gissat på den här matchen.</p>
          ) : (
            <div className="space-y-2">
              {players.map((p) => {
                const alreadySabotaged = mySabotage?.targetId === p.userId;
                return (
                  <div
                    key={p.userId}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                      alreadySabotaged
                        ? "border-rose-500/60 bg-rose-900/20"
                        : "border-pitch-light/20 bg-pitch-dark/40"
                    }`}
                  >
                    <span className="text-2xl shrink-0">{getAvatar(p.avatarKey)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{p.username}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        {p.hasMatchResultBet && p.matchResultPick && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-900/60 text-violet-300">
                            1X2: {PICK_LABEL[p.matchResultPick] ?? p.matchResultPick}
                          </span>
                        )}
                        {p.hasTotalGoalsBet && p.totalGoalsPick !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
                            Mål: {p.totalGoalsPick}
                          </span>
                        )}
                        {!p.hasMatchResultBet && !p.hasTotalGoalsBet && (
                          <span className="text-[10px] text-green-700">Inga Fan-gissningar</span>
                        )}
                      </div>
                    </div>
                    {alreadySabotaged ? (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-rose-900/60 text-rose-300 shrink-0">Saboterad 🧊</span>
                    ) : (
                      <button
                        onClick={() => handleSabotage(p.userId, p.username)}
                        disabled={isPending || !!mySabotage || localInventory.sabotage < 1 || isFinished}
                        className="shrink-0 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all active:scale-95 touch-manipulation"
                      >
                        {localInventory.sabotage < 1 ? "0 kvar" : "🧊 Sabotera"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Punto Bandito always available post-lock */}
          <div className="rounded-xl border border-orange-500/30 bg-pitch-dark/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl shrink-0">🦊</span>
                <div>
                  <p className="text-white font-bold text-sm">Punto Bandito</p>
                  <p className="text-orange-300/70 text-xs">Stjäl 200p från ligaledaren när matchen bedöms</p>
                </div>
              </div>
              {myPuntoBandito ? (
                <span className="text-[10px] px-2 py-1 rounded-full bg-orange-900/60 text-orange-300 shrink-0">Aktiverat ✓</span>
              ) : (
                <button
                  onClick={handlePuntoBandito}
                  disabled={isPending || localInventory.puntoBandito < 1}
                  className="shrink-0 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 touch-manipulation"
                >
                  {localInventory.puntoBandito < 1 ? "0 kvar" : "Aktivera"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Finished match */}
      {isFinished && (
        <div className="space-y-3">
          <p className="text-amber-400/60 text-xs text-center">
            🔒 Matchen avslutad — inga fler Party-drag
          </p>
          {players.length > 0 && (
            <div className="space-y-2">
              {players.map((p) => (
                <div key={p.userId} className="flex items-center gap-3 rounded-xl border border-pitch-light/10 bg-pitch-dark/40 px-3 py-2">
                  <span className="text-xl">{getAvatar(p.avatarKey)}</span>
                  <p className="text-green-400/60 text-xs flex-1 truncate">{p.username}</p>
                  <div className="flex gap-1.5">
                    {p.hasMatchResultBet && p.matchResultPick && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-900/40 text-violet-400">
                        {PICK_LABEL[p.matchResultPick] ?? p.matchResultPick}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {mySabotage && (
            <p className="text-rose-400/60 text-xs text-center">
              🧊 Du saboterade <strong>{mySabotage.targetUsername}</strong>
              {mySabotage.resolved ? " (löst vid bedömning)" : " (väntar på bedömning)"}
            </p>
          )}
          {myPuntoBandito && (
            <p className="text-orange-400/60 text-xs text-center">
              🦊 Punto Bandito aktiverat
              {myPuntoBandito.resolved ? " (löst vid bedömning)" : " (väntar på bedömning)"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
