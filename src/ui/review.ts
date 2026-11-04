/**
 * Game-review state: runs the analysis in its own worker (so the opponent's
 * worker stays free), keeps per-position scores, and persists them.
 */
import type { Move } from "../engine/position.ts";
import { type MoveReview, reviewMoves } from "../engine/analysis.ts";
import type { AnalyseRequest, AnalysisResponse } from "./worker.ts";

const STORAGE_KEY = "shatranj:review";
/** Thinking time per analysed position. */
export const ANALYSIS_MS = 400;

export const review = {
  /** Moves the scores below belong to. */
  moves: [] as Move[],
  /** scores[k]: score after k plies, from the side to move. */
  scores: [] as (number | null)[],
  /** best[k]: engine's best move in the position after k plies. */
  best: [] as (Move | null)[],
  running: false,
  /** Show the position before the selected move with the better move. */
  showBest: false,
};

let worker: Worker | null = null;
let requestId = 0;
let cached: { key: string; reviews: MoveReview[] } | null = null;
/** Saving is held back until the stored review has been read back. */
let restored = false;

/** Number of positions (from ply 0) with a known score. */
export function analysedCount(): number {
  let n = 0;
  while (n < review.scores.length && review.scores[n] != null) n++;
  return n;
}

export function hasReview(): boolean {
  return analysedCount() >= 2;
}

/** True when every position of the current move list has been analysed. */
export function isComplete(): boolean {
  return analysedCount() === review.moves.length + 1;
}

export function reviews(): MoveReview[] {
  const key = `${review.moves.length}:${review.scores.join(",")}`;
  if (cached?.key !== key) {
    cached = {
      key,
      reviews: reviewMoves(review.moves, review.scores, review.best),
    };
  }
  return cached.reviews;
}

export function reviewOf(ply: number): MoveReview | undefined {
  return reviews()[ply];
}

/**
 * Aligns the review with the game's moves: keeps the scores of the common
 * prefix (those positions are unchanged) and drops the rest.
 */
export function syncWithGame(moves: Move[]) {
  let common = 0;
  while (
    common < moves.length && common < review.moves.length &&
    moves[common] === review.moves[common]
  ) common++;
  const same = common === moves.length && common === review.moves.length;
  if (same) return;
  // A change to the game invalidates a running analysis.
  cancel();
  const keepScores = Math.min(review.scores.length, common + 1);
  review.moves = moves.slice();
  review.scores = review.scores.slice(0, keepScores);
  review.best = review.best.slice(0, keepScores);
  review.showBest = false;
  persist();
}

/** Analyses the positions that are not yet scored. */
export function start(moves: Move[], onUpdate: () => void) {
  syncWithGame(moves);
  cancel();
  const from = analysedCount();
  if (from > moves.length) return;
  worker = new Worker(new URL("./worker.js", import.meta.url), {
    type: "module",
  });
  const id = ++requestId;
  review.running = true;
  worker.onmessage = (e: MessageEvent<AnalysisResponse>) => {
    const r = e.data;
    if (r.type !== "analysis" || r.id !== id) return;
    review.scores[r.ply] = r.score;
    review.best[r.ply] = r.best;
    if (r.done) {
      review.running = false;
      worker?.terminate();
      worker = null;
    }
    persist();
    onUpdate();
  };
  worker.onerror = (e) => {
    console.error("analysis worker failed:", e.message);
    review.running = false;
    worker = null;
    onUpdate();
  };
  const req: AnalyseRequest = {
    type: "analyse",
    id,
    moves: review.moves,
    from,
    timeMs: ANALYSIS_MS,
  };
  worker.postMessage(req);
  onUpdate();
}

export function cancel() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  requestId++;
  review.running = false;
}

/** Forgets the review entirely (e.g. on a new game). */
export function clear() {
  cancel();
  review.moves = [];
  review.scores = [];
  review.best = [];
  review.showBest = false;
  persist();
}

function persist() {
  if (!restored) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        moves: review.moves,
        scores: review.scores,
        best: review.best,
      }),
    );
  } catch {
    // storage unavailable: review just won't survive a reload
  }
}

/** Restores a saved review if it belongs to (a prefix of) `moves`. */
export function restore(moves: Move[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? JSON.parse(raw) : null;
    if (s && Array.isArray(s.moves) && Array.isArray(s.scores)) {
      review.moves = s.moves;
      review.scores = s.scores;
      review.best = Array.isArray(s.best) ? s.best : [];
    }
  } catch {
    // ignore a corrupt entry
  }
  restored = true;
  syncWithGame(moves);
}
