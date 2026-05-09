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
    key: "el_capitan",
    name: "El Capitán",
    emoji: "🧔",
    tagline: "Mitt lag, mina regler. Alltid.",
    gradient: "from-blue-700 via-blue-600 to-indigo-700",
    ringColor: "ring-blue-400",
  },
  {
    key: "var_karen",
    name: "VAR Karen",
    emoji: "📺",
    tagline: "Det där var KLART offside. Ring VAR igen.",
    gradient: "from-red-600 via-rose-500 to-pink-600",
    ringColor: "ring-pink-400",
  },
  {
    key: "offside_olga",
    name: "Offside Olga",
    emoji: "🚩",
    tagline: "Varför är jag alltid på fel ställe?",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    ringColor: "ring-amber-400",
  },
  {
    key: "hat_trick_harry",
    name: "Hat Trick Harry",
    emoji: "🎩",
    tagline: "Jag visste det. Sa jag inte det? Jag visste det.",
    gradient: "from-emerald-600 via-green-500 to-teal-600",
    ringColor: "ring-emerald-400",
  },
  {
    key: "penalty_pete",
    name: "Penalty Pete",
    emoji: "🤸",
    tagline: "Aaaj! Min ankell! STRAAAFF!",
    gradient: "from-purple-700 via-violet-600 to-purple-800",
    ringColor: "ring-violet-400",
  },
  {
    key: "red_card_rolf",
    name: "Red Card Rolf",
    emoji: "🟥",
    tagline: "Rött kort? Det var värt det.",
    gradient: "from-red-700 via-orange-600 to-red-800",
    ringColor: "ring-red-400",
  },
  {
    key: "bench_bjorn",
    name: "Bench Warmer Björn",
    emoji: "🪑",
    tagline: "Min tur SNART. Jag kan känna det!",
    gradient: "from-cyan-600 via-sky-500 to-blue-600",
    ringColor: "ring-cyan-400",
  },
  {
    key: "golden_gunnar",
    name: "Golden Boot Gunnar",
    emoji: "🥇",
    tagline: "Statistik ljuger aldrig. Jag har kollen.",
    gradient: "from-yellow-500 via-amber-400 to-orange-500",
    ringColor: "ring-yellow-400",
  },
  {
    key: "diving_dane",
    name: "The Diving Dane",
    emoji: "🎭",
    tagline: "Det var en kontakt! Jag svär på det!",
    gradient: "from-teal-600 via-cyan-500 to-green-600",
    ringColor: "ring-teal-400",
  },
  {
    key: "commentator_carl",
    name: "Commentator Carl",
    emoji: "🎙️",
    tagline: "OCH HÄR KOMMER HAN — vänta, det var ingenting.",
    gradient: "from-violet-700 via-purple-600 to-indigo-700",
    ringColor: "ring-purple-400",
  },
  {
    key: "keeper_karin",
    name: "Keeper Karin",
    emoji: "🧤",
    tagline: "Det var BACKENS fel. Alltid backens fel.",
    gradient: "from-slate-600 via-zinc-500 to-slate-700",
    ringColor: "ring-slate-400",
  },
  {
    key: "sucker_steve",
    name: "Sucker Steve",
    emoji: "💪",
    tagline: "Nästa match blir annorlunda. Det lovar jag.",
    gradient: "from-pink-600 via-rose-500 to-fuchsia-600",
    ringColor: "ring-rose-400",
  },
];

export function getAvatar(key: string): Avatar | undefined {
  return AVATARS.find((a) => a.key === key);
}
