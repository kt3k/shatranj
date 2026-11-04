/**
 * Shatranj rules engine.
 *
 * The board uses a 10x12 mailbox. Square index = 21 + file + rank * 10,
 * where file 0 = a and rank 0 = rank 1 (White's back rank).
 *
 * Pieces are signed integers: positive for White, negative for Black.
 */

export const EMPTY = 0;
export const BAIDAQ = 1; // pawn
export const FERZ = 2; // counsellor: one step diagonally
export const ALFIL = 3; // elephant: leaps exactly two squares diagonally
export const FARAS = 4; // horse: like a knight
export const RUKH = 5; // chariot: like a rook
export const SHAH = 6; // king
export const OFF = 7;

export const WHITE = 1;
export const BLACK = -1;
export type Color = 1 | -1;

export type Move = number;

/** Encodes a move. The promotion flag is implicit (baidaq reaching last rank). */
export const encodeMove = (from: number, to: number): Move => from | (to << 7);
export const moveFrom = (m: Move): number => m & 127;
export const moveTo = (m: Move): number => (m >> 7) & 127;

export const sq = (file: number, rank: number): number => 21 + file + rank * 10;
export const fileOf = (s: number): number => (s % 10) - 1;
export const rankOf = (s: number): number => Math.floor(s / 10) - 2;
export const onBoard = (s: number): boolean =>
  s >= 21 && s <= 98 && s % 10 !== 0 && s % 10 !== 9;

export const squareName = (s: number): string =>
  "abcdefgh"[fileOf(s)] + (rankOf(s) + 1);

export const parseSquare = (name: string): number => {
  const f = name.charCodeAt(0) - 97;
  const r = name.charCodeAt(1) - 49;
  return sq(f, r);
};

const FERZ_DIRS = [9, 11, -9, -11];
const ALFIL_DIRS = [18, 22, -18, -22];
const FARAS_DIRS = [8, 12, 19, 21, -8, -12, -19, -21];
const RUKH_DIRS = [1, -1, 10, -10];
const SHAH_DIRS = [1, -1, 10, -10, 9, 11, -9, -11];

// ---------------------------------------------------------------------------
// Zobrist hashing (two 32-bit halves)
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) | 0;
  };
}

const rnd = mulberry32(0x5a7a4a);
// index: (piece + 6) * 120 + square
const Z_LO = new Int32Array(13 * 120).map(() => rnd());
const Z_HI = new Int32Array(13 * 120).map(() => rnd());
const Z_SIDE_LO = rnd();
const Z_SIDE_HI = rnd();

interface Undo {
  move: Move;
  captured: number;
  promoted: boolean;
  halfmove: number;
  hashLo: number;
  hashHi: number;
}

export type GameResult =
  | { over: false }
  | {
    over: true;
    winner: Color | 0;
    reason:
      | "checkmate"
      | "stalemate"
      | "bare-king"
      | "draw-bare"
      | "repetition"
      | "move-limit";
  };

/** Number of half-moves without capture or baidaq move after which the game is drawn. */
export const MOVE_LIMIT_PLIES = 140;

export class Position {
  board = new Int8Array(120).fill(OFF);
  side: Color = WHITE;
  kingSq: [number, number] = [0, 0]; // [white, black]
  /** Count of non-king pieces: [white, black]. */
  count: [number, number] = [0, 0];
  halfmove = 0;
  hashLo = 0;
  hashHi = 0;
  /** Stack of hashes for repetition detection (one entry per position reached). */
  hashHistory: number[] = [];
  private undos: Undo[] = [];

