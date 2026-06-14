// scripts/fixtures.ts
// WC 2026 — 72 group-stage fixtures, kickoff in UTC, teams in Swedish.
// All IDs aligned directly with football-data.org external identifiers.

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
    f(537327, "Mexiko", "Sydafrika", "2026-06-11T19:00:00Z", "A"),
    f(537328, "Sydkorea", "Tjeckien", "2026-06-12T02:00:00Z", "A"),
    f(537333, "Kanada", "Bosnien-Hercegovina", "2026-06-12T19:00:00Z", "B"),
    f(537348, "USA", "Paraguay", "2026-06-13T01:00:00Z", "D"),
    f(537334, "Qatar", "Schweiz", "2026-06-13T19:00:00Z", "B"),
    f(537339, "Brasilien", "Marocko", "2026-06-13T22:00:00Z", "C"),
    f(537340, "Haiti", "Skottland", "2026-06-14T01:00:00Z", "C"),
    f(537346, "Australien", "Turkiet", "2026-06-14T04:00:00Z", "D"),
    f(537351, "Tyskland", "Curaçao", "2026-06-14T17:00:00Z", "E"),
    f(537357, "Nederländerna", "Japan", "2026-06-14T20:00:00Z", "F"),
    f(537352, "Elfenbenskusten", "Ecuador", "2026-06-14T17:00:00Z", "E"),
    f(537358, "Sverige", "Tunisien", "2026-06-15T02:00:00Z", "F"),
    f(537369, "Spanien", "Kap Verde", "2026-06-15T16:00:00Z", "H"),
    f(537363, "Belgien", "Egypten", "2026-06-15T19:00:00Z", "G"),
    f(537370, "Saudiarabien", "Uruguay", "2026-06-15T22:00:00Z", "H"),
    f(537364, "Iran", "Nya Zeeland", "2026-06-16T01:00:00Z", "G"),
    f(537391, "Frankrike", "Senegal", "2026-06-16T19:00:00Z", "I"),
    f(537392, "Irak", "Norge", "2026-06-16T22:00:00Z", "I"),
    f(537397, "Argentina", "Algeriet", "2026-06-17T01:00:00Z", "J"),
    f(537398, "Österrike", "Jordanien", "2026-06-17T04:00:00Z", "J"),
    f(537410, "Ghana", "Panama", "2026-06-17T17:00:00Z", "L"),
    f(537411, "England", "Kroatien", "2026-06-17T20:00:00Z", "L"),
    f(537403, "Portugal", "DR Kongo", "2026-06-17T17:00:00Z", "K"),
    f(537404, "Uzbekistan", "Colombia", "2026-06-18T02:00:00Z", "K"),
    // ── Matchday 2 ──────────────────────────────────────────────────────────
    f(537329, "Tjeckien", "Sydafrika", "2026-06-18T16:00:00Z", "A"),
    f(537335, "Schweiz", "Bosnien-Hercegovina", "2026-06-18T19:00:00Z", "B"),
    f(537336, "Kanada", "Qatar", "2026-06-18T22:00:00Z", "B"),
    f(537330, "Mexiko", "Sydkorea", "2026-06-19T01:00:00Z", "A"),
    f(537449, "USA", "Australien", "2026-06-19T19:00:00Z", "D"),
    f(537342, "Skottland", "Marocko", "2026-06-19T22:00:00Z", "C"),
    f(537341, "Brasilien", "Haiti", "2026-06-20T01:00:00Z", "C"),
    f(537347, "Turkiet", "Paraguay", "2026-06-20T04:00:00Z", "D"),
    f(537353, "Tyskland", "Elfenbenskusten", "2026-06-20T17:00:00Z", "E"),
    f(537354, "Ecuador", "Curaçao", "2026-06-20T20:00:00Z", "E"),
    f(537359, "Nederländerna", "Sverige", "2026-06-20T17:00:00Z", "F"),
    f(537360, "Tunisien", "Japan", "2026-06-21T02:00:00Z", "F"),
    f(537371, "Spanien", "Saudiarabien", "2026-06-21T16:00:00Z", "H"),
    f(537365, "Belgien", "Iran", "2026-06-21T19:00:00Z", "G"),
    f(537372, "Uruguay", "Kap Verde", "2026-06-21T22:00:00Z", "H"),
    f(537366, "Nya Zeeland", "Egypten", "2026-06-22T01:00:00Z", "G"),
    f(537399, "Argentina", "Österrike", "2026-06-22T17:00:00Z", "J"),
    f(537393, "Frankrike", "Irak", "2026-06-22T21:00:00Z", "I"),
    f(537394, "Norge", "Senegal", "2026-06-23T00:00:00Z", "I"),
    f(537400, "Jordanien", "Algeriet", "2026-06-23T03:00:00Z", "J"),
    f(537412, "England", "Ghana", "2026-06-23T17:00:00Z", "L"),
    f(537413, "Panama", "Kroatien", "2026-06-23T20:00:00Z", "L"),
    f(537405, "Portugal", "Uzbekistan", "2026-06-23T17:00:00Z", "K"),
    f(537406, "Colombia", "DR Kongo", "2026-06-24T02:00:00Z", "K"),
    // ── Matchday 3 (concurrent pairs) ───────────────────────────────────────
    f(537337, "Schweiz", "Kanada", "2026-06-24T19:00:00Z", "B"),
    f(537338, "Bosnien-Hercegovina", "Qatar", "2026-06-24T19:00:00Z", "B"),
    f(537343, "Skottland", "Brasilien", "2026-06-24T22:00:00Z", "C"),
    f(537344, "Marocko", "Haiti", "2026-06-24T22:00:00Z", "C"),
    f(537331, "Tjeckien", "Mexiko", "2026-06-25T01:00:00Z", "A"),
    f(537332, "Sydafrika", "Sydkorea", "2026-06-25T01:00:00Z", "A"),
    f(537355, "Ecuador", "Tyskland", "2026-06-25T19:00:00Z", "E"),
    f(537356, "Curaçao", "Elfenbenskusten", "2026-06-25T19:00:00Z", "E"),
    f(537361, "Japan", "Sverige", "2026-06-25T22:00:00Z", "F"),
    f(537362, "Tunisien", "Nederländerna", "2026-06-25T22:00:00Z", "F"),
    f(537350, "Turkiet", "USA", "2026-06-26T01:00:00Z", "D"),
    f(537345, "Paraguay", "Australien", "2026-06-26T01:00:00Z", "D"),
    f(537395, "Norge", "Frankrike", "2026-06-26T19:00:00Z", "I"),
    f(537396, "Senegal", "Irak", "2026-06-26T19:00:00Z", "I"),
    f(537373, "Kap Verde", "Saudiarabien", "2026-06-27T00:00:00Z", "H"),
    f(537374, "Uruguay", "Spanien", "2026-06-27T00:00:00Z", "H"),
    f(537367, "Egypten", "Iran", "2026-06-27T03:00:00Z", "G"),
    f(537368, "Nya Zeeland", "Belgien", "2026-06-27T03:00:00Z", "G"),
    f(537414, "Panama", "England", "2026-06-27T22:00:00Z", "L"),
    f(537415, "Kroatien", "Ghana", "2026-06-27T22:00:00Z", "L"),
    f(537407, "Colombia", "Portugal", "2026-06-28T00:30:00Z", "K"),
    f(537408, "DR Kongo", "Uzbekistan", "2026-06-28T00:30:00Z", "K"),
    f(537401, "Algeriet", "Österrike", "2026-06-28T03:00:00Z", "J"),
    f(537402, "Jordanien", "Argentina", "2026-06-28T03:00:00Z", "J"),
  ];
}