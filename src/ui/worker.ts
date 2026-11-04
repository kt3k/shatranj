/// <reference lib="webworker" />
import { Position } from "../engine/position.ts";
import { chooseMove, Searcher } from "../engine/search.ts";
import { analysePosition } from "../engine/analysis.ts";

export interface WorkerRequest {
  type?: "move";
  id: number;
  moves: number[];
  level: number;
  /** If true, compute a strong hint for the human instead of an AI move. */
  hint?: boolean;
}

/** Analyse the positions after `from`..`moves.length` plies, one by one. */
export interface AnalyseRequest {
  type: "analyse";
  id: number;
  moves: number[];
  from: number;
  timeMs: number;
}

export interface WorkerResponse {
  type?: "move";
  id: number;
  move: number;
  score: number;
  depth: number;
  error?: string;
}

export interface AnalysisResponse {
  type: "analysis";
  id: number;
  ply: number;
  score: number;
  best: number | null;
  done: boolean;
}

self.onmessage = (e: MessageEvent<WorkerRequest | AnalyseRequest>) => {
  const data = e.data;
  if (data.type === "analyse") {
    analyse(data);
    return;
  }
  const { id, moves, level, hint } = data;
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

function analyse({ id, moves, from, timeMs }: AnalyseRequest) {
  const pos = Position.initial();
  for (let k = 0; k < from; k++) pos.makeMove(moves[k]);
  for (let k = from; k <= moves.length; k++) {
    let score = 0;
    let best: number | null = null;
    try {
      ({ score, best } = analysePosition(pos, timeMs));
    } catch (err) {
      console.error(err);
    }
    const res: AnalysisResponse = {
      type: "analysis",
      id,
      ply: k,
      score,
      best,
      done: k === moves.length,
    };
    self.postMessage(res);
    if (k < moves.length) pos.makeMove(moves[k]);
  }
}
