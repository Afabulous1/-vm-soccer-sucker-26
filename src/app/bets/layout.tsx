import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";

const LockBanner = dynamic(() => import("@/components/LockBanner"), { ssr: false });

export default async function BetsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const navItems = [
    { href: "/bets",           label: "Översikt",             emoji: "📋" },
    { href: "/bets/turnering", label: "Turneringsgissningar",  emoji: "🏆", color: "text-blue-400" },
    { href: "/bets/match",     label: "Matchgissningar",       emoji: "⚽", color: "text-violet-400" },
    { href: "/bets/kaos",      label: "Kaosgissningar",        emoji: "🔥", color: "text-rose-400" },
  ];

  return (
    <div className="pitch-bg min-h-screen">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-pitch-dark/90 backdrop-blur border-b border-pitch-light/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors hover:bg-pitch-light/30 ${item.color ?? "text-green-300"}`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <LockBanner />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
