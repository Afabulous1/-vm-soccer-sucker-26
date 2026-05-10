import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAvatar } from "@/lib/avatars";
import BottomNav from "@/components/BottomNav";
import JokerClient from "./JokerClient";
import { getVictimWinningBets } from "./actions";

export default async function JokerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Check user has joker
  const { data: inv } = await supabase
    .from("user_powerups")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("powerup_type", "joker")
    .single();

  if (!inv || inv.quantity < 1) redirect("/dashboard");

  // Fetch all other profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_key, points_total")
    .neq("user_id", user.id)
    .order("points_total", { ascending: false });

  // Fetch winning bets for each user in parallel
  const users = await Promise.all(
    (profiles ?? []).map(async (p) => {
      const winningBets = await getVictimWinningBets(p.user_id);
      return { ...p, winningBets };
    })
  );

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("username, avatar_key")
    .eq("user_id", user.id)
    .single();

  const avatar = getAvatar(myProfile?.avatar_key ?? "");

  return (
    <div className="pitch-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 60px)" }}
      />

      {/* Nav */}
      <nav className="relative sticky top-0 z-40 bg-pitch-dark/95 backdrop-blur border-b border-pitch-light/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="font-bebas text-gold text-2xl tracking-widest hover:text-yellow-400 transition-colors">
            ⚽ VM 26
          </Link>
          <span className="text-green-800">/</span>
          <span className="font-bebas text-purple-400 text-xl tracking-widest">🃏 JOKER</span>
          <div className="ml-auto flex items-center justify-center w-8 h-8 rounded-xl text-lg bg-gradient-to-br shrink-0 ${avatar?.gradient ?? 'from-pitch to-pitch-light'}">
            {avatar?.emoji ?? "⚽"}
          </div>
        </div>
      </nav>

      <div className="relative max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* Hero */}
        <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-900/50 via-pitch/60 to-pitch-dark/80 p-6 text-center space-y-3 shadow-2xl shadow-purple-900/30">
          <div className="text-6xl">🃏</div>
          <h1 className="font-bebas text-4xl text-purple-300 tracking-widest leading-none">
            JOKER-KRAFTEN
          </h1>
          <p className="text-green-300 text-sm leading-relaxed max-w-xs mx-auto">
            Välj en spelare och stjäl poängen från ett av deras matchresultat.
            Du har <strong className="text-purple-300">{inv.quantity} Joker</strong> kvar.
          </p>
          <div className="flex justify-center gap-4 text-xs text-green-700">
            <span>⚠️ Kan inte ångras</span>
            <span>·</span>
            <span>🃏 Förbrukar din Joker</span>
          </div>
        </div>

        {/* Interactive selection */}
        <JokerClient users={users} />

      </div>

      <BottomNav />
    </div>
  );
}
