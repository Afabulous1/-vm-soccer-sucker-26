import { redirect } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { BETTING_OPENS, TOURNAMENT_LOCK } from "@/lib/bets";
import { getNowServer } from "@/lib/now";
import BigCountdown from "@/components/BigCountdown";
import BottomNav from "@/components/BottomNav";

const LockBanner = dynamic(() => import("@/components/LockBanner"), { ssr: false });

export default async function BetsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const now          = await getNowServer();
  const bettingOpen  = now >= BETTING_OPENS;
  const isLocked     = now >= TOURNAMENT_LOCK;

  // ── Pre-betting gate ──────────────────────────────────────────────────────
  if (!bettingOpen) {
    return (
      <div className="pitch-bg min-h-screen flex flex-col items-center justify-center p-4 text-center">
        {/* Decorative pitch lines */}
        <div className="pointer-events-none fixed inset-0 opacity-[0.03]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 60px)" }}
        />

        <div className="relative max-w-md w-full space-y-8">
          <div>
            <p className="text-6xl mb-4">🔐</p>
            <h1 className="font-bebas text-5xl sm:text-6xl text-gold tracking-widest leading-none">
              GISSNINGARNA ÖPPNAR
            </h1>
            <p className="font-bebas text-3xl text-white tracking-widest mt-1">1 JUNI 2026</p>
            <p className="text-green-400 text-sm mt-3">
              Spara datumet — du har exakt 10 dagar på dig att lägga alla gissningar!
            </p>
          </div>

          <div className="rounded-3xl border border-gold/20 bg-pitch-dark/80 p-6 shadow-2xl">
            <p className="text-green-600 text-xs font-bold uppercase tracking-widest mb-4">Öppnar om</p>
            <BigCountdown target={BETTING_OPENS.toISOString()} />
          </div>

          <div className="rounded-xl border border-pitch-light/20 bg-pitch/40 p-4 text-xs text-green-500 space-y-1.5 text-left">
            <p>📅 <strong className="text-green-300">8 juni</strong> — Gissningsfönstret öppnar</p>
            <p>🏆 <strong className="text-green-300">11 juni 17:00 UTC</strong> — Turnering &amp; Kaos låser</p>
            <p>⚽ <strong className="text-green-300">Varje match</strong> — Matchgissningar låser vid avspark</p>
          </div>

          <Link
            href="/dashboard"
            className="inline-block text-green-500 text-sm hover:text-green-300 transition-colors"
          >
            ← Till dashboard
          </Link>
        </div>

        <BottomNav />
      </div>
    );
  }

  // ── Normal bets layout ────────────────────────────────────────────────────
  const navItems = [
    { href: "/bets",           label: "Översikt",            emoji: "📋" },
    { href: "/bets/turnering", label: "Turnering",           emoji: "🏆", color: "text-blue-400" },
    { href: "/bets/match",     label: "Match",               emoji: "⚽", color: "text-violet-400" },
    { href: "/bets/kaos",      label: "Kaos",                emoji: "🔥", color: "text-rose-400" },
  ];

  return (
    <div className="pitch-bg min-h-screen">
      {/* Subtle pitch grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 60px)" }}
      />

      {/* Top nav */}
      <nav className="relative sticky top-0 z-40 bg-pitch-dark/95 backdrop-blur border-b border-pitch-light/20">
        <div className="max-w-4xl mx-auto px-3">
          <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none">
            <Link
              href="/dashboard"
              className="flex flex-col leading-none shrink-0 pr-3 border-r border-pitch-light/20 mr-1 hover:opacity-80 transition-opacity"
            >
              <span className="font-bebas text-gold text-lg tracking-widest">⚽ VM SOCCER SUCKER</span>
              <span className="text-green-700 text-[8px] tracking-widest uppercase font-bold">World Cup 2026</span>
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all hover:bg-pitch-light/20 active:scale-95 ${
                  item.color ?? "text-green-300"
                }`}
              >
                <span>{item.emoji}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}

            {/* Tournament countdown pill */}
            {!isLocked && (
              <div className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <span>⏰</span>
                <span className="hidden sm:inline">Låser</span>
                <span>11 juni</span>
              </div>
            )}
            {isLocked && (
              <div className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-600/30 text-green-400 text-xs font-semibold">
                🏟️ Live
              </div>
            )}
          </div>
        </div>
      </nav>

      <LockBanner />

      <div className="relative max-w-4xl mx-auto px-4 py-6 pb-28">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
