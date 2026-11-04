/**
 * Game review: turns per-position engine scores into move classifications,
 * accuracy figures and an evaluation curve.
 *
 * Conventions: `scores[k]` is the engine score of the position after k plies,
 * from the point of view of the side to move in that position.
 */
import { BLACK, type Color, type Move, Position, WHITE } from "./position.ts";
import { MATE, Searcher } from "./search.ts";

export type Classification =
  | "best"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export const CLASS_INFO: Record<
  Classification,
  { label: string; symbol: string }
> = {
  best: { label: "Best move", symbol: "★" },
  good: { label: "Good", symbol: "" },
  inaccuracy: { label: "Inaccuracy", symbol: "?!" },
  mistake: { label: "Mistake", symbol: "?" },
  blunder: { label: "Blunder", symbol: "??" },
};

/** Clamp mate scores to a large but finite centipawn value. */
export function toCentipawns(score: number): number {
  if (score > MATE - 1000) return 4000;
  if (score < -MATE + 1000) return -4000;
  return score;
}

/** Expected score (0..1) for the side the score belongs to. */
export function winChance(score: number): number {
  return 1 / (1 + Math.exp(-0.0035 * toCentipawns(score)));
}

/** Classifies a move by the drop in the mover's win chance (in percent). */
export function classify(drop: number, isBest: boolean): Classification {
  if (isBest || drop < 2) return "best";
  if (drop < 6) return "good";
  if (drop < 12) return "inaccuracy";
  if (drop < 22) return "mistake";
  return "blunder";
}

/** Per-move accuracy (0..100) from the win-chance drop, in percent. */
export function moveAccuracy(drop: number): number {
  const a = 103.1668 * Math.exp(-0.04354 * drop) - 3.1669;
  return Math.max(0, Math.min(100, a));
}

export interface MoveReview {
  ply: number; // index of the move in the game (0-based)
  color: Color;
  played: Move;
  best: Move;
  /** Score before the move, mover's perspective. */
  before: number;
  /** Score after the move, mover's perspective. */
  after: number;
  drop: number;
  classification: Classification;
}

/** Reviews every move whose before/after scores are both known. */
export function reviewMoves(
  moves: Move[],
  scores: (number | null)[],
  best: (Move | null)[],
): MoveReview[] {
  const out: MoveReview[] = [];
  for (let i = 0; i < moves.length; i++) {
    const sb = scores[i];
    const sa = scores[i + 1];
    if (sb == null || sa == null) break;
    const before = sb;
    const after = -sa;
    const drop = Math.max(0, (winChance(before) - winChance(after)) * 100);
    const isBest = best[i] === moves[i];
    out.push({
      ply: i,
      color: i % 2 === 0 ? WHITE : BLACK,
      played: moves[i],
      best: best[i] ?? moves[i],
      before,
      after,
      drop,
      classification: classify(drop, isBest),
    });
  }
  return out;
}

export interface SideSummary {
  accuracy: number;
  counts: Record<Classification, number>;
}

export function summarize(reviews: MoveReview[], color: Color): SideSummary {
  const mine = reviews.filter((r) => r.color === color);
  const counts: Record<Classification, number> = {
    best: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };
  for (const r of mine) counts[r.classification]++;
  return { accuracy: gameAccuracy(mine.map((r) => r.drop)), counts };
}

/**
 * Game accuracy from the per-move win-chance drops. The arithmetic mean alone
 * is too forgiving (a lost position makes every later move look "accurate"),
 * so it is averaged with the harmonic mean, which punishes big errors.
 */
export function gameAccuracy(drops: number[]): number {
  if (drops.length === 0) return 0;
  const accs = drops.map(moveAccuracy);
  const mean = accs.reduce((s, a) => s + a, 0) / accs.length;
  const harmonic = accs.length /
    accs.reduce((s, a) => s + 1 / Math.max(a, 1), 0);
  return (mean + harmonic) / 2;
}

/** Score of the position after `ply` plies from White's point of view. */
export function whiteScore(scores: (number | null)[], ply: number) {
  const s = scores[ply];
  if (s == null) return null;
  return ply % 2 === 0 ? s : -s;
}

/** Formats a White-perspective score like "+1.4", "−0.3" or "#". */
export function formatScore(score: number): string {
  if (score > MATE - 1000) return "+M";
  if (score < -MATE + 1000) return "−M";
  const v = score / 100;
  if (Math.abs(v) < 0.05) return "0.0";
  return (v > 0 ? "+" : "−") + Math.abs(v).toFixed(1);
}

/**
 * Engine score and best move for a position, from the side to move.
 * Finished games get an exact score (loss for the side to move, or draw).
 */
export function analysePosition(
  pos: Position,
  timeMs: number,
): { score: number; best: Move | null } {
  const res = pos.result();
  if (res.over) {
    return { score: res.winner === 0 ? 0 : -MATE, best: null };
  }
  const r = new Searcher(pos.clone()).search({
    maxDepth: 12,
    timeMs,
    alwaysSearch: true,
  });
  return { score: r.score, best: r.move };
}
