import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

function require(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

export const supabase = createClient(
  require("NEXT_PUBLIC_SUPABASE_URL"),
  require("SUPABASE_SERVICE_ROLE_KEY"),
);

export const FOOTBALL_DATA_KEY = require("FOOTBALL_DATA_API_KEY");
export const FDO_BASE = "https://api.football-data.org/v4";

export async function fdoFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${FDO_BASE}${path}`, {
    headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data.org ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// English → Swedish team name mapping for all 48 WC 2026 nations
export const EN_TO_SV: Record<string, string> = {
  France: "Frankrike",
  Germany: "Tyskland",
  Spain: "Spanien",
  Netherlands: "Nederländerna",
  Brazil: "Brasilien",
  Mexico: "Mexiko",
  Canada: "Kanada",
  "Saudi Arabia": "Saudiarabien",
  "South Korea": "Sydkorea",
  Australia: "Australien",
  "New Zealand": "Nya Zeeland",
  Morocco: "Marocko",
  "Ivory Coast": "Elfenbenskusten",
  Egypt: "Egypten",
  Cameroon: "Kamerun",
  Tunisia: "Tunisien",
  Algeria: "Algeriet",
  Switzerland: "Schweiz",
  Austria: "Österrike",
  Poland: "Polen",
  Turkey: "Turkiet",
  Serbia: "Serbien",
  Scotland: "Skottland",
  Croatia: "Kroatien",
  Denmark: "Danmark",
  Belgium: "Belgien",
  Italy: "Italien",
  Venezuela: "Venezuela",
  Sweden: "Sverige",
  Japan: "Japan",
  Qatar: "Qatar",
  Iraq: "Irak",
  Iran: "Iran",
  // Names that match already (included for completeness)
  USA: "USA",
  England: "England",
  Portugal: "Portugal",
  Argentina: "Argentina",
  Colombia: "Colombia",
  Ecuador: "Ecuador",
  Uruguay: "Uruguay",
  Senegal: "Senegal",
  Nigeria: "Nigeria",
  Ghana: "Ghana",
  Honduras: "Honduras",
  Panama: "Panama",
  "Costa Rica": "Costa Rica",
  Uzbekistan: "Uzbekistan",
  "United States": "USA",
};

export function toSwedish(name: string): string {
  return EN_TO_SV[name] ?? name;
}

export function mapStatus(s: string): "scheduled" | "live" | "finished" | "postponed" {
  switch (s) {
    case "FINISHED":             return "finished";
    case "IN_PLAY":
    case "PAUSED":
    case "EXTRA_TIME":
    case "PENALTY_SHOOTOUT":     return "live";
    case "POSTPONED":
    case "CANCELLED":
    case "SUSPENDED":            return "postponed";
    default:                     return "scheduled";
  }
}

export function mapStage(stage: string, group: string | null) {
  const map: Record<string, string> = {
    GROUP_STAGE:    "Gruppspel",
    ROUND_OF_32:    "Omgång 32",   // WC 2026 new round (48 teams)
    LAST_32:        "Omgång 32",   // alternate API key
    LAST_16:        "Åttondelsfinaler",
    QUARTER_FINALS: "Kvartsfinaler",
    SEMI_FINALS:    "Semifinaler",
    THIRD_PLACE:    "Bronsmatch",
    FINAL:          "Final",
  };
  return {
    stage:      map[stage] ?? stage,
    group_name: group ? group.replace("GROUP_", "") : null,
  };
}
