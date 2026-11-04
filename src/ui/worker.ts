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
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, moves, level, hint } = e.data;
  const pos = Position.initial();
  for (const m of moves) pos.makeMove(m);
  const result = hint
    ? new Searcher(pos.clone()).search({ maxDepth: 64, timeMs: 1200 })
    : chooseMove(pos, level);
  const res: WorkerResponse = {
    id,
    move: result.move,
    score: result.score,
    depth: result.depth,
  };
  self.postMessage(res);
};
