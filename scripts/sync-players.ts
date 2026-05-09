/**
 * Fetches WC 2026 squad data from football-data.org and updates src/lib/teams.ts.
 * Run once squads are registered (~late May / early June 2026).
 * Usage: npm run sync:players
 */
import { fdoFetch } from "./_client.js";
import { writeFileSync } from "fs";
import { resolve } from "path";

interface FdoPlayer {
  name: string;
  position: string;
  nationality: string;
}

interface FdoTeam {
  id: number;
  name: string;
  squad: FdoPlayer[];
}

interface FdoTeamsResponse {
  teams: FdoTeam[];
}

async function main() {
  console.log("Fetching WC 2026 squad data from football-data.org...");

  const data = await fdoFetch<FdoTeamsResponse>("/competitions/WC/teams?season=2026");
  const teams = data.teams;

  console.log(`  Got ${teams.length} teams`);

  const allPlayers = new Set<string>();
  for (const team of teams) {
    if (!team.squad?.length) {
      console.warn(`  ${team.name}: no squad data yet`);
      continue;
    }
    for (const player of team.squad) {
      if (player.name) allPlayers.add(player.name);
    }
  }

  if (allPlayers.size < 50) {
    console.warn(
      `Only ${allPlayers.size} players found — squads may not be registered yet.` +
      "\nSkipping file update to avoid overwriting the curated list."
    );
    return;
  }

  const sorted = [...allPlayers].sort((a, b) => a.localeCompare(b, "sv"));

  console.log(`  ${sorted.length} players across ${teams.filter((t) => t.squad?.length).length} teams`);

  const teamsContent = readCurrentTeamsFile();
  const newPlayersBlock = buildPlayersBlock(sorted);
  const updated = replacePlayersBlock(teamsContent, newPlayersBlock);

  const outPath = resolve(process.cwd(), "src/lib/teams.ts");
  writeFileSync(outPath, updated, "utf-8");
  console.log(`Updated src/lib/teams.ts with ${sorted.length} players.`);
  console.log("Run `npm run build` to verify.");
}

function readCurrentTeamsFile(): string {
  const { readFileSync } = require("fs") as typeof import("fs");
  return readFileSync(resolve(process.cwd(), "src/lib/teams.ts"), "utf-8");
}

function buildPlayersBlock(players: string[]): string {
  const lines = players.map((p) => `  "${p}",`).join("\n");
  return `// FIFA API integration point: this list is generated from /v4/competitions/WC/teams squad data.\n// Re-run \`npm run sync:players\` to refresh when squads change.\nexport const FAMOUS_PLAYERS = [\n${lines}\n].sort((a, b) => a.localeCompare(b, "sv"));\n`;
}

function replacePlayersBlock(source: string, replacement: string): string {
  // Replace from the FIFA API comment down to the closing ]; of FAMOUS_PLAYERS
  const startMarker = "// FIFA API integration point:";
  const start = source.indexOf(startMarker);
  if (start === -1) {
    // Fallback: replace FAMOUS_PLAYERS export entirely
    return source.replace(
      /export const FAMOUS_PLAYERS[\s\S]+?\]\s*\.sort[\s\S]+?;/,
      replacement
    );
  }
  // Find the end of the FAMOUS_PLAYERS block (the .sort(...); line after the array)
  const end = source.indexOf(".sort(", start);
  const closingSemi = source.indexOf(";", end) + 1;
  return source.slice(0, start) + replacement + source.slice(closingSemi + 1);
}

main().catch(console.error);
