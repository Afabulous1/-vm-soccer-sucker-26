import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TOURNAMENT_LOCK, TURNERING_BETS, KAOS_BETS } from "@/lib/bets";
import CountdownTimer from "@/components/CountdownTimer";

export default async function BetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: betCounts } = user
    ? await supabase.from("bets").select("bet_category").eq("user_id", user.id)
    : { data: [] };

  const counts = {
    turnering: betCounts?.filter((b) => b.bet_category === "turnering").length ?? 0,
    match:     betCounts?.filter((b) => b.bet_category === "match").length ?? 0,
    kaos:      betCounts?.filter((b) => b.bet_category === "kaos").length ?? 0,
  };

  return (
    <div className="space-y-8">

      <div>
        <h1 className="font-bebas text-5xl text-gold tracking-widest">DINA GISSNINGAR</h1>
        <p className="text-green-400 text-sm mt-1">
          Turneringen startar{" "}
          <span className="text-white font-semibold">11 juni 2026</span> —{" "}
          <CountdownTimer locksAt={TOURNAMENT_LOCK} />
        </p>
      </div>

      {/* ── Camp explainer ───────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Camp 1: Soccer Fan */}
        <div className="rounded-2xl border-2 border-violet-500/40 bg-gradient-to-br from-violet-900/30 to-blue-900/20 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⚽</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Laget du vill vara med i</p>
              <h2 className="font-bebas text-2xl text-white tracking-widest leading-none">FOTBOLLSFANSEN</h2>
            </div>
          </div>
          <p className="text-violet-200/70 text-sm leading-relaxed">
            Du kollar matcher, känner till lagen och vill visa att du vet vem som vinner.
            Gissa matchresultat och turneringsutfall — ju mer du kan, desto mer poäng.
          </p>
          <div className="space-y-2">
            <Link
              href="/bets/turnering"
              className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-900/20 px-4 py-3 hover:border-blue-400/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-white font-bold text-sm">Turneringsgissningar</p>
                  <p className="text-blue-300/60 text-xs">VM-vinnare, finalister, skyttekung…</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-blue-300 text-xs font-bold">{counts.turnering}/{TURNERING_BETS.length}</p>
                <span className="text-blue-500 group-hover:text-blue-300 transition-colors text-lg">→</span>
              </div>
            </Link>
            <Link
              href="/bets/match"
              className="flex items-center justify-between rounded-xl border border-violet-500/30 bg-violet-900/20 px-4 py-3 hover:border-violet-400/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚽</span>
                <div>
                  <p className="text-white font-bold text-sm">Matchgissningar</p>
                  <p className="text-violet-300/60 text-xs">1-X-2 och totalt antal mål per match</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-violet-300 text-xs font-bold">{counts.match} spel</p>
                <span className="text-violet-500 group-hover:text-violet-300 transition-colors text-lg">→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Camp 2: Party Player */}
        <div className="rounded-2xl border-2 border-rose-500/40 bg-gradient-to-br from-rose-900/30 to-orange-900/20 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔥</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">För dig som bara vill ha kul</p>
              <h2 className="font-bebas text-2xl text-white tracking-widest leading-none">PARTY-SPELAREN</h2>
            </div>
          </div>
          <p className="text-rose-200/70 text-sm leading-relaxed">
            Du behöver inte kunna ett skit om fotboll för att vinna här.
            Gissa på galna scenarion — JA eller NEJ — och skratta dig till 10 000 poäng.
            Sabotage dina kompisar med Party-krafter under turneringen.
          </p>
          <div className="space-y-2">
            <Link
              href="/bets/kaos"
              className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-900/20 px-4 py-3 hover:border-rose-400/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎲</span>
                <div>
                  <p className="text-white font-bold text-sm">Party Predictions</p>
                  <p className="text-rose-300/60 text-xs">6 galna scenarion · 10 000p om rätt</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-rose-300 text-xs font-bold">{counts.kaos}/{KAOS_BETS.length}</p>
                <span className="text-rose-500 group-hover:text-rose-300 transition-colors text-lg">→</span>
              </div>
            </Link>
            <div className="rounded-xl border border-rose-500/20 bg-rose-900/10 px-4 py-3">
              <p className="text-rose-300/50 text-xs">
                🧊 <strong className="text-rose-300">Sabotage</strong> — frys en rivals vinnande gissning{" "}
                <span className="text-rose-500">· Aktiveras under turneringen</span>
              </p>
              <p className="text-rose-300/50 text-xs mt-1">
                🦊 <strong className="text-rose-300">Punto Bandito</strong> — stjäl poäng från rundens ledare{" "}
                <span className="text-rose-500">· Aktiveras under turneringen</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick tips ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-pitch-light/30 bg-pitch/40 p-4 text-xs text-green-500 space-y-1.5">
        <p className="font-semibold text-green-400">Hur fungerar det?</p>
        <p>🔒 Turneringsgissningar och Party Predictions låser när VM startar 11 juni kl 19:00.</p>
        <p>⚽ Matchgissningar låser 15 min innan varje match — alla matcher finns tillgängliga att gissa på från start.</p>
        <p>⚡ Power-ups och sköldar används när du lägger en matchgissning.</p>
        <p>🔥 Du kan tillhöra båda lagen — gissa på allt för maxpoäng!</p>
      </div>
    </div>
  );
}
