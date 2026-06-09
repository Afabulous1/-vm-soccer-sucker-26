// WC 2026 — 72 group-stage fixtures, kickoff in UTC, teams in Swedish.
// Source: official CEST schedule (CEST = UTC+2).
// Two label errors in the source corrected:
//   match 29 (USA vs Australien) is Group D, not C
//   match 31 (Brasilien vs Haiti)  is Group C, not D

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
  const f = (
    id: number, home: string, away: string, utc: string, group: string,
  ): FixtureRow => ({
    external_id: id,
    home_team: home,
    away_team: away,
    kickoff_at: utc,
    stage: "group_stage",
    group_name: group,
    status: "scheduled",
    home_score: null,
    away_score: null,
  });

  return [
    // ── Matchday 1 ──────────────────────────────────────────────────────────
    f( 1, "Mexiko",              "Sydafrika",           "2026-06-11T19:00:00Z", "A"),
    f( 2, "Sydkorea",            "Tjeckien",            "2026-06-12T02:00:00Z", "A"),
    f( 3, "Kanada",              "Bosnien-Hercegovina", "2026-06-12T19:00:00Z", "B"),
    f( 4, "USA",                 "Paraguay",            "2026-06-13T01:00:00Z", "D"),
    f( 5, "Qatar",               "Schweiz",             "2026-06-13T19:00:00Z", "B"),
    f( 6, "Brasilien",           "Marocko",             "2026-06-13T22:00:00Z", "C"),
    f( 7, "Haiti",               "Skottland",           "2026-06-14T01:00:00Z", "C"),
    f( 8, "Australien",          "Turkiet",             "2026-06-14T04:00:00Z", "D"),
    f( 9, "Tyskland",            "Curaçao",             "2026-06-14T17:00:00Z", "E"),
    f(10, "Nederländerna",       "Japan",               "2026-06-14T20:00:00Z", "F"),
    f(11, "Elfenbenskusten",     "Ecuador",             "2026-06-14T23:00:00Z", "E"),
    f(12, "Sverige",             "Tunisien",            "2026-06-15T02:00:00Z", "F"),
    f(13, "Spanien",             "Kap Verde",           "2026-06-15T16:00:00Z", "H"),
    f(14, "Belgien",             "Egypten",             "2026-06-15T19:00:00Z", "G"),
    f(15, "Saudiarabien",        "Uruguay",             "2026-06-15T22:00:00Z", "H"),
    f(16, "Iran",                "Nya Zeeland",         "2026-06-16T01:00:00Z", "G"),
    f(17, "Frankrike",           "Senegal",             "2026-06-16T19:00:00Z", "I"),
    f(18, "Irak",                "Norge",               "2026-06-16T22:00:00Z", "I"),
    f(19, "Argentina",           "Algeriet",            "2026-06-17T01:00:00Z", "J"),
    f(20, "Österrike",           "Jordanien",           "2026-06-17T04:00:00Z", "J"),
    f(21, "Ghana",               "Panama",              "2026-06-17T17:00:00Z", "L"),
    f(22, "England",             "Kroatien",            "2026-06-17T20:00:00Z", "L"),
    f(23, "Portugal",            "DR Kongo",            "2026-06-17T23:00:00Z", "K"),
    f(24, "Uzbekistan",          "Colombia",            "2026-06-18T02:00:00Z", "K"),
    // ── Matchday 2 ──────────────────────────────────────────────────────────
    f(25, "Tjeckien",            "Sydafrika",           "2026-06-18T16:00:00Z", "A"),
    f(26, "Schweiz",             "Bosnien-Hercegovina", "2026-06-18T19:00:00Z", "B"),
    f(27, "Kanada",              "Qatar",               "2026-06-18T22:00:00Z", "B"),
    f(28, "Mexiko",              "Sydkorea",            "2026-06-19T01:00:00Z", "A"),
    f(29, "USA",                 "Australien",          "2026-06-19T19:00:00Z", "D"),
    f(30, "Skottland",           "Marocko",             "2026-06-19T22:00:00Z", "C"),
    f(31, "Brasilien",           "Haiti",               "2026-06-20T01:00:00Z", "C"),
    f(32, "Turkiet",             "Paraguay",            "2026-06-20T04:00:00Z", "D"),
    f(33, "Tyskland",            "Elfenbenskusten",     "2026-06-20T17:00:00Z", "E"),
    f(34, "Ecuador",             "Curaçao",             "2026-06-20T20:00:00Z", "E"),
    f(35, "Nederländerna",       "Sverige",             "2026-06-20T23:00:00Z", "F"),
    f(36, "Tunisien",            "Japan",               "2026-06-21T02:00:00Z", "F"),
    f(37, "Spanien",             "Saudiarabien",        "2026-06-21T16:00:00Z", "H"),
    f(38, "Belgien",             "Iran",                "2026-06-21T19:00:00Z", "G"),
    f(39, "Uruguay",             "Kap Verde",           "2026-06-21T22:00:00Z", "H"),
    f(40, "Nya Zeeland",         "Egypten",             "2026-06-22T01:00:00Z", "G"),
    f(41, "Argentina",           "Österrike",           "2026-06-22T17:00:00Z", "J"),
    f(42, "Frankrike",           "Irak",                "2026-06-22T21:00:00Z", "I"),
    f(43, "Norge",               "Senegal",             "2026-06-23T00:00:00Z", "I"),
    f(44, "Jordanien",           "Algeriet",            "2026-06-23T03:00:00Z", "J"),
    f(45, "England",             "Ghana",               "2026-06-23T17:00:00Z", "L"),
    f(46, "Panama",              "Kroatien",            "2026-06-23T20:00:00Z", "L"),
    f(47, "Portugal",            "Uzbekistan",          "2026-06-23T23:00:00Z", "K"),
    f(48, "Colombia",            "DR Kongo",            "2026-06-24T02:00:00Z", "K"),
    // ── Matchday 3 (concurrent pairs) ───────────────────────────────────────
    f(49, "Schweiz",             "Kanada",              "2026-06-24T19:00:00Z", "B"),
    f(50, "Bosnien-Hercegovina", "Qatar",               "2026-06-24T19:00:00Z", "B"),
    f(51, "Skottland",           "Brasilien",           "2026-06-24T22:00:00Z", "C"),
    f(52, "Marocko",             "Haiti",               "2026-06-24T22:00:00Z", "C"),
    f(53, "Tjeckien",            "Mexiko",              "2026-06-25T01:00:00Z", "A"),
    f(54, "Sydafrika",           "Sydkorea",            "2026-06-25T01:00:00Z", "A"),
    f(55, "Ecuador",             "Tyskland",            "2026-06-25T19:00:00Z", "E"),
    f(56, "Curaçao",             "Elfenbenskusten",     "2026-06-25T19:00:00Z", "E"),
    f(57, "Japan",               "Sverige",             "2026-06-25T22:00:00Z", "F"),
    f(58, "Tunisien",            "Nederländerna",       "2026-06-25T22:00:00Z", "F"),
    f(59, "Turkiet",             "USA",                 "2026-06-26T01:00:00Z", "D"),
    f(60, "Paraguay",            "Australien",          "2026-06-26T01:00:00Z", "D"),
    f(61, "Norge",               "Frankrike",           "2026-06-26T19:00:00Z", "I"),
    f(62, "Senegal",             "Irak",                "2026-06-26T19:00:00Z", "I"),
    f(63, "Kap Verde",           "Saudiarabien",        "2026-06-27T00:00:00Z", "H"),
    f(64, "Uruguay",             "Spanien",             "2026-06-27T00:00:00Z", "H"),
    f(65, "Egypten",             "Iran",                "2026-06-27T03:00:00Z", "G"),
    f(66, "Nya Zeeland",         "Belgien",             "2026-06-27T03:00:00Z", "G"),
    f(67, "Panama",              "England",             "2026-06-27T22:00:00Z", "L"),
    f(68, "Kroatien",            "Ghana",               "2026-06-27T22:00:00Z", "L"),
    f(69, "Colombia",            "Portugal",            "2026-06-28T00:30:00Z", "K"),
    f(70, "DR Kongo",            "Uzbekistan",          "2026-06-28T00:30:00Z", "K"),
    f(71, "Algeriet",            "Österrike",           "2026-06-28T03:00:00Z", "J"),
    f(72, "Jordanien",           "Argentina",           "2026-06-28T03:00:00Z", "J"),
  ];
}
