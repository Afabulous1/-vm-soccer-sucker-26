"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PowerupType } from "@/types/database";

// ---------------------------------------------------------------------------
// Power-up display metadata
// ---------------------------------------------------------------------------

interface PowerUpInfo {
  type: PowerupType;
  emoji: string;
  name: string;
  description: string;
  isShield: boolean;
}

const POWER_UP_INFO: PowerUpInfo[] = [
  // Track A — Fan powers
  {
    type: "double_or_nothing",
    emoji: "⚡",
    name: "Dubbel eller ingenting",
    description: "2× om rätt, 0 om fel",
    isShield: false,
  },
  {
    type: "taktikgeniet",
    emoji: "🧠",
    name: "Taktikgeniet",
    description: "50% poäng om rätt sida men fel resultat",
    isShield: false,
  },
  {
    type: "sexpoangaren",
    emoji: "✨",
    name: "Sexpoängaren",
    description: "+600p bonus utöver vanliga poäng",
    isShield: false,
  },
  {
    type: "tidsmaskinen",
    emoji: "⏪",
    name: "Tidsmaskinen",
    description: "Ändra denna gissning en gång efter avspark",
    isShield: false,
  },
  {
    type: "forsakringen",
    emoji: "🛡️",
    name: "Försäkringen",
    description: "Behåll 50% om du har fel",
    isShield: true,
  },
  // Track B — Party sabotage powers
  {
    type: "sabotage",
    emoji: "🧊",
    name: "Sabotage",
    description: "Nolla en rivales vunna matchgissning — deras poäng för den matchen försvinner",
    isShield: false,
  },
  {
    type: "punto_bandito",
    emoji: "🦊",
    name: "Punto Bandito",
    description: "Stjäl poängen från matchrundan ledare — en gång per säsong",
    isShield: false,
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  betType: string;
  matchStage?: string;
  currentPowerUp: PowerupType | null;
  currentShield: PowerupType | null;
  onSelect: (powerUp: PowerupType | null, shield: PowerupType | null) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PowerUpSelector({
  betType,
  matchStage,
  currentPowerUp,
  currentShield,
  onSelect,
  disabled = false,
}: Props) {
  void betType;
  const stageLabel = matchStage === "group_stage" ? "gruppspel" : matchStage ? "slutspel" : null;

  const [inventory, setInventory] = useState<Record<PowerupType, number>>(
    {} as Record<PowerupType, number>,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchInventory() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_powerups")
        .select("powerup_type, quantity")
        .eq("user_id", user.id);

      if (!cancelled && data) {
        const inv = {} as Record<PowerupType, number>;
        for (const row of data) {
          inv[row.powerup_type] = row.quantity;
        }
        setInventory(inv);
      }
      if (!cancelled) setLoading(false);
    }
    fetchInventory();
    return () => {
      cancelled = true;
    };
  }, []);

  function togglePowerUp(type: PowerupType, isShield: boolean) {
    if (disabled) return;
    if (isShield) {
      const next = currentShield === type ? null : type;
      onSelect(currentPowerUp, next);
    } else {
      const next = currentPowerUp === type ? null : type;
      onSelect(next, currentShield);
    }
  }

  const offensivePowerUps = POWER_UP_INFO.filter(
    (p) => !p.isShield && p.type !== "sabotage" && p.type !== "punto_bandito"
  );
  const sabotageUps = POWER_UP_INFO.filter(
    (p) => p.type === "sabotage" || p.type === "punto_bandito"
  );
  const shields = POWER_UP_INFO.filter((p) => p.isShield);

  const selectedInfo =
    POWER_UP_INFO.find((p) => p.type === currentPowerUp) ??
    POWER_UP_INFO.find((p) => p.type === currentShield) ??
    null;

  if (loading) {
    return (
      <div className="rounded-xl border border-pitch-light/20 bg-pitch/30 px-3 py-2 text-xs text-green-700 animate-pulse">
        Laddar power-ups...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-pitch-light/20 bg-pitch/30 p-3 space-y-2">
      {stageLabel && (
        <p className="text-[10px] text-green-600 font-semibold">
          ⚡ Krafter — 1× per {stageLabel} · 1× per slutspel
        </p>
      )}
      {/* Offensive power-ups row */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-green-600 mb-1.5 font-semibold">
          POWER-UP
        </p>
        <div className="flex flex-wrap gap-1.5">
          {offensivePowerUps.map((pu) => {
            const qty = inventory[pu.type] ?? 0;
            const isSelected = currentPowerUp === pu.type;
            return (
              <button
                key={pu.type}
                type="button"
                disabled={disabled || (qty === 0 && !isSelected)}
                onClick={() => togglePowerUp(pu.type, false)}
                title={`${pu.name} — ${pu.description}${qty === 0 ? " (0 kvar)" : ` (${qty} kvar)`}`}
                className={[
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all",
                  isSelected
                    ? "bg-gold text-pitch-dark shadow shadow-gold/40 scale-105"
                    : qty === 0
                      ? "opacity-30 bg-pitch-dark border border-pitch-light/20 text-green-700 cursor-not-allowed"
                      : "bg-pitch-dark border border-pitch-light/40 text-green-300 hover:border-gold/40 hover:text-gold",
                  disabled ? "cursor-not-allowed" : "",
                ].join(" ")}
              >
                <span>{pu.emoji}</span>
                <span className="hidden sm:inline">{pu.name}</span>
                {qty > 0 && (
                  <span className="text-[10px] opacity-70">×{qty}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Track B sabotage row */}
      {sabotageUps.some((pu) => (inventory[pu.type] ?? 0) > 0) && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-rose-500 mb-1.5 font-semibold">
            🔥 PARTY SABOTAGE
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sabotageUps.map((pu) => {
              const qty = inventory[pu.type] ?? 0;
              const isSelected = currentPowerUp === pu.type;
              return (
                <button
                  key={pu.type}
                  type="button"
                  disabled={disabled || (qty === 0 && !isSelected)}
                  onClick={() => togglePowerUp(pu.type, false)}
                  title={`${pu.name} — ${pu.description}${qty === 0 ? " (0 kvar)" : ` (${qty} kvar)`}`}
                  className={[
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all",
                    isSelected
                      ? "bg-rose-500 text-white shadow shadow-rose-500/40 scale-105"
                      : qty === 0
                        ? "opacity-30 bg-pitch-dark border border-pitch-light/20 text-green-700 cursor-not-allowed"
                        : "bg-pitch-dark border border-rose-500/40 text-rose-300 hover:border-rose-400/70 hover:text-rose-200",
                    disabled ? "cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <span>{pu.emoji}</span>
                  <span className="hidden sm:inline">{pu.name}</span>
                  {qty > 0 && (
                    <span className="text-[10px] opacity-70">×{qty}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shield row */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-green-600 mb-1.5 font-semibold">
          SKÖLD
        </p>
        <div className="flex flex-wrap gap-1.5">
          {shields.map((pu) => {
            const qty = inventory[pu.type] ?? 0;
            const isSelected = currentShield === pu.type;
            return (
              <button
                key={pu.type}
                type="button"
                disabled={disabled || (qty === 0 && !isSelected)}
                onClick={() => togglePowerUp(pu.type, true)}
                title={`${pu.name} — ${pu.description}${qty === 0 ? " (0 kvar)" : ` (${qty} kvar)`}`}
                className={[
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all",
                  isSelected
                    ? "bg-blue-500 text-white shadow shadow-blue-500/40 scale-105"
                    : qty === 0
                      ? "opacity-30 bg-pitch-dark border border-pitch-light/20 text-green-700 cursor-not-allowed"
                      : "bg-pitch-dark border border-blue-500/30 text-blue-300 hover:border-blue-400/60 hover:text-blue-200",
                  disabled ? "cursor-not-allowed" : "",
                ].join(" ")}
              >
                <span>{pu.emoji}</span>
                <span>{pu.name}</span>
                {qty > 0 && (
                  <span className="text-[10px] opacity-70">×{qty}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected power-up description */}
      {selectedInfo && (
        <p className="text-[11px] text-amber-300 border-t border-pitch-light/20 pt-2">
          {selectedInfo.emoji} <strong>{selectedInfo.name}:</strong>{" "}
          {selectedInfo.description}
        </p>
      )}
    </div>
  );
}
