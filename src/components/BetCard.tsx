import CountdownTimer from "./CountdownTimer";

type BetStatus = "open" | "locked" | "won" | "lost" | "pending";
type BetCategory = "turnering" | "match" | "kaos";

interface Props {
  betType: string;
  betCategory: BetCategory;
  betLabel: string;
  status: BetStatus;
  pointsWager: number;
  pointsAwarded?: number | null;
  locksAt?: Date | string | null;
  powerUpUsed?: string | null;
  shieldUsed?: string | null;
  onEdit?: () => void;
}

const CATEGORY_STYLES: Record<BetCategory, { border: string; badge: string; label: string }> = {
  turnering: { border: "border-turnering/40", badge: "bg-turnering/20 text-blue-300",  label: "Turneringsgissning" },
  match:     { border: "border-matchtips/40", badge: "bg-matchtips/20 text-violet-300", label: "Matchgissning" },
  kaos:      { border: "border-kaos/40",      badge: "bg-kaos/20      text-rose-300",   label: "Kaosgissning" },
};

const STATUS_STYLES: Record<BetStatus, { pill: string; label: string }> = {
  open:    { pill: "bg-green-500/20 text-green-300 border border-green-500/40",   label: "Öppen" },
  locked:  { pill: "bg-amber-500/20 text-amber-300 border border-amber-500/40",   label: "Låst" },
  won:     { pill: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40", label: "Rätt! 🎉" },
  lost:    { pill: "bg-red-500/20 text-red-400 border border-red-500/40",         label: "Fel 😢" },
  pending: { pill: "bg-slate-500/20 text-slate-400 border border-slate-500/40",   label: "Väntar..." },
};

const POWERUP_LABELS: Record<string, string> = {
  double_or_nothing: "⚡ Dubbel eller ingenting",
  taktikgeniet:      "🧠 Taktikgeniet",
  sexpoangaren:      "✨ Sexpoängaren",
  forsakringen:      "🛡️ Försäkringen",
  tidsmaskinen:      "⏪ Tidsmaskinen",
};

export default function BetCard({
  betType,
  betCategory,
  betLabel,
  status,
  pointsWager,
  pointsAwarded,
  locksAt,
  powerUpUsed,
  shieldUsed,
  onEdit,
}: Props) {
  const cat = CATEGORY_STYLES[betCategory];
  const st  = STATUS_STYLES[status];

  return (
    <div className={`rounded-xl border bg-pitch/60 backdrop-blur-sm p-4 space-y-3 ${cat.border}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>
            {cat.label}
          </span>
          <span className="text-green-500 text-xs">{betType}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${st.pill}`}>
          {st.label}
        </span>
      </div>

      {/* Bet value */}
      <p className="text-white font-semibold text-sm leading-snug">{betLabel}</p>

      {/* Power-up / shield badges */}
      {(powerUpUsed || shieldUsed) && (
        <div className="flex flex-wrap gap-1">
          {powerUpUsed && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30">
              {POWERUP_LABELS[powerUpUsed] ?? powerUpUsed}
            </span>
          )}
          {shieldUsed && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
              {POWERUP_LABELS[shieldUsed] ?? shieldUsed}
            </span>
          )}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {status === "won" && pointsAwarded != null ? (
            <span className="text-emerald-400 font-bold">+{pointsAwarded} p</span>
          ) : status === "lost" ? (
            <span className="text-red-400 font-semibold">−{pointsWager} p</span>
          ) : (
            <span className="text-green-600">{pointsWager} p insats</span>
          )}

          {status === "open" && locksAt && (
            <CountdownTimer locksAt={locksAt} />
          )}
        </div>

        {status === "open" && onEdit && (
          <button
            onClick={onEdit}
            className="text-green-400 hover:text-gold underline underline-offset-2 transition-colors"
          >
            Ändra
          </button>
        )}
      </div>
    </div>
  );
}