  static initial(): Position {
    const p = new Position();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) p.board[sq(f, r)] = EMPTY;
    }
    const back = [RUKH, FARAS, ALFIL, FERZ, SHAH, ALFIL, FARAS, RUKH];
    for (let f = 0; f < 8; f++) {
      p.board[sq(f, 0)] = back[f];
      p.board[sq(f, 1)] = BAIDAQ;
      p.board[sq(f, 6)] = -BAIDAQ;
      p.board[sq(f, 7)] = -back[f];
    }
    p.recompute();
    return p;
  }

  /**
   * Builds a position from a compact description, e.g.
   * `fromPieces({ e1: "K", d1: "F", e8: "k" }, WHITE)`. Upper case is White.
   * Letters: K shah, F ferz, E alfil, N faras, R rukh, P baidaq.
   */
  static fromPieces(pieces: Record<string, string>, side: Color = WHITE) {
    const p = new Position();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) p.board[sq(f, r)] = EMPTY;
    }
    for (const [name, letter] of Object.entries(pieces)) {
      const type = "PFENRK".indexOf(letter.toUpperCase()) + 1;
      if (type <= 0) throw new Error(`Unknown piece ${letter}`);
      p.board[parseSquare(name)] = letter === letter.toUpperCase()
        ? type
        : -type;
    }
    p.side = side;
    p.recompute();
    return p;
  }

  private recompute() {
    this.count = [0, 0];
    this.hashLo = 0;
    this.hashHi = 0;
    for (let s = 21; s <= 98; s++) {
      const pc = this.board[s];
      if (pc === OFF || pc === EMPTY) continue;
      const ci = pc > 0 ? 0 : 1;
      if (Math.abs(pc) === SHAH) this.kingSq[ci] = s;
      else this.count[ci]++;
      this.hashLo ^= Z_LO[(pc + 6) * 120 + s];
      this.hashHi ^= Z_HI[(pc + 6) * 120 + s];
    }
    if (this.side === BLACK) {
      this.hashLo ^= Z_SIDE_LO;
      this.hashHi ^= Z_SIDE_HI;
    }
    this.hashHistory = [this.hashLo];
  }

  clone(): Position {
    const p = new Position();
    p.board.set(this.board);
    p.side = this.side;
    p.kingSq = [this.kingSq[0], this.kingSq[1]];
    p.count = [this.count[0], this.count[1]];
    p.halfmove = this.halfmove;
    p.hashLo = this.hashLo;
    p.hashHi = this.hashHi;
    p.hashHistory = this.hashHistory.slice();
    return p;
  }

  pieceAt(s: number): number {
    return this.board[s];
  }

  /** Is square `s` attacked by pieces of color `by`? */
  isAttacked(s: number, by: Color): boolean {
    const b = this.board;
    // baidaq: a White baidaq on s-9 / s-11 attacks s
    const pd = by * 10;
    if (b[s - pd - 1] === by * BAIDAQ || b[s - pd + 1] === by * BAIDAQ) {
      return true;
    }
    for (const d of FERZ_DIRS) if (b[s + d] === by * FERZ) return true;
    for (const d of ALFIL_DIRS) {
      const t = s + d;
      if (t >= 0 && t < 120 && b[t] === by * ALFIL) return true;
    }
    for (const d of FARAS_DIRS) if (b[s + d] === by * FARAS) return true;
    for (const d of SHAH_DIRS) if (b[s + d] === by * SHAH) return true;
    for (const d of RUKH_DIRS) {
      let t = s + d;
      while (b[t] === EMPTY) t += d;
      if (b[t] === by * RUKH) return true;
    }
    return false;
  }

  inCheck(color: Color = this.side): boolean {
    return this.isAttacked(
      this.kingSq[color === WHITE ? 0 : 1],
      -color as Color,
    );
  }

  /** Generates pseudo-legal moves into `out`. */
  generate(out: Move[], capturesOnly = false): Move[] {
    const b = this.board;
    const us = this.side;
    for (let s = 21; s <= 98; s++) {
      const pc = b[s];
      if (pc === EMPTY || pc === OFF || (pc > 0) !== (us > 0)) continue;
      const type = pc * us;
      switch (type) {
        case BAIDAQ: {
          const fwd = s + us * 10;
          const lastRank = rankOf(fwd) === (us === WHITE ? 7 : 0);
          if (b[fwd] === EMPTY && (!capturesOnly || lastRank)) {
            out.push(encodeMove(s, fwd));
          }
          for (const t of [fwd - 1, fwd + 1]) {
            const target = b[t];
            if (
              target !== OFF && target !== EMPTY && (target > 0) !== (us > 0)
            ) {
              out.push(encodeMove(s, t));
            }
          }
          break;
        }
        case FERZ:
          this.steps(out, s, FERZ_DIRS, capturesOnly);
          break;
        case ALFIL:
          this.steps(out, s, ALFIL_DIRS, capturesOnly);
          break;
        case FARAS:
          this.steps(out, s, FARAS_DIRS, capturesOnly);
          break;
        case SHAH:
          this.steps(out, s, SHAH_DIRS, capturesOnly);
          break;
        case RUKH:
          for (const d of RUKH_DIRS) {
            let t = s + d;
            while (b[t] === EMPTY) {
              if (!capturesOnly) out.push(encodeMove(s, t));
              t += d;
            }
            const target = b[t];
            if (target !== OFF && (target > 0) !== (us > 0)) {
              out.push(encodeMove(s, t));
            }
          }
          break;
      }
    }
    return out;
  }

  private steps(out: Move[], s: number, dirs: number[], capturesOnly: boolean) {
    const b = this.board;
    const us = this.side;
    for (const d of dirs) {
      const t = s + d;
      if (t < 0 || t >= 120) continue;
      const target = b[t];
      if (target === OFF) continue;
      if (target === EMPTY) {
        if (!capturesOnly) out.push(encodeMove(s, t));
      } else if ((target > 0) !== (us > 0)) {
        out.push(encodeMove(s, t));
      }
    }
  }

  /** Makes a move. Returns false (and leaves the move made) if it leaves the mover's king in check. */
  makeMove(m: Move): boolean {
    const from = moveFrom(m);
    const to = moveTo(m);
    const b = this.board;
    const pc = b[from];
    const captured = b[to];
    const us = this.side;
    const ci = us === WHITE ? 0 : 1;

    this.undos.push({
      move: m,
      captured,
      promoted: false,
      halfmove: this.halfmove,
      hashLo: this.hashLo,
      hashHi: this.hashHi,
    });
    const undo = this.undos[this.undos.length - 1];

    let lo = this.hashLo ^ Z_LO[(pc + 6) * 120 + from];
    let hi = this.hashHi ^ Z_HI[(pc + 6) * 120 + from];
    if (captured !== EMPTY) {
      lo ^= Z_LO[(captured + 6) * 120 + to];
      hi ^= Z_HI[(captured + 6) * 120 + to];
      this.count[1 - ci]--;
    }
    let placed = pc;
    if (pc * us === BAIDAQ && rankOf(to) === (us === WHITE ? 7 : 0)) {
      placed = us * FERZ;
      undo.promoted = true;
    }
    b[from] = EMPTY;
    b[to] = placed;
    lo ^= Z_LO[(placed + 6) * 120 + to] ^ Z_SIDE_LO;
    hi ^= Z_HI[(placed + 6) * 120 + to] ^ Z_SIDE_HI;
    this.hashLo = lo;
    this.hashHi = hi;
    if (pc * us === SHAH) this.kingSq[ci] = to;
    this.halfmove = captured !== EMPTY || pc * us === BAIDAQ
      ? 0
      : this.halfmove + 1;
    this.side = -us as Color;
    this.hashHistory.push(lo);
    return !this.isAttacked(this.kingSq[ci], this.side);
  }

  unmakeMove() {
    const u = this.undos.pop()!;
    const from = moveFrom(u.move);
    const to = moveTo(u.move);
    const b = this.board;
    this.side = -this.side as Color;
    const us = this.side;
    const ci = us === WHITE ? 0 : 1;
    const moved = u.promoted ? us * BAIDAQ : b[to];
    b[from] = moved;
    b[to] = u.captured;
    if (u.captured !== EMPTY) this.count[1 - ci]++;
    if (moved * us === SHAH) this.kingSq[ci] = from;
    this.halfmove = u.halfmove;
    this.hashLo = u.hashLo;
    this.hashHi = u.hashHi;
    this.hashHistory.pop();
  }

  legalMoves(): Move[] {
    const pseudo = this.generate([]);
    const legal: Move[] = [];
    for (const m of pseudo) {
      if (this.makeMove(m)) legal.push(m);
      this.unmakeMove();
    }
    return legal;
  }

  /** How many times the current position occurred (with the same side to move). */
  repetitions(): number {
    const h = this.hashLo;
    const hist = this.hashHistory;
    let n = 0;
    // Only positions within the halfmove window can repeat.
    const start = Math.max(0, hist.length - 1 - this.halfmove);
    for (let i = hist.length - 1; i >= start; i -= 2) {
      if (hist[i] === h) n++;
    }
    return n;
  }

  /**
   * Bare-king rule from the perspective of the side to move.
   * Returns "lose" if the side to move has a bare king and cannot immediately
   * bare the opponent, "draw" if both are (or will be) bare, otherwise null.
   */
  bareKingStatus(): "lose" | "draw" | null {
    const ci = this.side === WHITE ? 0 : 1;
    const mine = this.count[ci];
    const theirs = this.count[1 - ci];
    if (mine > 0) return null;
    if (theirs === 0) return "draw";
    if (theirs >= 2) return "lose";
    // Opponent has a single piece left: can we capture it right now?
    const caps = this.generate([], true);
    for (const m of caps) {
      const target = this.board[moveTo(m)];
      const ok = this.makeMove(m);
      this.unmakeMove();
      if (ok && target !== EMPTY && Math.abs(target) !== SHAH) return "draw";
    }
    return "lose";
  }

  result(): GameResult {
    const us = this.side;
    const legal = this.legalMoves();
    if (legal.length === 0) {
      return {
        over: true,
        winner: -us as Color,
        reason: this.inCheck() ? "checkmate" : "stalemate",
      };
    }
    const bare = this.bareKingStatus();
    if (bare === "lose") {
      return { over: true, winner: -us as Color, reason: "bare-king" };
    }
    if (bare === "draw" && this.count[0] === 0 && this.count[1] === 0) {
      return { over: true, winner: 0, reason: "draw-bare" };
    }
    if (this.repetitions() >= 3) {
      return { over: true, winner: 0, reason: "repetition" };
    }
    if (this.halfmove >= MOVE_LIMIT_PLIES) {
      return { over: true, winner: 0, reason: "move-limit" };
    }
    return { over: false };
  }

  // -------------------------------------------------------------------------
  // Notation
  // -------------------------------------------------------------------------

  /** Standard-style algebraic notation: K F E N R, baidaq has no letter. */
  toSAN(m: Move): string {
    const from = moveFrom(m);
    const to = moveTo(m);
    const pc = this.board[from];
    const type = Math.abs(pc);
    const capture = this.board[to] !== EMPTY;
    let s = "";
    if (type === BAIDAQ) {
      if (capture) s += "abcdefgh"[fileOf(from)] + "x";
      s += squareName(to);
      if (rankOf(to) === 0 || rankOf(to) === 7) s += "=F";
    } else {
      s += "  FENRK"[type];
      const others = this.legalMoves().filter((o) =>
        o !== m && moveTo(o) === to && this.board[moveFrom(o)] === pc
      );
      if (others.length > 0) {
        const sameFile = others.some((o) =>
          fileOf(moveFrom(o)) === fileOf(from)
        );
        const sameRank = others.some((o) =>
          rankOf(moveFrom(o)) === rankOf(from)
        );
        if (!sameFile) s += "abcdefgh"[fileOf(from)];
        else if (!sameRank) s += rankOf(from) + 1;
        else s += squareName(from);
      }
      if (capture) s += "x";
      s += squareName(to);
    }
    this.makeMove(m);
    const res = this.result();
    if (res.over && res.reason === "checkmate") s += "#";
    else if (this.inCheck()) s += "+";
    this.unmakeMove();
    return s;
  }
}
