/// <reference lib="webworker" />
import { Position } from "../engine/position.ts";
import { chooseMove, Searcher } from "../engine/search.ts";

export interface WorkerRequest {
  id: number;
  moves: number[];
  level: number;
  /** If true, compute a strong hint for the human instead of an AI move. */
  hint?: boolean;
}

export interface WorkerResponse {
  id: number;
  move: number;
  score: number;
  depth: number;
  error?: string;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, moves, level, hint } = e.data;
  const pos = Position.initial();
  for (const m of moves) pos.makeMove(m);
  let res: WorkerResponse;
  try {
    const result = hint
      ? new Searcher(pos.clone()).search({ maxDepth: 64, timeMs: 1200 })
      : chooseMove(pos, level);
    res = { id, move: result.move, score: result.score, depth: result.depth };
  } catch (err) {
    // Never leave the UI waiting: fall back to any legal move.
    console.error(err);
    const legal = pos.legalMoves();
    res = { id, move: legal[0] ?? 0, score: 0, depth: 0, error: String(err) };
  }
  self.postMessage(res);
};
