"use client";

import { useState } from "react";
import type { SuggestionTier } from "@/types/database";

interface Suggestion {
  tier: SuggestionTier;
  value: unknown;
  label: string;
  flavorText: string;
  stats: string[];
  confirmation: string;
}

interface Props {
  betType: string;
  suggestions?: Suggestion[];
  onSelect: (value: unknown, tier: SuggestionTier) => void;
}

const TIER_CONFIG = {
  safe: {
    emoji: "🟢",
    name: "Säkra Spelaren",
    tagline: "Låg risk, solida odds",
    multiplier: "1×",
    gradient: "from-green-900/80 to-green-800/60",
    border: "border-green-600/50",
    button: "bg-green-600 hover:bg-green-500",
  },
  devil: {
    emoji: "🟠",
    name: "Djävulens Advokat",
    tagline: "Mot strömmen, men med logik",
    multiplier: "1.25× om rätt",
    gradient: "from-orange-900/80 to-orange-800/60",
    border: "border-orange-600/50",
    button: "bg-orange-600 hover:bg-orange-500",
  },
  crazy: {
    emoji: "🔴",
    name: "För Galet För Att Hända",
    tagline: "Kaos, legender och julbordsstories",
    multiplier: "2× om rätt",
    gradient: "from-red-900/80 to-red-800/60",
    border: "border-red-600/50",
    button: "bg-red-600 hover:bg-red-500",
  },
};

