import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserBets } from "@/app/bets/actions";
import { TOURNAMENT_LOCK } from "@/lib/bets";
import { getNowServer } from "@/lib/now";
import CountdownTimer from "@/components/CountdownTimer";
import TurneringForm from "./TurneringForm";

export default async function TurneringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const existingBets = await getUserBets("turnering");
  const isLocked = (await getNowServer()) >= TOURNAMENT_LOCK;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bebas text-5xl text-gold tracking-widest">TURNERINGSGISSNINGAR 🏆</h1>
        <p className="text-blue-300 text-sm mt-1">
          6 gissningar om hela turneringen ·{" "}
          {isLocked ? (
            <span className="text-amber-400 font-semibold">🔒 Låst — turneringen har börjat</span>
          ) : (
            <>Låser om <CountdownTimer locksAt={TOURNAMENT_LOCK} /></>
          )}
        </p>
      </div>

      <TurneringForm existingBets={existingBets} isLocked={isLocked} />
    </div>
  );
}
