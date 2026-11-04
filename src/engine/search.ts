import {
  ALFIL,
  BAIDAQ,
  type Color,
  EMPTY,
  FARAS,
  FERZ,
  fileOf,
  type Move,
  moveFrom,
  moveTo,
  OFF,
  Position,
  rankOf,
  RUKH,
  SHAH,
  WHITE,
} from "./position.ts";

export const MATE = 30000;
const INF = 32000;

/** Material values. The rukh dominates shatranj; ferz and alfil are weak. */
export const VALUE = [0, 100, 180, 130, 330, 520, 0];

// Piece-square bonuses from White's point of view, indexed [rank][file].
const CENTER = [
  [-20, -12, -8, -6, -6, -8, -12, -20],
  [-12, -4, 0, 2, 2, 0, -4, -12],
  [-8, 0, 6, 10, 10, 6, 0, -8],
  [-6, 2, 10, 16, 16, 10, 2, -6],
  [-6, 2, 10, 16, 16, 10, 2, -6],
  [-8, 0, 6, 10, 10, 6, 0, -8],
  [-12, -4, 0, 2, 2, 0, -4, -12],
  [-20, -12, -8, -6, -6, -8, -12, -20],
];
const BAIDAQ_ADV = [0, 0, 4, 10, 18, 28, 40, 0];

function pst(type: number, file: number, rank: number, endgame: boolean) {
  switch (type) {
    case BAIDAQ: {
      const centre = file >= 2 && file <= 5 ? 4 : 0;
      return BAIDAQ_ADV[rank] + centre;
    }
    case FARAS:
      return CENTER[rank][file];
    case FERZ:
      return CENTER[rank][file] >> 1;
    case ALFIL:
      return CENTER[rank][file] >> 2;
    case RUKH:
      return rank === 6 ? 12 : 0;
    case SHAH:
      return endgame ? CENTER[rank][file] : -(CENTER[rank][file] >> 1);
  }
  return 0;
}

/** Static evaluation from the side-to-move's point of view. */
export function evaluate(pos: Position): number {
  const b = pos.board;
  let score = 0;
  const total = pos.count[0] + pos.count[1];
  const endgame = total <= 10;
  for (let s = 21; s <= 98; s++) {
    const pc = b[s];
    if (pc === EMPTY || pc === OFF) continue;
    const type = pc > 0 ? pc : -pc;
    const color = pc > 0 ? 1 : -1;
    const file = fileOf(s);
    const rank = color === WHITE ? rankOf(s) : 7 - rankOf(s);
    score += color * (VALUE[type] + pst(type, file, rank, endgame));
  }
  // Fewer pieces is dangerous because of the bare-king rule.
  const [w, bl] = pos.count;
  if (w === 1 && bl > 1) score -= 60;
  if (bl === 1 && w > 1) score += 60;
  // Encourage trading when ahead in endgames.
  if (endgame && score !== 0) {
    const kd = kingDistance(pos.kingSq[0], pos.kingSq[1]);
    score += Math.sign(score) * (14 - kd) * 3;
  }
  return score * pos.side;
}

function kingDistance(a: number, b: number) {
  return Math.max(
    Math.abs(fileOf(a) - fileOf(b)),
    Math.abs(rankOf(a) - rankOf(b)),
  );
}

// ---------------------------------------------------------------------------
// Transposition table
// ---------------------------------------------------------------------------

const TT_BITS = 20;
const TT_SIZE = 1 << TT_BITS;
const TT_MASK = TT_SIZE - 1;
const EXACT = 1, LOWER = 2, UPPER = 3;

class TT {
  key = new Int32Array(TT_SIZE);
  move = new Int32Array(TT_SIZE);
  score = new Int32Array(TT_SIZE);
  depth = new Int8Array(TT_SIZE);
  flag = new Int8Array(TT_SIZE);

  clear() {
    this.flag.fill(0);
  }
}

let sharedTT: TT | null = null;

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchOptions {
  maxDepth: number;
  timeMs: number;
  /** Random noise (centipawns) added to each root move's score. */
  noise?: number;
  random?: () => number;
}

export interface SearchResult {
  move: Move;
  score: number;
  depth: number;
  nodes: number;
  pv: Move[];
}

