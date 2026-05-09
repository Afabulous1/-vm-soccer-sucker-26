"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "vm26_guide_v1";

const STEPS = [
  {
    emoji: "⚽",
    title: "Välkommen till VM Soccer Sucker 26!",
    body: "Gissa VM 2026 med dina kompisar — för ära och heder! Ingen e-post, inga stakes, bara ren fotbollsglädje. Låt oss gå igenom hur spelet funkar.",
    accent: "text-gold",
  },
  {
    emoji: "📅",
    title: "Gissningarna öppnar 1 juni",
    body: "Du kan inte lägga gissningar förrän den 1 juni 2026. Från och med då är det full fart — och du har TIO dagar på dig innan turneringen låser.",
    accent: "text-green-400",
  },
  {
    emoji: "🏆",
    title: "Turneringsgissningar (1 000–5 000p)",
    body: "Gissa vinnaren, finalisterna, skyttekungen, dödsgruppen och mer. Dessa låser exakt 11 juni kl 17:00 UTC — dag ett av turneringen. Välj klokt!",
    accent: "text-blue-400",
  },
  {
    emoji: "🔥",
    title: "Kaosgissningar (10 000p styck!)",
    body: "De vildaste gissningarna: en målvakt gör mål? Sverige till finalen? Varje rätt kaosgissning ger dig 10 000 poäng. Låser samma dag som turneringen.",
    accent: "text-rose-400",
  },
  {
    emoji: "⚽",
    title: "Matchgissningar (5–50p per bet)",
    body: "Gissa varje match: rätt sida (10p), exakt resultat (50p), första målskytt (30p) och mer. Matchgissningar låser exakt vid avspark — kolla klockan!",
    accent: "text-violet-400",
  },
  {
    emoji: "✨",
    title: "Superkrafter — bara på matcher!",
    body: "Du har 5 superkrafter: Dubbel-eller-inget (2× eller 0), Taktikgeniet (50% om rätt sida), 6-Poängaren (+600p bonus), Försäkringen (50% tillbaka vid fel), Tidsmaskinen (ändra gissning!). Används BARA på matchgissningar.",
    accent: "text-gold",
  },
  {
    emoji: "🚀",
    title: "Redo att slå kompisarna?",
    body: "Gissningarna öppnar 1 juni — håll koll på ligatabellen och skräpsnacket i dashboarden. Musiken hjälper dig komma i VM-stämning. Lycka till!",
    accent: "text-green-400",
  },
];

export default function FeatureGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const cur    = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-gold/20 bg-pitch-dark shadow-2xl shadow-black/60 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-pitch-light/20">
          <div
            className="h-full bg-gold transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-4">
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full cursor-pointer transition-all duration-200 ${
                  i === step ? "bg-gold w-5" : i < step ? "bg-gold/40 w-1.5" : "bg-pitch-light/30 w-1.5"
                }`}
              />
            ))}
          </div>

          <div className="text-center space-y-3 py-2">
            <div className="text-6xl">{cur.emoji}</div>
            <h2 className={`font-bebas text-3xl tracking-widest leading-tight ${cur.accent}`}>
              {cur.title}
            </h2>
            <p className="text-green-300/90 text-sm leading-relaxed">{cur.body}</p>
          </div>

          <div className="flex gap-2 pt-1">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 border border-pitch-light/30 text-green-400 font-semibold py-3 rounded-xl text-sm hover:bg-pitch-light/10 transition-all"
              >
                ← Tillbaka
              </button>
            )}
            <button
              onClick={isLast ? close : () => setStep((s) => s + 1)}
              className="flex-1 bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-xl tracking-widest py-3 rounded-xl transition-all active:scale-95"
            >
              {isLast ? "BÖRJA GISSA! 🚀" : "NÄSTA →"}
            </button>
          </div>

          <button
            onClick={close}
            className="w-full text-green-700 text-xs hover:text-green-500 transition-colors py-1"
          >
            Hoppa över guiden
          </button>
        </div>
      </div>
    </div>
  );
}
