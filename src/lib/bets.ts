import type { BetCategory } from "@/types/database";

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
    description: "Vilket land vinner VM 2026?",
    points: 500,
    category: "turnering",
    inputType: "team",
  },
  {
    id: "finalists",
    label: "Finalisterna",
    description: "Vilka två lag möts i finalen?",
    points: 200,
    category: "turnering",
    inputType: "two-teams",
  },
  {
    id: "top_scorer",
    label: "Skyttekungen",
    description: "Vem blir skyttekung i VM?",
    points: 300,
    category: "turnering",
    inputType: "player",
  },
  {
    id: "total_goals",
    label: "Totalt antal mål",
    description: "Hur många mål totalt i hela turneringen?",
    points: 400,
    category: "turnering",
    inputType: "number",
    bonusPoints: 200, // ±2 = 200p, ±5 = 100p
  },
  {
    id: "death_group",
    label: "Dödsgruppen",
    description: "Vilken grupp kallas 'dödsgruppen' av media?",
    points: 150,
    category: "turnering",
    inputType: "group",
  },
  {
    id: "most_red_cards",
    label: "Flest röda kort",
    description: "Vilket lag får flest röda kort i turneringen?",
    points: 200,
    category: "turnering",
    inputType: "team",
  },
];

export const KAOS_BETS: BetDef[] = [
  {
    id: "goalkeeper_goal",
    label: "En målvakt gör mål",
    description: "Gissar du att en målvakt gör ett mål under hela turneringen?",
    points: 400,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "coach_sent_off",
    label: "Tränare utvisas från bänken",
    description: "Blir någon tränare utvisad från avbytarbänken?",
    points: 250,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "comeback_win",
    label: "Comebacken",
    description: "Vänder ett lag från 0-2 och vinner? (Knockout-spel)",
    points: 300,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "final_penalty_miss",
    label: "Straffmiss i finalen",
    description: "Missar någon en straff i finalen?",
    points: 350,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "sweden_final",
    label: "Sverige går till final",
    description: "Tar sig Sverige till finalen i VM 2026?",
    points: 500,
    category: "kaos",
    inputType: "yesno",
  },
  {
    id: "most_crying",
    label: "Vem gråter mest på kameran?",
    description: "Välj den spelare som du tror gråter mest på kameran. Bara för skojs skull!",
    points: 100,
    category: "kaos",
    inputType: "player",
  },
];

export const MATCH_BET_TYPES: BetDef[] = [
  {
    id: "match_result",
    label: "Matchresultat",
    description: "Hemmavinst / Oavgjort / Bortavinst",
    points: 100,
    category: "match",
    inputType: "yesno", // handled specially as 3-way
  },
  {
    id: "exact_score",
    label: "Exakt slutresultat",
    description: "Gissa exakt slutresultat (+300p bonus om rätt)",
    points: 300,
    category: "match",
    inputType: "number",
  },
  {
    id: "first_scorer",
    label: "Första målskytt",
    description: "Vem gör det första målet?",
    points: 200,
    category: "match",
    inputType: "player",
  },
  {
    id: "both_teams_score",
    label: "Båda lagen gör mål",
    description: "Gissar du att båda lagen gör minst ett mål?",
    points: 80,
    category: "match",
    inputType: "yesno",
  },
  {
    id: "yellow_cards",
    label: "Antal gula kort",
    description: "Totalt antal gula kort i matchen (±1 = 25p, exakt = 50p)",
    points: 50,
    category: "match",
    inputType: "number",
  },
];

// WC 2026 groups A-L (48 teams, 12 groups of 4)
export const WC_GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export const POINTS_BREAKDOWN: Record<string, string> = {
  total_goals: "Exakt: 400p · ±2 mål: 200p · ±5 mål: 100p",
  yellow_cards: "Exakt: 50p · ±1 kort: 25p",
  exact_score: "+300p bonus om exakt rätt",
};
