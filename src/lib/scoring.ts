import type { PowerupType } from "@/types/database";

// ---------------------------------------------------------------------------
// Core outcome helper
// ---------------------------------------------------------------------------

export function matchOutcome(
  home: number,
  away: number,
): "home" | "draw" | "away" {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

// ---------------------------------------------------------------------------
// Power-up modifier
// ---------------------------------------------------------------------------

/**
 * Apply power-up and shield modifiers to a raw point amount.
 *
 * @param pts       - Base points before power-up (0 if wrong, wager if correct).
 * @param correct   - Whether the bet was fully correct.
 * @param partial   - Whether a partial credit applies (e.g. taktikgeniet side
 *                    match or yellow_cards ±1). When true and wrong, the caller
 *                    passes pts = partial_amount; this flag lets forsakringen
 *                    know NOT to add another 50% on top.
 * @param powerUp   - The offensive power-up used (if any).
 * @param shield    - The shield used (if any, should be "forsakringen").
 */
export function applyPowerUps(
  pts: number,
  correct: boolean,
  partial: boolean,
  powerUp: PowerupType | null,
  shield: PowerupType | null,
): number {
  // Shield: forsakringen — 50% of wager back even if wrong.
  // Only applies when bet is fully wrong (not partial, not correct).
  // Partial credits already handled by each evaluator before this call.
  // We pass pts into this function as the pre-shield value so that partial
  // credit is already included; shield adds nothing extra on top of partials.

  let result = pts;

  // Apply offensive power-up first
  if (powerUp === "double_or_nothing") {
    result = correct ? pts * 2 : 0;
  } else if (powerUp === "sexpoangaren") {
    result = correct ? pts + 600 : 0;
  }
  // tidsmaskinen has no scoring modifier — it's a UI mechanic
  // taktikgeniet is handled inside evalMatchResult directly

  // Apply shield after offensive power-up
  if (shield === "forsakringen" && !correct && !partial) {
    // forsakringen: 50% of the original wager back.
    // At this point pts holds the pre-power-up wager (since offensive power-up
    // returned 0 for wrong). We use pts / 2 as the "original wager" — callers
    // pass wager as pts when the bet is wrong.
    // Actually, callers should pass wager (not 0) when wrong so forsakringen
    // can compute 50%. The power-up already set result=0; we restore half.
    // Re-read pts (the wager) to compute forsakringen amount:
    result = Math.floor(pts / 2);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Shared result type
// ---------------------------------------------------------------------------

export interface EvalResult {
  correct: boolean;
  pointsAwarded: number;
}

// ---------------------------------------------------------------------------
// Per-bet evaluators
// ---------------------------------------------------------------------------

/**
 * Evaluate a match_result bet.
 *
 * taktikgeniet special rule: award 50% of wager if:
 *   - The user picked a team to win (not draw) AND the actual outcome was a
 *     draw BUT the score difference was ≤1 (close game), OR
 *   - The actual outcome was a win but the user picked the correct winning
 *     side even though the actual outcome doesn't match (draw predicted by
 *     user, real outcome was home/away).
 *
 * Simpler interpretation used here (per spec):
 *   Give 50% wager if you picked either team to win (not draw) and the match
 *   was a 1-goal-difference game (or draw), regardless of whether you got the
 *   winning side right. This is a lenient "right side" interpretation.
 *
 * Spec says: "give 50% points if the match was a 1-goal-difference game and
 * the user picked either team to win (not draw)."
 */
export function evalMatchResult(
  betValue: unknown,
  homeScore: number,
  awayScore: number,
  wager: number,
  powerUp: PowerupType | null,
  shield: PowerupType | null,
): EvalResult {
  const v = betValue as Record<string, unknown> | null;
  const picked = v?.result as string | undefined;
  const actual = matchOutcome(homeScore, awayScore);
  const correct = picked === actual;

  if (correct) {
    let pts = wager;
    if (powerUp === "double_or_nothing") pts = pts * 2;
    else if (powerUp === "sexpoangaren") pts = pts + 600;
    // taktikgeniet on correct: no change (full points already)
    return { correct: true, pointsAwarded: pts };
  }

  // taktikgeniet partial: 50% if user picked a side (not draw) and goal
  // difference is ≤1 (includes draws — difference=0).
  if (powerUp === "taktikgeniet" && picked && picked !== "draw") {
    const diff = Math.abs(homeScore - awayScore);
    if (diff <= 1) {
      const partial = Math.floor(wager / 2);
      // forsakringen doesn't stack with taktikgeniet partial
      return { correct: false, pointsAwarded: partial };
    }
  }

  // Wrong: check shield
  if (shield === "forsakringen") {
    return { correct: false, pointsAwarded: Math.floor(wager / 2) };
  }

  return { correct: false, pointsAwarded: 0 };
}

/**
 * Evaluate an exact_score bet.
 * Correct outcome pays wager + bonusWager (typically 400p bonus).
 * There is no partial credit for exact_score.
 */
export function evalExactScore(
  betValue: unknown,
  homeScore: number,
  awayScore: number,
  wager: number,
  bonusWager: number,
  powerUp: PowerupType | null,
  shield: PowerupType | null,
): EvalResult {
  const v = betValue as Record<string, unknown> | null;
  const pickedHome = v?.home as number | undefined;
  const pickedAway = v?.away as number | undefined;

  const correct =
    pickedHome !== undefined &&
    pickedAway !== undefined &&
    pickedHome === homeScore &&
    pickedAway === awayScore;

  if (correct) {
    let pts = wager + bonusWager;
    if (powerUp === "double_or_nothing") pts = pts * 2;
    else if (powerUp === "sexpoangaren") pts = pts + 600;
    return { correct: true, pointsAwarded: pts };
  }

  if (shield === "forsakringen") {
    return { correct: false, pointsAwarded: Math.floor(wager / 2) };
  }

  return { correct: false, pointsAwarded: 0 };
}

/**
 * Evaluate a first_scorer bet.
 * "Ingen målskytt" is correct when homeScore===0 && awayScore===0, or
 * when firstScorer is null/empty (no one scored).
 */
export function evalFirstScorer(
  betValue: unknown,
  firstScorer: string | null | undefined,
  homeScore: number,
  awayScore: number,
  wager: number,
  powerUp: PowerupType | null,
  shield: PowerupType | null,
): EvalResult {
  const v = betValue as Record<string, unknown> | null;
  const picked = (v?.player as string | undefined) ?? "";

  const noGoal =
    (homeScore === 0 && awayScore === 0) ||
    !firstScorer ||
    firstScorer.trim() === "";

  let correct: boolean;
  if (picked === "Ingen målskytt" || picked === "") {
    correct = noGoal;
  } else {
    correct = !noGoal && picked === firstScorer;
  }

  if (correct) {
    let pts = wager;
    if (powerUp === "double_or_nothing") pts = pts * 2;
    else if (powerUp === "sexpoangaren") pts = pts + 600;
    return { correct: true, pointsAwarded: pts };
  }

  if (shield === "forsakringen") {
    return { correct: false, pointsAwarded: Math.floor(wager / 2) };
  }

  return { correct: false, pointsAwarded: 0 };
}

/**
 * Evaluate a both_teams_score bet.
 */
export function evalBothTeamsScore(
  betValue: unknown,
  homeScore: number,
  awayScore: number,
  wager: number,
  powerUp: PowerupType | null,
  shield: PowerupType | null,
): EvalResult {
  const v = betValue as Record<string, unknown> | null;
  const picked = v?.answer as boolean | undefined;
  const actual = homeScore > 0 && awayScore > 0;

  const correct = picked !== undefined && picked === actual;

  if (correct) {
    let pts = wager;
    if (powerUp === "double_or_nothing") pts = pts * 2;
    else if (powerUp === "sexpoangaren") pts = pts + 600;
    return { correct: true, pointsAwarded: pts };
  }

  if (shield === "forsakringen") {
    return { correct: false, pointsAwarded: Math.floor(wager / 2) };
  }

  return { correct: false, pointsAwarded: 0 };
}

/**
 * Evaluate a yellow_cards bet.
 * Exact = full wager (75p).
 * ±1   = half wager (40p, rounded down — but wager/2 = 37; spec says 40p
 *        which is the ±1 bonus value, not half of 75. Use 40 directly per
 *        spec: "±1=40p, exact=75p").
 * Anything else = 0.
 */
export function evalYellowCards(
  betValue: unknown,
  actualCards: number,
  wager: number,
  powerUp: PowerupType | null,
  shield: PowerupType | null,
): EvalResult {
  const v = betValue as Record<string, unknown> | null;
  const picked = v?.count as number | undefined;

  if (picked === undefined) {
    if (shield === "forsakringen") {
      return { correct: false, pointsAwarded: Math.floor(wager / 2) };
    }
    return { correct: false, pointsAwarded: 0 };
  }

  const diff = Math.abs(picked - actualCards);

  if (diff === 0) {
    // Exact
    let pts = wager;
    if (powerUp === "double_or_nothing") pts = pts * 2;
    else if (powerUp === "sexpoangaren") pts = pts + 600;
    return { correct: true, pointsAwarded: pts };
  }

  if (diff === 1) {
    // ±1: partial — 40p flat (per spec). Power-ups do not apply to partial.
    const partial = 40;
    return { correct: false, pointsAwarded: partial };
  }

  // Wrong
  if (shield === "forsakringen") {
    return { correct: false, pointsAwarded: Math.floor(wager / 2) };
  }

  return { correct: false, pointsAwarded: 0 };
}

// ---------------------------------------------------------------------------
// Potential score interface
// ---------------------------------------------------------------------------

export interface PotentialScore {
  /** Points already confirmed (is_correct = true/false, points_awarded set). */
  awarded: number;
  /** Locked bets not yet evaluated (assume all correct). */
  pending: number;
  /** Unplaced / remaining open potential (remaining matches × max per match +
   *  unplaced turnering/kaos bets). */
  open: number;
  /** awarded + pending + open */
  maxPossible: number;
}

/**
 * Maximum points a single match bet can yield (all 5 bet types, all correct
 * with the bonus on exact_score).
 *
 *   match_result:     200
 *   exact_score:      400 + 400 (bonus) = 800
 *   first_scorer:     300
 *   both_teams_score: 100
 *   yellow_cards:      75
 *   ─────────────────────
 *   Total:          1 475
 */
export const MAX_POINTS_PER_MATCH = 1475;