class Abort extends Error {}

export class Searcher {
  nodes = 0;
  private deadline = 0;
  private tt: TT;
  private killers: Int32Array;
  private history = new Int32Array(120 * 120);

  constructor(private pos: Position) {
    this.tt = sharedTT ??= new TT();
    this.killers = new Int32Array(128 * 2);
  }

  search(opts: SearchOptions): SearchResult {
    const pos = this.pos;
    const random = opts.random ?? Math.random;
    const noise = opts.noise ?? 0;
    const rootPly = pos.ply;
    this.deadline = performance.now() + opts.timeMs;
    this.nodes = 0;
    this.tt.clear();
    this.history.fill(0);
    this.killers.fill(0);

    const rootMoves = pos.legalMoves();
    if (rootMoves.length === 0) {
      throw new Error("No legal moves");
    }
    const noiseOf = new Map<Move, number>();
    for (const m of rootMoves) {
      noiseOf.set(m, noise > 0 ? Math.round((random() * 2 - 1) * noise) : 0);
    }

    let best: SearchResult = {
      move: rootMoves[0],
      score: 0,
      depth: 0,
      nodes: 0,
      pv: [rootMoves[0]],
    };
    if (rootMoves.length === 1) {
      return best;
    }

    // Order root moves by a cheap guess first.
    let order = rootMoves.slice();
    for (let depth = 1; depth <= opts.maxDepth; depth++) {
      try {
        const scored: { move: Move; score: number }[] = [];
        let alpha = -INF;
        for (const m of order) {
          pos.makeMove(m);
          let score: number;
          if (noise > 0) {
            // Need exact scores for every move so that noise is meaningful.
            score = -this.negamax(depth - 1, -INF, INF, 1);
          } else if (scored.length === 0) {
            score = -this.negamax(depth - 1, -INF, -alpha, 1);
          } else {
            score = -this.negamax(depth - 1, -alpha - 1, -alpha, 1);
            if (score > alpha) {
              score = -this.negamax(depth - 1, -INF, -alpha, 1);
            }
          }
          pos.unmakeMove();
          const total = score + noiseOf.get(m)!;
          scored.push({ move: m, score: total });
          if (score > alpha && noise === 0) alpha = score;
        }
        scored.sort((a, b) => b.score - a.score);
        order = scored.map((s) => s.move);
        best = {
          move: scored[0].move,
          score: scored[0].score,
          depth,
          nodes: this.nodes,
          pv: this.extractPV(scored[0].move, depth),
        };
        if (Math.abs(best.score) > MATE - 200) break;
      } catch (e) {
        if (e instanceof Abort) {
          // Unwind the board to the root.
          while (pos.ply > rootPly) pos.unmakeMove();
          break;
        }
        throw e;
      }
      if (performance.now() > this.deadline) break;
    }
    best.nodes = this.nodes;
    return best;
  }

  private extractPV(first: Move, depth: number): Move[] {
    const pos = this.pos;
    const pv: Move[] = [first];
    pos.makeMove(first);
    let n = 1;
    for (let i = 1; i < depth; i++) {
      const idx = pos.hashLo & TT_MASK;
      if (this.tt.flag[idx] === 0 || this.tt.key[idx] !== pos.hashHi) break;
      const m = this.tt.move[idx];
      if (!m || !pos.legalMoves().includes(m)) break;
      pv.push(m);
      pos.makeMove(m);
      n++;
    }
    for (let i = 0; i < n; i++) pos.unmakeMove();
    return pv;
  }

  private checkTime() {
    if ((++this.nodes & 2047) === 0 && performance.now() > this.deadline) {
      throw new Abort();
    }
  }

  /** Terminal checks shared by negamax and quiescence. Returns a score or null. */
  private terminal(ply: number): number | null {
    const pos = this.pos;
    const ci = pos.side === WHITE ? 0 : 1;
    if (pos.count[ci] === 0) {
      const st = pos.bareKingStatus();
      if (st === "lose") return -MATE + ply;
      if (st === "draw") return 0;
    }
    return null;
  }

