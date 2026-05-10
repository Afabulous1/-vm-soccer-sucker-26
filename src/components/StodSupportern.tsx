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
    // ── Tournament bets ────────────────────────────────────────────────────
    vm_winner: [
      {
        tier: "safe",
        value: "Frankrike",
        label: "Frankrike",
        flavorText: "Det här är ingen vild gissning — det är MATEMATIK. Frankrike har en av de starkaste trupper i världen. Gissa detta och sov gott. 😌",
        stats: ["FIFA-rankad #2 i världen", "VM-vinnare 2018, EM-vinnare 2000", "Djupaste truppen i hela turneringen"],
        confirmation: "Bra val, du vet vad du gör 😎",
      },
      {
        tier: "devil",
        value: "Spanien",
        label: "Spanien",
        flavorText: "Spanien vann EM 2024 med yngsta laget på decennier. Lamine Yamal är 18. ARTON. Det här är inte för fega. 😈",
        stats: ["Vann EM 2024 övertygande", "Yngsta genomsnittsåldern bland favoriterna", "Lamine Yamal & Pedri = framtiden är nu"],
        confirmation: "Modig! Hoppas du vet vad du gör 😬",
      },
      {
        tier: "crazy",
        value: "Marocko",
        label: "Marocko",
        flavorText: "Marocko gick till SEMIFINAL 2022. De spelar i Nordafrika med stenhård hemmasupport. Är du redo att bli legend? 🤪🔥",
        stats: ["Semifinalist VM 2022 — historiskt", "Stark support i hela arabvärlden", "Defensivt oslagbara under rätt betingelser"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    finalists: [
      {
        tier: "safe",
        value: { team1: "Frankrike", team2: "Brasilien" },
        label: "Frankrike vs Brasilien",
        flavorText: "De två eviga favoriterna möts i finalen. Klassisk final, klassisk gissning. Ingen skäms för det här valet. 😌",
        stats: ["Frankrike #2 & Brasilien #1 i FIFA-ranking", "Båda har vunnit VM fler än en gång", "Det förväntade slutspelet på förhand"],
        confirmation: "Tryggt val — klassisk final 😎",
      },
      {
        tier: "devil",
        value: { team1: "Spanien", team2: "Argentina" },
        label: "Spanien vs Argentina",
        flavorText: "Spanien med sin nya generation mot Messi-ärlingens Argentina. Teknisk fotboll mot latinsk passion. Det finns sämre finaler. 😈",
        stats: ["Spanien vann EM 2024, Argentina vann VM 2022", "Båda spelar med hög presspel", "Messi kan bli sista-gången-faktor"],
        confirmation: "Snygg duell — du tänker utanför boxen 😬",
      },
      {
        tier: "crazy",
        value: { team1: "Marocko", team2: "USA" },
        label: "Marocko vs USA",
        flavorText: "VM spelas i USA. Hemmalaget. Publiken. Trycket. Marocko har gjort det förut. Det här är antingen genialt eller GALET. 🤪🔥",
        stats: ["USA är ett av tre värdländer — hemmaplan", "Marocko är bevisad upset-kung", "Ingen av dem har vunnit VM — exakt rätt drama"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    top_scorer: [
      {
        tier: "safe",
        value: "Erling Haaland",
        label: "Erling Haaland",
        flavorText: "Haaland gör mål i vatten. I Premier League, i Champions League, i dammsugare om det behövdes. Gissa honom och gå vidare. 😌",
        stats: ["Toppskytt i PL två säsonger i rad", "Presterar under press i turneringar", "Norge kan gå långt i VM 2026"],
        confirmation: "Solidt val — maskinen levererar 😎",
      },
      {
        tier: "devil",
        value: "Lamine Yamal",
        label: "Lamine Yamal",
        flavorText: "18 år. Vann EM 2024. Spelar som om fotboll är ett videospel på lättaste svårighetsgraden. Modig gissning — men inte orimlig. 😈",
        stats: ["Bäste spelare i EM 2024 som 16-åring", "Snabb, teknisk, målfarlig", "Spanien kan nå final = fler matcher = fler mål"],
        confirmation: "Framtiden är nu — modig gissning 😬",
      },
      {
        tier: "crazy",
        value: "Karim Benzema",
        label: "Karim Benzema",
        flavorText: "Han är inte ens säker på att spela. Men om han är med och Frankrike går till final… Ballon d'Or-vinnare i comeback-mode. Är du redo att leva på kanten? 🤪🔥",
        stats: ["Ballon d'Or 2022 — bevisad mästare", "Comeback-historier skrivs i VM", "Om Frankrike vinner = max antal matcher = max mål"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    total_goals: [
      {
        tier: "safe",
        value: 163,
        label: "163 mål",
        flavorText: "VM 2022 hade 172 mål på 64 matcher. Med 104 matcher 2026 och historiskt snitt runt 2,6 mål/match landar vi runt 163-175. Träffa mitten. 😌",
        stats: ["VM 2022: 172 mål på 64 matcher (2,69/match)", "VM 2018: 169 mål (2,64/match)", "104 matcher × 2,6 snitt ≈ 163-175 mål"],
        confirmation: "Säker mittengissning — statistiken är med dig 😎",
      },
      {
        tier: "devil",
        value: 185,
        label: "185 mål",
        flavorText: "Fler lag, fler matcher, fler mål. Med 48 lag och gruppspelets format är det fler svaga möten = fler mål. Högt men motiverat. 😈",
        stats: ["48 lag = fler ojämna matcher i gruppspelet", "Fler matcher totalt = fler chanser till mål", "VM 1998: 171 mål (rekord då) med 32 lag"],
        confirmation: "Högt men logiskt — du har tänkt igenom det 😬",
      },
      {
        tier: "crazy",
        value: 220,
        label: "220 mål",
        flavorText: "KAOS. VAR dömer straff på allting. Lag spelar utan broms. Slutspelet exploderar med övertid och straffar. 220 mål. Legenden är dig. 🤪🔥",
        stats: ["VAR-straff har ökat mål per match de senaste åren", "Övertidsmatcher räknas med alla mål", "48 lag × 3 gruppspelsmatcher = fler ojämna kracher"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    death_group: [
      {
        tier: "safe",
        value: "A",
        label: "Grupp A",
        flavorText: "Grupp A brukar vara startgruppen med starka motståndare. Media väljer alltid en tidigt och det är vanligtvis en av de första bokstäverna. Säkert kort. 😌",
        stats: ["Värdland USA är i grupp A, garanterat mediafokus", "Starka nationer hamnar ofta i de tidiga grupperna", "Media döper alltid en grupp till 'dödsgrupp'"],
        confirmation: "Pragmatiskt val 😎",
      },
      {
        tier: "devil",
        value: "B",
        label: "Grupp B",
        flavorText: "Historiskt sett hamnar en 'orättvis' grupp med tre starka lag och ett wild card i grupp B eller C. Det är där kaoset brukar bryta ut. 😈",
        stats: ["VM 2022: Grupp C var dödsgruppen (Argentina, Polen, Mexiko, Saudiarabien)", "Grupp B har historiskt hög stjärntäthet", "Media är förälskade i det oväntade"],
        confirmation: "Insiktsfullt — du vet hur media tänker 😬",
      },
      {
        tier: "crazy",
        value: "L",
        label: "Grupp L",
        flavorText: "Grupp L. Den sista gruppen. Vem bryr sig om L? ALLA — för det är här de underskattade lagen gömmer sig och förstör allas favoriter. 🤪🔥",
        stats: ["Sista gruppen = sista att delas ut = oväntade sammansättningar", "Outsiders gör sina liv i de sista grupperna", "Om Schweiz, Mexico och Senegal hamnar där — kaos garanterat"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    most_red_cards: [
      {
        tier: "safe",
        value: "Colombia",
        label: "Colombia",
        flavorText: "Colombia har historiskt sett fler röda kort per match än nästan alla andra nationer. De spelar hårt, passionerat och ibland för hårt. 😌",
        stats: ["Colombia: bland de mest utvisade lagen i VM-historia", "Känd för hetsigt spel under press", "Spelas i Nordamerika = extra press och temperament"],
        confirmation: "Statistiken stöder dig på detta 😎",
      },
      {
        tier: "devil",
        value: "Argentina",
        label: "Argentina",
        flavorText: "Argentina spelar på kanten hela tiden. Messi-eran är slut och nästa generation är hungrigare och hetare. Temperament = röda kort. 😈",
        stats: ["Argentina: 6+ röda kort i senaste tre VM-turneringarna", "Generationsskiftet ger mer okontrollerat spel", "Spelar alltid knockout från gruppen = fler desperata situationer"],
        confirmation: "Modig men motiverad gissning 😬",
      },
      {
        tier: "crazy",
        value: "Saudiarabien",
        label: "Saudiarabien",
        flavorText: "De slog Argentina 2022. De är välfinansierade, motiverade och har ingenting att förlora. Desperation = röda kort. Plus ingen förväntar sig det. 🤪🔥",
        stats: ["Saudiarabien slog Argentina 2022 — de spelar utan rädsla", "Nytt proffsliga = lira mot världens bästa = frustration", "Om de pressas tidigt kommer temperamentet fram"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    // ── Kaos bets ──────────────────────────────────────────────────────────
    goalkeeper_goal: [
      {
        tier: "safe",
        value: "no",
        label: "Nej — det händer inte",
        flavorText: "Statistiken talar sitt tydliga språk. En målvakt som gör mål i ett VM har ALDRIG hänt. Gissa nej och vila din själ. 😌",
        stats: ["Har aldrig hänt i VM-historia", "Moderna taktiker håller målvakterna bakom", "99%+ av alla VM-matcher slutar utan detta"],
        confirmation: "Säkert val, statistiken är på din sida 😎",
      },
      {
        tier: "devil",
        value: "no",
        label: "Nej — men med spänning",
        flavorText: "Det är osannolikt men inte omöjligt. Det finns VAR nu och desperata situationer i slutminuterna... men nej, det händer inte. 😬",
        stats: ["Aldrig inträffat i VM-historia", "VAR kan avgöra om situationer uppstår", "Längre turnering = fler chanser för det osannolika"],
        confirmation: "Förnuftig gissning med rätt skepsis 😬",
      },
      {
        tier: "crazy",
        value: "yes",
        label: "JA — det händer!",
        flavorText: "DET KAN HÄNDA. 48 lag. 104 matcher. Desperation i gruppspelets sista runda. En hörna i övertid. Vill du bli odödlig? 🤪🔥",
        stats: ["48 lag = fler udda situationer och desperata lag", "VAR och VAR-straff ökar kaosscenarion", "En hörna i 90+5 och allt är möjligt"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    coach_sent_off: [
      {
        tier: "safe",
        value: "no",
        label: "Nej — det håller sig",
        flavorText: "Tränare brukar kontrollera sig även under press. De är proffs. UEFA och FIFA straffar det hårt. De flesta är för smarta för det. 😌",
        stats: ["Utvisning av tränare sker i under 2% av VM-matcher", "Moderna tränare är mer medialt skolade", "FIFA-regler avskräcker med match-suspenderingar"],
        confirmation: "Förnuftigt — de flesta håller sig 😎",
      },
      {
        tier: "devil",
        value: "yes",
        label: "Ja — någon exploderar",
        flavorText: "VM-press är annorlunda. Karriären, nationen, fyra års väntan. Någon sydamerikansk eller sydeuropeisk tränare tappar det. Det händer faktiskt ganska ofta. 😈",
        stats: ["Diego Simeone, Mourinho-kloner finns överallt i VM", "VM 2022: flera coacher fick tillrättavisningar", "Karriärens sista chans skapar desperation"],
        confirmation: "Inte orimligt — VM kokar alltid över 😬",
      },
      {
        tier: "crazy",
        value: "yes",
        label: "Ja — och det filmas!",
        flavorText: "Inte bara utvisad — utan en EPISK meltdown på kamera. Pekandes. Skrikandes. Tårarna. Det här är inte en gissning. Det är en profetia. 🤪🔥",
        stats: ["VM 2022: Sjungandes och dansandes tränare efter mål", "Sociala medier garanterar att allt fångas på film", "48 lag × hög press = någon spränger"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    comeback_win: [
      {
        tier: "safe",
        value: "no",
        label: "Nej — för svårt",
        flavorText: "0-3 i ett knockout-möte är i princip omöjligt att vända. Det har hänt i ligan men i VM under press? Nej. Det händer inte. 😌",
        stats: ["Ingen har vänt 0-3 i VM knockout i modern tid", "Lag som leder 3-0 spelar defensivt och stänger av", "90 minuter räcker sällan — övertid ännu svårare"],
        confirmation: "Realistiskt tänkande 😎",
      },
      {
        tier: "devil",
        value: "no",
        label: "Nej — men nära",
        flavorText: "Det NÄSTAN händer ibland. Men nästan räknas inte. Gissa nej men förvänta dig 90 minuter av hjärtat i halsgropen. 😈",
        stats: ["Barcelona vs PSG 2017 i CL: 0-4 → 6-1, men det var i klubbfotboll", "VM-lag är mer defensivt disciplinerade", "VAR och press gör 3-0-ledningar svårare att tappa"],
        confirmation: "Smartaste gissningen — men redo att bli förvånad 😬",
      },
      {
        tier: "crazy",
        value: "yes",
        label: "Ja — det omöjliga händer!",
        flavorText: "Barcelona vände 0-4 mot PSG. Liverpool vände 0-3 mot AC Milan. VM 2026 är fyllt av desperation, nationalism och 90 000 skrikande fans. Allt är möjligt. 🤪🔥",
        stats: ["Historiens omöjligaste combacks har hänt i stora scener", "48 lag = fler missmatchade möten i tidig knockout", "Nationalism + hemmasupport = orimliga saker"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    final_penalty_miss: [
      {
        tier: "safe",
        value: "no",
        label: "Nej — finalen avgörs reguljärt",
        flavorText: "De flesta VM-finaler avgörs i reguljär tid eller förlängning. Straffar i finalen är rara och tre missade straffar ännu rarare. Gissa nej. 😌",
        stats: ["Av 22 VM-finaler har bara 4 gått till straffar", "Lag tränar straffar mer idag än någonsin", "Moderna målvakter är bättre — men skyttarna också"],
        confirmation: "Statistiken är på din sida 😎",
      },
      {
        tier: "devil",
        value: "yes",
        label: "Ja — straffkaoset händer",
        flavorText: "En VM-final på straffar med minst tre missade. Det låter vilt men se bara på EM-finaler och Copa América. Straffar i finals med hög press = kaos. 😈",
        stats: ["EM 2020-finalen: Tre missade straffar av Italien och England", "Copa América 2021: Flera missade i avgörande möten", "VM-finaler med straffar sker vart 6-7 år"],
        confirmation: "Inte orimligt — straffar i stora finaler är kaos 😬",
      },
      {
        tier: "crazy",
        value: "yes",
        label: "Ja — EPISKT straffkaos!",
        flavorText: "Finalen. Straffar. Tre missade. Gråtande. TV-miljoner. Det är inte bara möjligt — det är vad VM är gjort av. Gissa detta och du är antingen profet eller galning. 🤪🔥",
        stats: ["EM 2020-finalen var exakt detta scenario", "Varje stor final har ett straff-drama-potential", "48 lag = fler utmattade finalister = fler missade straffar"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    sweden_final: [
      {
        tier: "safe",
        value: "no",
        label: "Nej — inte den här gången",
        flavorText: "Sverige i VM-final 2026. Matematiken säger nej. Hjärtat säger… också nej. Det finns 47 andra lag som är bättre rankade. Var realist. 😌",
        stats: ["Sverige senast i VM-final: 1958 (ja, det var länge sedan)", "FIFA-ranking: inte i topp 10 bland favoriterna", "Gruppen är tuff och knockoutrundorna ännu tuffare"],
        confirmation: "Realistisk — men trist. Väl valt ändå 😎",
      },
      {
        tier: "devil",
        value: "no",
        label: "Nej — men vi tar semifinal",
        flavorText: "Sverige till final är för vilt. Men semifinal? Med Isak, Kulusevski och rätt lottning? Strunta i detta bet men håll koll på den gissningen. 😈",
        stats: ["Alexander Isak är i världsklass på sina dagar", "Dejan Kulusevski levererade i Premier League", "VM-lottning kan vara snäll — semifinal är inte omöjligt"],
        confirmation: "Realistisk kompromiss — du tänker rätt 😬",
      },
      {
        tier: "crazy",
        value: "yes",
        label: "JA — Sverige i final!",
        flavorText: "SVERIGE. FINAL. VM 2026. Zlatan är pensionerad men andan lever. Isak. Kulusevski. Elanga. Gyökeres. Om det händer är du LEGEND PÅ KROGEN RESTEN AV LIVET. 🤪🔥",
        stats: ["Sverige vann VM 1958 — det händer alltså", "Alexander Isak = en av världens bästa nummer 9:or", "Magiska turneringar kräver ett mirakellag — Sverige kan vara det"],
        confirmation: "MODIG. GALEN. Perfekt. Vi hejar på dig! 🇸🇪🤣",
      },
    ],
    knockout_hattrick: [
      {
        tier: "safe",
        value: "no",
        label: "Nej — för svårt i knockout",
        flavorText: "Hatttrick i ett knockout-möte? Defensiverna är stenhårda, lagen spelar mer taktiskt och 90 minuter räcker sällan. Gissa nej. 😌",
        stats: ["Senaste hattrick i VM-knockout: extremt sällsynt", "Lag spelar defensivt i knockout = färre mål per spelare", "VAR och tight defending stoppar de flesta trekorgar"],
        confirmation: "Realistisk gissning — statistiken stöder dig 😎",
      },
      {
        tier: "devil",
        value: "no",
        label: "Nej — men nära",
        flavorText: "Det händer aldrig. Utom den ena gången det händer. Eusébio 1966. Just Fontaine 1958. Nej är rätt svar — men håll andan. 😈",
        stats: ["Just Fontaine: 13 mål i ett VM, inklusive flera hatttricks", "Eusébio: hattrick i knockoutmatcher 1966", "Om ett topplang möter ett svagt lag i R16 kan det hända"],
        confirmation: "Rätt analys — men redo för det oväntade 😬",
      },
      {
        tier: "crazy",
        value: "yes",
        label: "JA — någon gör det!",
        flavorText: "104 matcher. 48 lag. Haaland, Mbappé, Benzema, Isak, Vinicius. NÅGON av dem möter ett svagt lag i åttondelen och tar tre på 60 minuter. Det HÄNDER. 🤪🔥",
        stats: ["Erling Haaland gör hattricks lika lätt som andra gör mål", "R16 i VM 2026: 16 matcher med potential för ojämna möten", "VM 2022: Mbappé hade hattrick i finalen (räknas ej men nära)"],
        confirmation: "Du är antingen ett geni eller tokig. Vi får se! 🤣",
      },
    ],
    // ── Match bets ─────────────────────────────────────────────────────────
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
        flavorText: "Saudiarabien slog Argentina. Japan slog Tyskland och Spanien 2022. UPSETS HÄNDER. Är du redo? 🤪🔥",
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
      {/* Floating trigger button — sits above the BottomNav (z-50) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 bg-pitch-light hover:bg-pitch border-2 border-gold/60 text-gold font-bebas text-lg tracking-wider px-4 py-3 rounded-2xl shadow-xl shadow-black/40 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        🤔 Hjälp mig gissa!
      </button>

      {/* Backdrop — must cover BottomNav (z-50) */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom drawer — above backdrop */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[65] transition-transform duration-300 ease-out ${
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
