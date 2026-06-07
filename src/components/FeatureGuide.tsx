"use client";

import { useState, useEffect } from "react";

// Bump version when guide content changes — forces all users to see it again
const STORAGE_KEY = "vm26_guide_v4";

const STEPS = [
  {
    emoji: "⚽",
    title: "Välkommen till VM Soccer Sucker!",
    body: "Gissa VM 2026 med dina kompisar — för ära och heder. Inga pengar, inga stakes. Den med flest poäng den 19 juli vinner. Det finns TVÅ sätt att spela — välj ett, välj båda!",
    accent: "text-gold",
    tag: null,
  },
  {
    emoji: "⚽",
    title: "Laget: Fotbollsfansen",
    body: "Vet du vilka lag som är bra? Kan du ana vem som vinner? Då är Fan Track för dig. Du gissar matchresultat och turneringsutfall och tjänar poäng på fotbollskunskap. Ju mer du kan, desto bättre — men en chansning kan också ge jackpot.",
    accent: "text-violet-400",
    tag: "⚽ Fan Track",
  },
  {
    emoji: "🏆",
    title: "Fan Track: Turneringsgissningar",
    body: "6 gissningar om hela VM: vem vinner, vilka är i finalen, vem är skyttekung, vilken är dödsgruppen. Dessa låser DEN 11 JUNI kl 19:00 svensk tid — du kan inte ändra dem efteråt. Lägg dem medan du kan!",
    accent: "text-blue-400",
    tag: "⚽ Fan Track",
  },
  {
    emoji: "⚽",
    title: "Fan Track: Matchgissningar",
    body: "Alla 72 gruppspelsmatcher finns tillgängliga nu — plus knockout-matcher. Gissa 1-X-2 och totalt antal mål. Varje match låser 15 minuter innan avspark. Du kan gissa hela vägen till finalen!",
    accent: "text-violet-400",
    tag: "⚽ Fan Track",
  },
  {
    emoji: "🔥",
    title: "Laget: Party-spelaren",
    body: "Noll koll på fotboll? PERFEKT. Party Track är gjort för dig. Inga rätt eller fel svar du behöver kunna — bara JA eller NEJ på galna scenarion. Och sen saboterar du dina kompisar med Party-krafter. Det enda du behöver är instinkter och skadeglädje.",
    accent: "text-rose-400",
    tag: "🔥 Party Track",
  },
  {
    emoji: "🎲",
    title: "Party Track: Kaosgissningar",
    body: "6 vilda JA/NEJ-frågor: Gör en målvakt mål? Åker en tränare ut? Sverige till finalen? 10 000 poäng PER rätt svar. Dessa låser 11 juni kl 19:00. Det är allt — välj JA eller NEJ och hoppas på kaos.",
    accent: "text-rose-400",
    tag: "🔥 Party Track",
  },
  {
    emoji: "🧊",
    title: "Party-krafter: Sabotera varje match!",
    body: "På VARJE matchsida finns ett 🔥 Party Track-avsnitt längst ner. När matchen låser ser du vad varje spelare har gissat — klicka 🧊 Sabotera bredvid en rival för att nolla deras rätta gissning. Aktivera 🦊 Punto Bandito för att stjäla 200p från ligaledaren. Du behöver inte gissa ett enda matchresultat för att sabotera!",
    accent: "text-rose-400",
    tag: "🔥 Party Track",
  },
  {
    emoji: "✨",
    title: "Fan-krafter: Power-ups på matcher",
    body: "Fan Track-spelare har kraftiga power-ups: Dubbel-eller-inget (2× eller 0), Taktikgeniet (50% om rätt sida), Sexpoängaren (+600p bonus), Försäkringen (50% tillbaka vid fel), Tidsmaskinen (ändra gissning efter avspark!). Välj kraft när du lägger din matchgissning.",
    accent: "text-gold",
    tag: "⚽ Fan Track",
  },
  {
    emoji: "🚀",
    title: "Dags att slå dina kompisar!",
    body: "Gissningarna är öppna NU — alla matcher finns tillgängliga. Lägg turneringsgissningar och kaosgissningar INNAN 11 juni kl 19:00 (svensk tid). Matchgissningar kan du lägga löpande hela turneringen. Lycka till — och kom ihåg: sabotera dina bästa vänner utan dåligt samvete.",
    accent: "text-green-400",
    tag: null,
  },
];

export default function FeatureGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

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

  const tagColor =
    cur.tag?.startsWith("⚽") ? "bg-violet-900/60 text-violet-300 border-violet-500/40" :
    cur.tag?.startsWith("🔥") ? "bg-rose-900/60 text-rose-300 border-rose-500/40" : null;

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
            {cur.tag && tagColor && (
              <span className={`inline-block text-[10px] font-bold uppercase tracking-widest border px-3 py-1 rounded-full ${tagColor}`}>
                {cur.tag}
              </span>
            )}
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
