import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserBets } from "@/app/bets/actions";
import { TOURNAMENT_LOCK } from "@/lib/bets";
import { getNowServer } from "@/lib/now";
import CountdownTimer from "@/components/CountdownTimer";
import KaosForm from "./KaosForm";

export default async function KaosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const existingBets = await getUserBets("kaos");
  const isLocked = (await getNowServer()) >= TOURNAMENT_LOCK;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bebas text-5xl text-rose-400 tracking-widest">KAOSGISSNINGAR 🔥</h1>
        <p className="text-rose-300/70 text-sm mt-1">
          6 vilda gissningar · dubbla poäng om du har rätt ·{" "}
          {isLocked ? (
            <span className="text-amber-400 font-semibold">🔒 Låst — turneringen har börjat</span>
          ) : (
            <>Låser om <CountdownTimer locksAt={TOURNAMENT_LOCK} /></>
          )}
        </p>
      </div>

      <KaosForm existingBets={existingBets} isLocked={isLocked} />
    </div>
  );
}