  private negamax(
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
  ): number {
    const pos = this.pos;
    this.checkTime();

    if (pos.halfmove >= 140) return 0;
    if (ply > 0 && this.isRepetition()) return 0;
    const term = this.terminal(ply);
    if (term !== null) return term;

    const inCheck = pos.inCheck();
    if (inCheck) depth++;
    if (depth <= 0) return this.quiesce(alpha, beta, ply);

    // TT probe
    const idx = pos.hashLo & TT_MASK;
    let ttMove = 0;
    if (this.tt.flag[idx] !== 0 && this.tt.key[idx] === pos.hashHi) {
      ttMove = this.tt.move[idx];
      if (this.tt.depth[idx] >= depth) {
        let s = this.tt.score[idx];
        if (s > MATE - 500) s -= ply;
        else if (s < -MATE + 500) s += ply;
        const f = this.tt.flag[idx];
        if (f === EXACT) return s;
        if (f === LOWER && s >= beta) return s;
        if (f === UPPER && s <= alpha) return s;
      }
    }

    // Null-move pruning (careful: zugzwang is common in shatranj endgames)
    const ci = pos.side === WHITE ? 0 : 1;
    if (!inCheck && depth >= 3 && pos.count[ci] >= 4 && beta < MATE - 500) {
      if (evaluate(pos) >= beta) {
        pos.makeNullMove();
        const s = -this.negamax(depth - 3, -beta, -beta + 1, ply + 1);
        pos.unmakeMove();
        if (s >= beta) return beta;
      }
    }

    const moves = pos.generate([]);
    const scores = this.scoreMoves(moves, ttMove, ply);

    const origAlpha = alpha;
    let bestScore = -INF;
    let bestMove = 0;
    let legal = 0;
    for (let i = 0; i < moves.length; i++) {
      pickBest(moves, scores, i);
      const m = moves[i];
      const captured = pos.board[moveTo(m)];
      if (!pos.makeMove(m)) {
        pos.unmakeMove();
        continue;
      }
      legal++;
      let score: number;
      if (legal === 1) {
        score = -this.negamax(depth - 1, -beta, -alpha, ply + 1);
      } else {
        // Late move reduction for quiet moves.
        let r = 0;
        if (depth >= 3 && legal > 4 && captured === EMPTY && !inCheck) r = 1;
        score = -this.negamax(depth - 1 - r, -alpha - 1, -alpha, ply + 1);
        if (score > alpha && (r > 0 || score < beta)) {
          score = -this.negamax(depth - 1, -beta, -alpha, ply + 1);
        }
      }
      pos.unmakeMove();

      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
        if (score > alpha) {
          alpha = score;
          if (score >= beta) {
            if (captured === EMPTY) {
              if (this.killers[ply * 2] !== m) {
                this.killers[ply * 2 + 1] = this.killers[ply * 2];
                this.killers[ply * 2] = m;
              }
              this.history[moveFrom(m) * 120 + moveTo(m)] += depth * depth;
            }
            break;
          }
        }
      }
    }

    if (legal === 0) {
      // Both checkmate and stalemate lose in shatranj.
      return -MATE + ply;
    }

