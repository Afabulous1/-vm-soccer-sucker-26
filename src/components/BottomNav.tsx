"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard",      emoji: "🏠", label: "Hem",      activePrefix: "/dashboard" },
  { href: "/bets/turnering", emoji: "🏆", label: "Turnering", activePrefix: "/bets/turnering" },
  { href: "/bets/match",     emoji: "⚽", label: "Match",     activePrefix: "/bets/match" },
  { href: "/bets/kaos",      emoji: "🔥", label: "Kaos",      activePrefix: "/bets/kaos" },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-pitch-dark/95 backdrop-blur-md border-t border-pitch-light/20 shadow-2xl shadow-black">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map((tab) => {
            const active = path === tab.href || (tab.href !== "/dashboard" && path.startsWith(tab.activePrefix));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center pt-2.5 pb-3 transition-all duration-150 select-none ${
                  active ? "text-gold" : "text-green-700 hover:text-green-400"
                }`}
              >
                <span className={`text-2xl transition-transform duration-150 ${active ? "scale-110" : ""}`}>
                  {tab.emoji}
                </span>
                <span className={`text-[10px] font-bold tracking-wide mt-0.5 ${active ? "text-gold" : "text-green-700"}`}>
                  {tab.label}
                </span>
                {active && <span className="w-4 h-0.5 rounded-full bg-gold mt-1" />}
              </Link>
            );
          })}
        </div>
        {/* iOS safe-area spacer */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
