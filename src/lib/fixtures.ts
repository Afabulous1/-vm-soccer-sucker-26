import { WC_GROUPS_DATA } from "@/lib/teams";

// MD dates per group index 0=A … 11=L
const MD_DATES = [
  { md1: "2026-06-11", md2: "2026-06-17", md3: "2026-06-25" }, // A
  { md1: "2026-06-12", md2: "2026-06-17", md3: "2026-06-25" }, // B
  { md1: "2026-06-12", md2: "2026-06-18", md3: "2026-06-26" }, // C
  { md1: "2026-06-13", md2: "2026-06-18", md3: "2026-06-26" }, // D
  { md1: "2026-06-13", md2: "2026-06-19", md3: "2026-06-26" }, // E
  { md1: "2026-06-14", md2: "2026-06-19", md3: "2026-06-27" }, // F
  { md1: "2026-06-14", md2: "2026-06-20", md3: "2026-06-27" }, // G
  { md1: "2026-06-15", md2: "2026-06-20", md3: "2026-06-27" }, // H
  { md1: "2026-06-15", md2: "2026-06-21", md3: "2026-06-26" }, // I
  { md1: "2026-06-11", md2: "2026-06-17", md3: "2026-06-25" }, // J
  { md1: "2026-06-12", md2: "2026-06-18", md3: "2026-06-26" }, // K
  { md1: "2026-06-13", md2: "2026-06-19", md3: "2026-06-27" }, // L
];

export interface FixtureRow {
  external_id: number;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  stage: string;
  group_name: string;
  status: string;
  home_score: null;
  away_score: null;
}

export function buildGroupStageFixtures(): FixtureRow[] {
  const fixtures: FixtureRow[] = [];
  let id = 101;
  for (let gi = 0; gi < WC_GROUPS_DATA.length; gi++) {
    const { group, teams } = WC_GROUPS_DATA[gi];
    const t = teams.map((x) => x.name);
    const d = MD_DATES[gi];
    // MD1
    fixtures.push({ external_id: id++, home_team: t[0], away_team: t[1], kickoff_at: `${d.md1}T18:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    fixtures.push({ external_id: id++, home_team: t[2], away_team: t[3], kickoff_at: `${d.md1}T21:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    // MD2
    fixtures.push({ external_id: id++, home_team: t[0], away_team: t[2], kickoff_at: `${d.md2}T18:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    fixtures.push({ external_id: id++, home_team: t[1], away_team: t[3], kickoff_at: `${d.md2}T21:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    // MD3 (concurrent)
    fixtures.push({ external_id: id++, home_team: t[0], away_team: t[3], kickoff_at: `${d.md3}T20:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
    fixtures.push({ external_id: id++, home_team: t[1], away_team: t[2], kickoff_at: `${d.md3}T20:00:00Z`, stage: "group_stage", group_name: group, status: "scheduled", home_score: null, away_score: null });
  }
  return fixtures;
}