    // TT store
    let stored = bestScore;
    if (stored > MATE - 500) stored += ply;
    else if (stored < -MATE + 500) stored -= ply;
    this.tt.key[idx] = pos.hashHi;
    this.tt.move[idx] = bestMove;
    this.tt.score[idx] = stored;
    this.tt.depth[idx] = depth;
    this.tt.flag[idx] = bestScore <= origAlpha
      ? UPPER
      : bestScore >= beta
      ? LOWER
      : EXACT;
    return bestScore;
  }

  private quiesce(alpha: number, beta: number, ply: number): number {
    const pos = this.pos;
    this.checkTime();
    const term = this.terminal(ply);
    if (term !== null) return term;

    const stand = evaluate(pos);
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    if (ply > 60) return stand;

    const moves = pos.generate([], true);
    const scores = this.scoreMoves(moves, 0, ply);
    let best = stand;
    for (let i = 0; i < moves.length; i++) {
      pickBest(moves, scores, i);
      const m = moves[i];
      if (!pos.makeMove(m)) {
        pos.unmakeMove();
        continue;
      }
      const score = -this.quiesce(-beta, -alpha, ply + 1);
      pos.unmakeMove();
      if (score > best) {
        best = score;
        if (score > alpha) {
          alpha = score;
          if (score >= beta) break;
        }
      }
    }
    return best;
  }

  private scoreMoves(moves: Move[], ttMove: Move, ply: number): Int32Array {
    const b = this.pos.board;
    const scores = new Int32Array(moves.length);
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      const victim = b[moveTo(m)];
      if (m === ttMove) scores[i] = 1_000_000;
      else if (victim !== EMPTY) {
        const attacker = Math.abs(b[moveFrom(m)]);
        scores[i] = 100_000 + VALUE[Math.abs(victim)] * 10 -
          VALUE[attacker] / 10;
      } else if (this.killers[ply * 2] === m) scores[i] = 90_000;
      else if (this.killers[ply * 2 + 1] === m) scores[i] = 80_000;
      else scores[i] = this.history[moveFrom(m) * 120 + moveTo(m)];
      // Promotions
      const pc = b[moveFrom(m)];
      if (Math.abs(pc) === BAIDAQ) {
        const r = rankOf(moveTo(m));
        if (r === 0 || r === 7) scores[i] += 50_000;
      }
    }
    return scores;
  }

  private isRepetition(): boolean {
    const pos = this.pos;
    const hist = pos.hashHistory;
    const h = pos.hashLo;
    const start = Math.max(0, hist.length - 1 - pos.halfmove);
    for (let i = hist.length - 3; i >= start; i -= 2) {
      if (hist[i] === h) return true;
    }
    return false;
  }
}

function pickBest(moves: Move[], scores: Int32Array, i: number) {
  let bi = i;
  for (let j = i + 1; j < moves.length; j++) {
    if (scores[j] > scores[bi]) bi = j;
  }
  if (bi !== i) {
    const tm = moves[i];
    moves[i] = moves[bi];
    moves[bi] = tm;
    const ts = scores[i];
    scores[i] = scores[bi];
    scores[bi] = ts;
  }
}

// ---------------------------------------------------------------------------
// Difficulty levels
// ---------------------------------------------------------------------------

export interface Level {
  id: number;
  name: string;
  arabic: string;
  title: string;
  description: string;
  options: SearchOptions;
  /** Probability of playing a uniformly random legal move. */
  blunder: number;
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Aladdin",
    arabic: "علاء الدين",
    title: "The Street Urchin",
    description:
      "A lad from the alleys of the city who just learned the moves.",
    options: { maxDepth: 1, timeMs: 300, noise: 220 },
    blunder: 0.25,
  },
  {
    id: 2,
    name: "Masrūr",
    arabic: "مسرور",
    title: "The Sword-bearer",
    description:
      "The caliph's loyal executioner. Bold, but careless at the board.",
    options: { maxDepth: 2, timeMs: 400, noise: 90 },
    blunder: 0.08,
  },
  {
    id: 3,
    name: "Jaʿfar",
    arabic: "جعفر",
    title: "The Vizier",
    description: "The clever vizier of the Barmakids. Plays a sound game.",
    options: { maxDepth: 3, timeMs: 700, noise: 30 },
    blunder: 0,
  },
  {
    id: 4,
    name: "Hārūn al-Rashīd",
    arabic: "هارون الرشيد",
    title: "The Caliph",
    description:
      "The Commander of the Faithful himself, a keen patron of shatranj.",
    options: { maxDepth: 6, timeMs: 1200, noise: 6 },
    blunder: 0,
  },
  {
    id: 5,
    name: "Jinn",
    arabic: "جنّي",
    title: "The Spirit of the Lamp",
    description: "A being of smokeless fire. Few mortals can hold a draw.",
    options: { maxDepth: 64, timeMs: 3000, noise: 0 },
    blunder: 0,
  },
];

export function chooseMove(
  pos: Position,
  levelId: number,
  random: () => number = Math.random,
): SearchResult {
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[2];
  const work = pos.clone();
  const legal = work.legalMoves();
  if (level.blunder > 0 && random() < level.blunder && legal.length > 0) {
    const m = legal[Math.floor(random() * legal.length)];
    return { move: m, score: 0, depth: 0, nodes: 0, pv: [m] };
  }
  return new Searcher(work).search({ ...level.options, random });
}