// Default static suggestions when no API data is available
function getDefaultSuggestions(betType: string): Suggestion[] {
  const defaults: Record<string, Suggestion[]> = {
    vm_winner: [
      {
        tier: "safe",
        value: "Frankrike",
        label: "Frankrike",
        flavorText: "Lyssna här — det här är ingen vild gissning. Det här är MATEMATIK. Frankrike har en av de starkaste trupper i världen. Gissa detta och sov gott ikväll. 😌",
        stats: ["FIFA-rankad #2 i världen", "Regerande europamästare 2000 och VM-vinnare 2018", "Djupaste truppen i hela turneringen"],
        confirmation: "Bra val, du vet vad du gör 😎",
      },
      {
        tier: "devil",
        value: "Spanien",
        label: "Spanien",
        flavorText: "Okej, det här är inte för fega. Men hör på mig — Spanien vann U21-EM 2023, Euros 2024 med yngsta laget på decennier. Lamine Yamal är 18. ARTON. 😈",
        stats: ["Vann EM 2024 övertygande", "Yngsta genomsnittsåldern av favoriterna", "Lamine Yamal & Pedri = framtiden är nu"],
        confirmation: "Modig! Hoppas du vet vad du gör 😬",
      },
      {
        tier: "crazy",
        value: "Marocko",
        label: "Marocko",
        flavorText: "STOPP. Andas. Jag vet hur det här låter. Men Marocko gick till SEMIFINAL 2022. På hemmaplan i Afrika kan de gå hela vägen. Är du redo att bli legend? 🤪🔥",
        stats: ["Semifinalist VM 2022 — historiskt", "Stark hemmasupport i hela arabvärlden", "Atlas Lejonens taktik är defensivt oslagbar"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    goalkeeper_goal: [
      {
        tier: "safe",
        value: "no",
        label: "Nej — det händer inte",
        flavorText: "Statistiken talar sitt tydliga språk. En målvakt som gör mål i ett VM är extremt ovanligt. Gissa nej och vila din själ. 😌",
        stats: ["Senaste målvaktsmålet i VM var aldrig", "Moderna taktiker håller målvakterna bakom", "99%+ av alla VM-matcher slutar utan detta"],
        confirmation: "Säkert val, statistiken är på din sida 😎",
      },
      {
        tier: "devil",
        value: "no",
        label: "Nej — men med spänning",
        flavorText: "Det är osannolikt men inte omöjligt. Det finns VAR nu, och hörnsparkar... nej, stanna på nej men med lite nervositet. 😬",
        stats: ["Aldrig inträffat i VM-historia", "VAR kan avgöra om situationer uppstår", "Längre turnering = fler chanser för det osannolika"],
        confirmation: "Förnuftig gissning med rätt skepsis 😬",
      },
      {
        tier: "crazy",
        value: "yes",
        label: "JA — det händer!",
        flavorText: "DET KAN HÄNDA. Brasiliens keeper Taffarel missade nästan ett mål 1998. Costa Ricas keeper Keylor Navas… okej han kom nära. Vill du bli odödlig? 🤪🔥",
        stats: ["48 lag = fler udda matcher", "Desperate situationer i slutminuterna", "WC 2026 har rekordlånga övertider"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    match_result: [
      {
        tier: "safe",
        value: "home",
        label: "Hemmavinst",
        flavorText: "Hemmalaget spelar framför sin publik, med kortare resetid, i sin tidszon. Enkel matematik. 😌",
        stats: ["Hemmalag vinner ~45% av VM-matcher", "Lägre stress och bättre förberedelse", "Historiskt favoritläge i knockout-matcher"],
        confirmation: "Bra val, du vet vad du gör 😎",
      },
      {
        tier: "devil",
        value: "draw",
        label: "Oavgjort",
        flavorText: "Taktiska lag möts ofta med stängda linjer. Oavgjort är underskattad gissning — 25% av alla VM-matcher slutar oavgjort. 😈",
        stats: ["~25% av alla VM-matcher = oavgjort", "Taktiska lag föredrar 0-0 och tar det lugnt", "Bra odds om du ser rätt matchup"],
        confirmation: "Modig! Hoppas du vet vad du gör 😬",
      },
      {
        tier: "crazy",
        value: "away",
        label: "Bortavinst med kaos",
        flavorText: "Saudi Arabien slog Argentina. Senegala slog Frankrike 2002. Japan slog Tyskland 2022. UPSETS HÄNDER. Är du redo? 🤪🔥",
        stats: ["Störst upset i WC 2022: Saudiarabien 2-1 Argentina", "Japan slog BÅDE Tyskland och Spanien 2022", "Bortalag utan pressar spelar friare"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
  };

  return defaults[betType] ?? defaults.match_result;
}

export default function StodSupportern({ betType, suggestions, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<SuggestionTier | null>(null);
  const [chosen, setChosen] = useState<SuggestionTier | null>(null);

  const tiers = suggestions ?? getDefaultSuggestions(betType);

  function handleSelect(s: Suggestion) {
    onSelect(s.value, s.tier);
    setChosen(s.tier);
    setTimeout(() => setOpen(false), 1200);
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-pitch-light hover:bg-pitch border-2 border-gold/60 text-gold font-bebas text-lg tracking-wider px-4 py-3 rounded-2xl shadow-xl shadow-black/40 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        🤔 Hjälp mig gissa!
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-pitch-dark border-t border-pitch-light/40 rounded-t-3xl max-h-[85vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-pitch-light/50" />
          </div>

          <div className="px-4 pb-8 space-y-4">
            <div className="text-center pb-2">
              <h2 className="font-bebas text-3xl text-gold tracking-widest">STÖD SUPPORTERN</h2>
              <p className="text-green-400 text-xs">Låt oss hjälpa dig gissa — välj din risknivå</p>
            </div>

            {tiers.map((s) => {
              const cfg = TIER_CONFIG[s.tier];
              const isExpanded = expanded === s.tier;
              const isChosen = chosen === s.tier;

              return (
                <div
                  key={s.tier}
                  className={`rounded-2xl border bg-gradient-to-br ${cfg.gradient} ${cfg.border} overflow-hidden`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cfg.emoji}</span>
                          <span className="font-bebas text-xl text-white tracking-wide">{cfg.name}</span>
                        </div>
                        <p className="text-white/60 text-xs">{cfg.tagline} · {cfg.multiplier}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white font-bold text-sm">{s.label}</p>
                      </div>
                    </div>

                    <p className="text-white/80 text-xs leading-relaxed mb-3 italic">
                      &ldquo;{s.flavorText}&rdquo;
                    </p>

                    {/* Expandable stats */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : s.tier)}
                      className="text-white/50 text-xs underline underline-offset-2 mb-3"
                    >
                      {isExpanded ? "Dölj statistik ▲" : "Varför detta? ▼"}
                    </button>

                    {isExpanded && (
                      <ul className="mb-3 space-y-1">
                        {s.stats.map((stat, i) => (
                          <li key={i} className="text-white/70 text-xs flex gap-2">
                            <span className="text-gold shrink-0">•</span>
                            <span>{stat}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {isChosen ? (
                      <div className="text-center py-2 text-white text-sm font-semibold">
                        ✅ {s.confirmation}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelect(s)}
                        className={`w-full ${cfg.button} text-white font-bebas text-lg tracking-widest py-2.5 rounded-xl transition-all duration-200 active:scale-95`}
                      >
                        GISSA DETTA!
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
