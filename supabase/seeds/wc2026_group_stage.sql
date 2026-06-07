-- WC 2026 — All 72 group stage fixtures
-- Run once in Supabase SQL Editor (or on every deploy; it's idempotent).
-- External IDs 101–172  ·  12 groups × 6 matches  ·  kickoffs in UTC

INSERT INTO public.matches
  (external_id, home_team, away_team, kickoff_at, stage, group_name, status, updated_at)
VALUES
  -- ── Group A: Mexiko · Sydkorea · Sydafrika · Tjeckien ─────────────────
  (101, 'Mexiko',    'Sydkorea',  '2026-06-11T18:00:00Z', 'group_stage', 'A', 'scheduled', now()),
  (102, 'Sydafrika', 'Tjeckien',  '2026-06-11T21:00:00Z', 'group_stage', 'A', 'scheduled', now()),
  (103, 'Mexiko',    'Sydafrika', '2026-06-17T18:00:00Z', 'group_stage', 'A', 'scheduled', now()),
  (104, 'Sydkorea',  'Tjeckien',  '2026-06-17T21:00:00Z', 'group_stage', 'A', 'scheduled', now()),
  (105, 'Mexiko',    'Tjeckien',  '2026-06-25T20:00:00Z', 'group_stage', 'A', 'scheduled', now()),
  (106, 'Sydkorea',  'Sydafrika', '2026-06-25T20:00:00Z', 'group_stage', 'A', 'scheduled', now()),

  -- ── Group B: Kanada · Schweiz · Qatar · Bosnien-Hercegovina ───────────
  (107, 'Kanada',              'Schweiz',             '2026-06-12T18:00:00Z', 'group_stage', 'B', 'scheduled', now()),
  (108, 'Qatar',               'Bosnien-Hercegovina', '2026-06-12T21:00:00Z', 'group_stage', 'B', 'scheduled', now()),
  (109, 'Kanada',              'Qatar',               '2026-06-17T18:00:00Z', 'group_stage', 'B', 'scheduled', now()),
  (110, 'Schweiz',             'Bosnien-Hercegovina', '2026-06-17T21:00:00Z', 'group_stage', 'B', 'scheduled', now()),
  (111, 'Kanada',              'Bosnien-Hercegovina', '2026-06-25T20:00:00Z', 'group_stage', 'B', 'scheduled', now()),
  (112, 'Schweiz',             'Qatar',               '2026-06-25T20:00:00Z', 'group_stage', 'B', 'scheduled', now()),

  -- ── Group C: Brasilien · Marocko · Skottland · Haiti ──────────────────
  (113, 'Brasilien', 'Marocko',   '2026-06-12T18:00:00Z', 'group_stage', 'C', 'scheduled', now()),
  (114, 'Skottland', 'Haiti',     '2026-06-12T21:00:00Z', 'group_stage', 'C', 'scheduled', now()),
  (115, 'Brasilien', 'Skottland', '2026-06-18T18:00:00Z', 'group_stage', 'C', 'scheduled', now()),
  (116, 'Marocko',   'Haiti',     '2026-06-18T21:00:00Z', 'group_stage', 'C', 'scheduled', now()),
  (117, 'Brasilien', 'Haiti',     '2026-06-26T20:00:00Z', 'group_stage', 'C', 'scheduled', now()),
  (118, 'Marocko',   'Skottland', '2026-06-26T20:00:00Z', 'group_stage', 'C', 'scheduled', now()),

  -- ── Group D: USA · Australien · Paraguay · Turkiet ────────────────────
  (119, 'USA',        'Australien', '2026-06-13T18:00:00Z', 'group_stage', 'D', 'scheduled', now()),
  (120, 'Paraguay',   'Turkiet',    '2026-06-13T21:00:00Z', 'group_stage', 'D', 'scheduled', now()),
  (121, 'USA',        'Paraguay',   '2026-06-18T18:00:00Z', 'group_stage', 'D', 'scheduled', now()),
  (122, 'Australien', 'Turkiet',    '2026-06-18T21:00:00Z', 'group_stage', 'D', 'scheduled', now()),
  (123, 'USA',        'Turkiet',    '2026-06-26T20:00:00Z', 'group_stage', 'D', 'scheduled', now()),
  (124, 'Australien', 'Paraguay',   '2026-06-26T20:00:00Z', 'group_stage', 'D', 'scheduled', now()),

  -- ── Group E: Tyskland · Ecuador · Elfenbenskusten · Curaçao ───────────
  (125, 'Tyskland',        'Ecuador',          '2026-06-13T18:00:00Z', 'group_stage', 'E', 'scheduled', now()),
  (126, 'Elfenbenskusten', 'Curaçao',          '2026-06-13T21:00:00Z', 'group_stage', 'E', 'scheduled', now()),
  (127, 'Tyskland',        'Elfenbenskusten',  '2026-06-19T18:00:00Z', 'group_stage', 'E', 'scheduled', now()),
  (128, 'Ecuador',         'Curaçao',          '2026-06-19T21:00:00Z', 'group_stage', 'E', 'scheduled', now()),
  (129, 'Tyskland',        'Curaçao',          '2026-06-26T20:00:00Z', 'group_stage', 'E', 'scheduled', now()),
  (130, 'Ecuador',         'Elfenbenskusten',  '2026-06-26T20:00:00Z', 'group_stage', 'E', 'scheduled', now()),

  -- ── Group F: Nederländerna · Japan · Sverige · Tunisien ───────────────
  (131, 'Nederländerna', 'Japan',    '2026-06-14T18:00:00Z', 'group_stage', 'F', 'scheduled', now()),
  (132, 'Sverige',       'Tunisien', '2026-06-14T21:00:00Z', 'group_stage', 'F', 'scheduled', now()),
  (133, 'Nederländerna', 'Sverige',  '2026-06-19T18:00:00Z', 'group_stage', 'F', 'scheduled', now()),
  (134, 'Japan',         'Tunisien', '2026-06-19T21:00:00Z', 'group_stage', 'F', 'scheduled', now()),
  (135, 'Nederländerna', 'Tunisien', '2026-06-27T20:00:00Z', 'group_stage', 'F', 'scheduled', now()),
  (136, 'Japan',         'Sverige',  '2026-06-27T20:00:00Z', 'group_stage', 'F', 'scheduled', now()),

  -- ── Group G: Belgien · Iran · Egypten · Nya Zeeland ──────────────────
  (137, 'Belgien', 'Iran',       '2026-06-14T18:00:00Z', 'group_stage', 'G', 'scheduled', now()),
  (138, 'Egypten', 'Nya Zeeland','2026-06-14T21:00:00Z', 'group_stage', 'G', 'scheduled', now()),
  (139, 'Belgien', 'Egypten',    '2026-06-20T18:00:00Z', 'group_stage', 'G', 'scheduled', now()),
  (140, 'Iran',    'Nya Zeeland','2026-06-20T21:00:00Z', 'group_stage', 'G', 'scheduled', now()),
  (141, 'Belgien', 'Nya Zeeland','2026-06-27T20:00:00Z', 'group_stage', 'G', 'scheduled', now()),
  (142, 'Iran',    'Egypten',    '2026-06-27T20:00:00Z', 'group_stage', 'G', 'scheduled', now()),

  -- ── Group H: Spanien · Uruguay · Saudiarabien · Kap Verde ─────────────
  (143, 'Spanien',      'Uruguay',      '2026-06-15T18:00:00Z', 'group_stage', 'H', 'scheduled', now()),
  (144, 'Saudiarabien', 'Kap Verde',    '2026-06-15T21:00:00Z', 'group_stage', 'H', 'scheduled', now()),
  (145, 'Spanien',      'Saudiarabien', '2026-06-20T18:00:00Z', 'group_stage', 'H', 'scheduled', now()),
  (146, 'Uruguay',      'Kap Verde',    '2026-06-20T21:00:00Z', 'group_stage', 'H', 'scheduled', now()),
  (147, 'Spanien',      'Kap Verde',    '2026-06-27T20:00:00Z', 'group_stage', 'H', 'scheduled', now()),
  (148, 'Uruguay',      'Saudiarabien', '2026-06-27T20:00:00Z', 'group_stage', 'H', 'scheduled', now()),

  -- ── Group I: Frankrike · Senegal · Norge · Irak ───────────────────────
  (149, 'Frankrike', 'Senegal', '2026-06-15T18:00:00Z', 'group_stage', 'I', 'scheduled', now()),
  (150, 'Norge',     'Irak',    '2026-06-15T21:00:00Z', 'group_stage', 'I', 'scheduled', now()),
  (151, 'Frankrike', 'Norge',   '2026-06-21T18:00:00Z', 'group_stage', 'I', 'scheduled', now()),
  (152, 'Senegal',   'Irak',    '2026-06-21T21:00:00Z', 'group_stage', 'I', 'scheduled', now()),
  (153, 'Frankrike', 'Irak',    '2026-06-26T20:00:00Z', 'group_stage', 'I', 'scheduled', now()),
  (154, 'Senegal',   'Norge',   '2026-06-26T20:00:00Z', 'group_stage', 'I', 'scheduled', now()),

  -- ── Group J: Argentina · Österrike · Algeriet · Jordanien ────────────
  (155, 'Argentina', 'Österrike', '2026-06-11T15:00:00Z', 'group_stage', 'J', 'scheduled', now()),
  (156, 'Algeriet',  'Jordanien', '2026-06-11T19:00:00Z', 'group_stage', 'J', 'scheduled', now()),
  (157, 'Argentina', 'Algeriet',  '2026-06-17T15:00:00Z', 'group_stage', 'J', 'scheduled', now()),
  (158, 'Österrike', 'Jordanien', '2026-06-17T19:00:00Z', 'group_stage', 'J', 'scheduled', now()),
  (159, 'Argentina', 'Jordanien', '2026-06-25T16:00:00Z', 'group_stage', 'J', 'scheduled', now()),
  (160, 'Österrike', 'Algeriet',  '2026-06-25T16:00:00Z', 'group_stage', 'J', 'scheduled', now()),

  -- ── Group K: Portugal · Colombia · Uzbekistan · DR Kongo ─────────────
  (161, 'Portugal',  'Colombia',   '2026-06-12T15:00:00Z', 'group_stage', 'K', 'scheduled', now()),
  (162, 'Uzbekistan','DR Kongo',   '2026-06-12T19:00:00Z', 'group_stage', 'K', 'scheduled', now()),
  (163, 'Portugal',  'Uzbekistan', '2026-06-18T15:00:00Z', 'group_stage', 'K', 'scheduled', now()),
  (164, 'Colombia',  'DR Kongo',   '2026-06-18T19:00:00Z', 'group_stage', 'K', 'scheduled', now()),
  (165, 'Portugal',  'DR Kongo',   '2026-06-26T16:00:00Z', 'group_stage', 'K', 'scheduled', now()),
  (166, 'Colombia',  'Uzbekistan', '2026-06-26T16:00:00Z', 'group_stage', 'K', 'scheduled', now()),

  -- ── Group L: England · Kroatien · Panama · Ghana ─────────────────────
  (167, 'England',  'Kroatien', '2026-06-13T15:00:00Z', 'group_stage', 'L', 'scheduled', now()),
  (168, 'Panama',   'Ghana',    '2026-06-13T19:00:00Z', 'group_stage', 'L', 'scheduled', now()),
  (169, 'England',  'Panama',   '2026-06-19T15:00:00Z', 'group_stage', 'L', 'scheduled', now()),
  (170, 'Kroatien', 'Ghana',    '2026-06-19T19:00:00Z', 'group_stage', 'L', 'scheduled', now()),
  (171, 'England',  'Ghana',    '2026-06-27T16:00:00Z', 'group_stage', 'L', 'scheduled', now()),
  (172, 'Kroatien', 'Panama',   '2026-06-27T16:00:00Z', 'group_stage', 'L', 'scheduled', now())

ON CONFLICT (external_id) DO UPDATE SET
  home_team  = EXCLUDED.home_team,
  away_team  = EXCLUDED.away_team,
  kickoff_at = EXCLUDED.kickoff_at,
  stage      = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  status     = CASE WHEN matches.status = 'scheduled' THEN 'scheduled' ELSE matches.status END,
  updated_at = now();
