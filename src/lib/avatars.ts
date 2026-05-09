export interface Avatar {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  gradient: string;
  ringColor: string;
}

export const AVATARS: Avatar[] = [
  {
    // Alliterativ titel — den självsäkre kaptenen
    key: "el_capitan",
    name: "Kapten Fantast",
    emoji: "🧔",
    tagline: "Mitt lag, mina regler. Alltid.",
    gradient: "from-blue-700 via-blue-600 to-indigo-700",
    ringColor: "ring-blue-400",
  },
  {
    // Bindestreck-smeknamn — teknikklagaren
    key: "var_karen",
    name: "VAR-Vendela",
    emoji: "📺",
    tagline: "Det där var KLART offside. Ring VAR igen.",
    gradient: "from-red-600 via-rose-500 to-pink-600",
    ringColor: "ring-pink-400",
  },
  {
    // Bindestreck-smeknamn — alltid på fel ställe
    key: "offside_olga",
    name: "Felläges-Frida",
    emoji: "🚩",
    tagline: "Varför är jag alltid på fel ställe?",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    ringColor: "ring-amber-400",
  },
  {
    // Bindestreck-smeknamn — wannabe-taktikern
    key: "hat_trick_harry",
    name: "Taktik-Torsten",
    emoji: "🎩",
    tagline: "Jag visste det. Sa jag inte det? Jag visste det.",
    gradient: "from-emerald-600 via-green-500 to-teal-600",
    ringColor: "ring-emerald-400",
  },
  {
    // Platsnamn som smeknamn — straffboxsdykaren
    key: "penalty_pete",
    name: "Straffcirkeln Staffan",
    emoji: "🤸",
    tagline: "Aaaj! Min ankell! STRAAAFF!",
    gradient: "from-purple-700 via-violet-600 to-purple-800",
    ringColor: "ring-violet-400",
  },
  {
    // Historiskt tillnamn — röda-kortets mästare
    key: "red_card_rolf",
    name: "Röde Ragnar",
    emoji: "🟥",
    tagline: "Rött kort? Det var värt det.",
    gradient: "from-red-700 via-orange-600 to-red-800",
    ringColor: "ring-red-400",
  },
  {
    // Alliterativt smeknamn — den evige reserven
    key: "bench_bjorn",
    name: "Bänkvärmare-Bengt",
    emoji: "🪑",
    tagline: "Min tur SNART. Jag kan känna det!",
    gradient: "from-cyan-600 via-sky-500 to-blue-600",
    ringColor: "ring-cyan-400",
  },
  {
    // Alliterativ titel — statistikfanatikern
    key: "golden_gunnar",
    name: "Guldskon Gustav",
    emoji: "🥇",
    tagline: "Statistik ljuger aldrig. Jag har kollen.",
    gradient: "from-yellow-500 via-amber-400 to-orange-500",
    ringColor: "ring-yellow-400",
  },
  {
    // Kunglig titel — dramakungen på planen
    key: "diving_dane",
    name: "Teaterkungen Tage",
    emoji: "🎭",
    tagline: "Det var en kontakt! Jag svär på det!",
    gradient: "from-teal-600 via-cyan-500 to-green-600",
    ringColor: "ring-teal-400",
  },
  {
    // Yrkestitel — aldrig tyst i mikrofonen
    key: "commentator_carl",
    name: "Sändaren Stig",
    emoji: "🎙️",
    tagline: "OCH HÄR KOMMER HAN — vänta, det var ingenting.",
    gradient: "from-violet-700 via-purple-600 to-indigo-700",
    ringColor: "ring-purple-400",
  },
  {
    // Yrkestitel + gammaldags namn — backarnas skuldbeläggare
    key: "keeper_karin",
    name: "Målvakten Maj-Britt",
    emoji: "🧤",
    tagline: "Det var BACKENS fel. Alltid backens fel.",
    gradient: "from-slate-600 via-zinc-500 to-slate-700",
    ringColor: "ring-slate-400",
  },
  {
    // Kulturell referens — Svensson = den svenske everyman-efternamnet
    key: "sucker_steve",
    name: "Evige Svensson",
    emoji: "💪",
    tagline: "Nästa match blir annorlunda. Det lovar jag.",
    gradient: "from-pink-600 via-rose-500 to-fuchsia-600",
    ringColor: "ring-rose-400",
  },
];

export function getAvatar(key: string): Avatar | undefined {
  return AVATARS.find((a) => a.key === key);
}
