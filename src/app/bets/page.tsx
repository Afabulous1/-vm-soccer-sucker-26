import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TOURNAMENT_LOCK, TURNERING_BETS, KAOS_BETS } from "@/lib/bets";
import CountdownTimer from "@/components/CountdownTimer";

export default async function BetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: betCounts } = user
    ? await supabase
        .from("bets")
        .select("bet_category")
        .eq("user_id", user.id)
    : { data: [] };

  const counts = {
    turnering: betCounts?.filter((b) => b.bet_category === "turnering").length ?? 0,
    match:     betCounts?.filter((b) => b.bet_category === "match").length ?? 0,
    kaos:      betCounts?.filter((b) => b.bet_category === "kaos").length ?? 0,
  };

  const categories = [
    {
      href: "/bets/turnering",
      emoji: "🏆",
      label: "Turneringsgissningar",
      description: "6 gissningar om hela turneringen — låser vid start",
      total: TURNERING_BETS.length,
      done: counts.turnering,
      gradient: "from-blue-900/60 to-blue-800/40",
      border: "border-blue-600/40",
      badge: "bg-blue-500/20 text-blue-300",
      lockAt: TOURNAMENT_LOCK,
    },
    {
      href: "/bets/match",
      emoji: "⚽",
      label: "Matchgissningar",
      description: "Gissa resultat, exakt poäng, målskytt och mer per match",
      total: null,
      done: counts.match,
      gradient: "from-violet-900/60 to-violet-800/40",
      border: "border-violet-600/40",
      badge: "bg-violet-500/20 text-violet-300",
      lockAt: null,
    },
    {
      href: "/bets/kaos",
      emoji: "🔥",
      label: "Kaosgissningar",
      description: "6 vilda gissningar — dubbla poäng om du har rätt!",
      total: KAOS_BETS.length,
      done: counts.kaos,
      gradient: "from-rose-900/60 to-rose-800/40",
      border: "border-rose-600/40",
      badge: "bg-rose-500/20 text-rose-300",
      lockAt: TOURNAMENT_LOCK,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bebas text-5xl text-gold tracking-widest">DINA GISSNINGAR</h1>
        <p className="text-green-400 text-sm mt-1">
          Turneringen startar{" "}
          <span className="text-white font-semibold">11 juni 2026</span> —{" "}
          <CountdownTimer locksAt={TOURNAMENT_LOCK} />
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={`block rounded-2xl border bg-gradient-to-br ${cat.gradient} ${cat.border} p-6 hover:scale-[1.02] transition-all duration-200 group`}
          >
            <div className="text-4xl mb-3">{cat.emoji}</div>
            <h2 className="font-bebas text-2xl text-white tracking-wide leading-tight mb-1">
              {cat.label}
            </h2>
            <p className="text-white/60 text-xs mb-4 leading-relaxed">{cat.description}</p>

            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cat.badge}`}>
                {cat.total ? `${cat.done}/${cat.total} gissningar` : `${cat.done} gissningar`}
              </span>
              <span className="text-white/40 group-hover:text-white/80 transition-colors text-lg">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick tips */}
      <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 text-xs text-green-500 space-y-1">
        <p>🔒 Turneringsgissningar och Kaosgissningar låser automatiskt när turneringen startar.</p>
        <p>⚽ Matchgissningar låser vid avspark för varje enskild match.</p>
        <p>⚡ Power-ups och sköldar kan användas när du lägger din gissning.</p>
      </div>
    </div>
  );
}
