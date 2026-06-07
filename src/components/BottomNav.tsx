"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/dashboard",
    emoji: "🏠",
    label: "Hem",
    activePrefix: "/dashboard",
    track: null,
  },
  {
    href: "/bets/turnering",
    emoji: "🏆",
    label: "Fan Track",
    activePrefix: "/bets/turnering",
    track: "A",
  },
  {
    href: "/bets/match",
    emoji: "⚽",
    label: "Matcher",
    activePrefix: "/bets/match",
    track: "A",
  },
  {
    href: "/bets/kaos",
    emoji: "🔥",
    label: "Party",
    activePrefix: "/bets/kaos",
    track: "B",
  },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-pitch-dark/95 backdrop-blur-md border-t border-pitch-light/20 shadow-2xl shadow-black">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map((tab) => {
            const active =
              path === tab.href ||
              (tab.href !== "/dashboard" &&
                path.startsWith(tab.activePrefix));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center pt-2 pb-1 transition-all duration-150 select-none touch-manipulation min-h-[56px] justify-center ${
                  active ? "text-gold" : "text-green-700 hover:text-green-400"
                }`}
              >
                <span
                  className={`text-2xl transition-transform duration-150 ${
                    active ? "scale-110" : ""
                  }`}
                >
                  {tab.emoji}
                </span>
                <span
                  className={`text-[9px] font-bold tracking-wide mt-0.5 leading-none ${
                    active ? "text-gold" : "text-green-700"
                  }`}
                >
                  {tab.label}
                </span>
                {tab.track && (
                  <span
                    className={`text-[8px] font-semibold mt-0.5 leading-none ${
                      active
                        ? tab.track === "A"
                          ? "text-violet-400"
                          : "text-rose-400"
                        : "text-green-800"
                    }`}
                  >
                    {tab.track === "A" ? "⚽ Fan" : "🔥 Party"}
                  </span>
                )}
                {active && (
                  <span className="w-4 h-0.5 rounded-full bg-gold mt-1" />
                )}
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
