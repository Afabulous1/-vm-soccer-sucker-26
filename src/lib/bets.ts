import type { BetCategory } from "@/types/database";

// Betting window: June 1 → June 11
export const BETTING_OPENS  = new Date("2026-06-01T00:00:00+02:00");
// WC 2026 opens June 11, first match 17:00 UTC
export const TOURNAMENT_LOCK = new Date("2026-06-11T17:00:00Z");

export interface BetDef {
  id: string;
  label: string;
  description: string;
  points: number;
  category: BetCategory;
  inputType: "team" | "two-teams" | "player" | "number" | "group" | "yesno";
  bonusPoints?: number;
}

export const TURNERING_BETS: BetDef[] = [
  {
    id: "vm_winner",
    label: "VM-vinnaren",
    description: "Vilket land lyfter pokalen den 19 juli? Välj klokt — det är 1 av 48.",
    points: 5000,
    category: "turnering",
    inputType: "team",
  },
  {
    id: "finalists",
    label: "Finalisterna",
    description: "Vilka två lag möts i VM-finalen? Båda måste stämma.",
    points: 3000,
    category: "turnering",
    inputType: "two-teams",
  },
  {
    id: "top_scorer",
    label: "Skyttekungen",
    description: "Vem toppar skytteligan i VM? Välj bland hundratals spelare.",
    points: 4000,
    category: "turnering",
    inputType: "player",
  },
  {
    id: "total_goals",
    label: "Totalt antal mål",
    description: "Hur många mål görs totalt i hela VM? (104 matcher)",
    points: 2000,
    category: "turnering",
    inputType: "number",
    bonusPoints: 1000, // ±2 = 1000p, ±5 = 500p
  },
  {
    id: "death_group",
    label: "Dödsgruppen",
    description: "Vilken grupp utses av media till turneringens dödsgrupp?",
    points: 1500,
    category: "turnering",
    inputType: "group",
  },
  {
    id: "most_red_cards",
    label: "Flest röda kort",
    description: "Vilket lag samlar på sig flest röda kort under hela VM?",
    points: 1000,
    category: "turnering",
    inputType: "team",
  },
];

export const KAOS_BETS: BetDef[] = [
  {
    id: "goalkeeper_goal",
    label: "En målvakt gör mål",
    description: "Händer det? Det har ALDRIG hänt i VM-historia. Men du kan tro på drömmar.",
    points: 10000,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "coach_sent_off",
    label: "Tränare utvisas från bänken",
    description: "Någon tränare tappar kontrollen helt och utvisas officiellt från avbytarbänken.",
    points: 10000,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "comeback_win",
    label: "Det omöjliga comebacket",
    description: "Ett lag vänder 0–3 och vinner i förlängning eller straffar — i ett knockout-möte.",
    points: 10000,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "final_penalty_miss",
    label: "Straffkaos i finalen",
    description: "Finalen avgörs på straffar OCH minst tre straffar missas totalt. Kaos garanterat.",
    points: 10000,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "sweden_final",
    label: "Sverige till VM-finalen",
    description: "Sverige. Final. VM 2026. Ja, du kan skratta — men om det händer är du legend för evigt.",
    points: 10000,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "knockout_hattrick",
    label: "Hattrick i ett slutspelsmöte",
    description: "Någon spelare gör tre mål i samma knockout-match (åttondel, kvart, semi eller final).",
    points: 10000,
    category: "kaos",
    inputType: "yesno",
  },
];

export const MATCH_BET_TYPES: BetDef[] = [
  {
    id: "match_result",
    label: "Matchresultat",
    description: "Hemmavinst (1) / Oavgjort (X) / Bortavinst (2)",
    points: 10,
    category: "match",
    inputType: "yesno", // handled specially as 3-way
  },
  {
    id: "exact_score",
    label: "Exakt slutresultat",
    description: "Gissa exakt slutresultat — power-ups ger stor boost!",
    points: 50,
    category: "match",
    inputType: "number",
  },
  {
    id: "first_scorer",
    label: "Första målskytt",
    description: "Vem gör matchens första mål?",
    points: 30,
    category: "match",
    inputType: "player",
  },
  {
    id: "red_card_shown",
    label: "Rött kort visas",
    description: "Visas något rött kort i matchen? (Direkt eller dubbla gult)",
    points: 15,
    category: "match",
    inputType: "yesno",
  },
  {
    id: "yellow_cards",
    label: "Antal gula kort",
    description: "Totalt antal gula kort i matchen (±1 = 4p, exakt = 8p)",
    points: 8,
    category: "match",
    inputType: "number",
  },
];

// WC 2026 groups A-L (48 teams, 12 groups of 4)
export const WC_GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export const POINTS_BREAKDOWN: Record<string, string> = {
  total_goals: "Exakt: 2 000p · ±2 mål: 1 000p · ±5 mål: 500p",
  yellow_cards: "Exakt: 8p · ±1 kort: 4p",
  exact_score: "Power-ups ger 2×, +600p bonus eller skyddspoäng",
};
