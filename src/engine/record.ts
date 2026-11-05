/**
 * Game records: PGN export/import and compact share codes.
 *
 * PGN: standard tag pairs plus `[Variant "Shatranj"]`, with the site's own
 * notation (K shāh, F firzān, E fīl, N faras, R rukh; baidaq has no letter,
 * promotion "=F"). On import the common alternatives used elsewhere for
 * shatranj (Q or M for the firzān, B or A for the fīl) are accepted too.
 *
 * Share code (version 2): see `encodeShare`.
 */
import {
  fileOf,
  type GameResult,
  type Move,
  moveFrom,
  moveTo,
  Position,
  rankOf,
} from "./position.ts";

// ---------------------------------------------------------------------------
// PGN
// ---------------------------------------------------------------------------

export interface PgnGame {
  tags: Record<string, string>;
  moves: Move[];
}

const RESULT_TOKENS = ["1-0", "0-1", "1/2-1/2", "*"];

/** PGN result string for a finished (or unfinished) game. */
export function pgnResult(res: GameResult): string {
  if (!res.over) return "*";
  if (res.winner === 0) return "1/2-1/2";
  return res.winner > 0 ? "1-0" : "0-1";
}

const TERMINATION: Record<string, string> = {
  checkmate: "Checkmate",
  stalemate: "Stalemate (a win in shatranj)",
  "bare-king": "Bare king",
  "draw-bare": "Both kings bare",
  repetition: "Threefold repetition",
  "move-limit": "Seventy-move rule",
};

const escapeTag = (v: string) => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

/** Serialises one game. `tags` are written in the given order after the defaults. */
export function toPGN(
  moves: Move[],
  tags: Record<string, string> = {},
): string {
  const pos = Position.initial();
  const sans: string[] = [];
  for (const m of moves) {
    sans.push(pos.toSAN(m));
    pos.makeMove(m);
  }
  const res = pos.result();
  const all: Record<string, string> = {
    Event: "Shatranj game",
    Site: "Shatranj",
    Date: "????.??.??",
    Round: "-",
    White: "Ivory",
    Black: "Ebony",
    Result: pgnResult(res),
    Variant: "Shatranj",
    ...tags,
  };
  all.Result = pgnResult(res);
  if (res.over) all.Termination = TERMINATION[res.reason];
  const head = Object.entries(all)
    .map(([k, v]) => `[${k} "${escapeTag(v)}"]`)
    .join("\n");
  // Movetext wrapped at ~80 columns.
  const tokens: string[] = [];
  sans.forEach((s, i) => tokens.push(i % 2 === 0 ? `${i / 2 + 1}. ${s}` : s));
  tokens.push(all.Result);
  const lines: string[] = [];
  let line = "";
  for (const tk of tokens) {
    if (line && line.length + 1 + tk.length > 80) {
      lines.push(line);
      line = tk;
    } else line = line ? `${line} ${tk}` : tk;
  }
  if (line) lines.push(line);
  return `${head}\n\n${lines.join("\n")}\n`;
}

/** Normalises SAN for comparison: drops check marks, annotations, aliases. */
function normSan(s: string): string {
  let t = s.replace(/[+#!?]+/g, "");
  // Piece letter aliases: Q/M → F (firzān), B/A → E (fīl).
  t = t.replace(/^[QM]/, "F").replace(/^[BA]/, "E");
  t = t.replace(/=([QM])$/, "=F");
  // Some sources omit the promotion suffix: promotion is always to firzān.
  return t.replace(/=F$/, "");
}

export class PgnError extends Error {}

/** Parses SAN moves from the initial position. Throws PgnError on failure. */
export function parseMoves(sanTokens: string[]): Move[] {
  const pos = Position.initial();
  const out: Move[] = [];
  for (const tok of sanTokens) {
    const want = normSan(tok);
    const legal = pos.legalMoves();
    const m = legal.find((mv) => normSan(pos.toSAN(mv)) === want);
    if (m === undefined) {
      throw new PgnError(
        `Illegal or unknown move "${tok}" at ply ${out.length + 1}`,
      );
    }
    out.push(m);
    pos.makeMove(m);
  }
  return out;
}

/** Parses a PGN text with one or more games. */
export function parsePGN(text: string): { games: PgnGame[]; errors: string[] } {
  const games: PgnGame[] = [];
  const errors: string[] = [];
  // Split into chunks: a new game starts at a tag line that follows movetext.
  const chunks: string[][] = [];
  let cur: string[] = [];
  let seenMoves = false;
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (line.startsWith("[")) {
      if (seenMoves) {
        chunks.push(cur);
        cur = [];
        seenMoves = false;
      }
      cur.push(line);
    } else if (line !== "" && !line.startsWith("%")) {
      cur.push(line);
      seenMoves = true;
    }
  }
  if (cur.length) chunks.push(cur);

  for (const chunk of chunks) {
    const tags: Record<string, string> = {};
    const body: string[] = [];
    for (const line of chunk) {
      const m = line.match(/^\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]$/);
      if (m) tags[m[1]] = m[2].replace(/\\(.)/g, "$1");
      else if (!line.startsWith("[")) body.push(line);
    }
    let mt = body.join(" ");
    mt = mt.replace(/\{[^}]*\}/g, " ").replace(/;[^\n]*/g, " ");
    // Remove (nested) variations.
    let prev;
    do {
      prev = mt;
      mt = mt.replace(/\([^()]*\)/g, " ");
    } while (mt !== prev);
    const tokens = mt
      .replace(/\$\d+/g, " ")
      .replace(/\d+\.(\.\.)?/g, " ")
      .split(/\s+/)
      .filter((t) => t && !RESULT_TOKENS.includes(t));
    if (tokens.length === 0 && Object.keys(tags).length === 0) continue;
    try {
      games.push({ tags, moves: parseMoves(tokens) });
    } catch (e) {
      errors.push(
        `${tags.White ?? "?"} – ${tags.Black ?? "?"}: ${(e as Error).message}`,
      );
    }
  }
  return { games, errors };
}

// ---------------------------------------------------------------------------
// Share codes
// ---------------------------------------------------------------------------

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function toBase64url(bytes: number[]): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const rem = Math.min(3, bytes.length - i);
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) |
      (bytes[i + 2] ?? 0);
    const chars = [n >> 18, (n >> 12) & 63, (n >> 6) & 63, n & 63];
    s += chars.slice(0, rem + 1).map((k) => B64[k]).join("");
  }
  return s;
}

function fromBase64url(s: string): number[] {
  const out: number[] = [];
  let buf = 0, bits = 0;
  for (const ch of s) {
    const v = B64.indexOf(ch);
    if (v < 0) throw new PgnError("Bad share code");
    buf = ((buf << 6) | v) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 255);
    }
  }
  return out;
}

/** Board square as 0..63 (a1 = 0, h1 = 7, a2 = 8 … h8 = 63). */
const sq64 = (s: number) => fileOf(s) + rankOf(s) * 8;

/**
 * Legal moves in canonical order: by origin square, then destination
 * square (a1 = 0 … h8 = 63). This is part of the share-code format and is
 * independent of how the engine happens to generate moves.
 */
export function canonicalMoves(pos: Position): Move[] {
  const key = (m: Move) => sq64(moveFrom(m)) * 64 + sq64(moveTo(m));
  return pos.legalMoves().sort((a, b) => key(a) - key(b));
}

/**
 * Version-2 share code: "2" + base64url(varint(plies) ‖ N), where N packs
 * the whole game as a mixed-radix number. With n_i legal moves at ply i and
 * k_i the index of the move played (canonical order),
 *
 *   N = k_0 + n_0·(k_1 + n_1·(k_2 + …))
 *
 * stored little-endian in the fewest bytes. Each ply therefore costs
 * log2(n_i) bits, and forced moves (n_i = 1) cost nothing.
 */
export function encodeShare(moves: Move[]): string {
  const pos = Position.initial();
  const digits: [bigint, bigint][] = [];
  for (const m of moves) {
    const legal = canonicalMoves(pos);
    const k = legal.indexOf(m);
    if (k < 0) throw new PgnError("Move not legal");
    digits.push([BigInt(k), BigInt(legal.length)]);
    pos.makeMove(m);
  }
  let n = 0n;
  for (let i = digits.length - 1; i >= 0; i--) {
    n = n * digits[i][1] + digits[i][0];
  }
  const bytes: number[] = [];
  // varint ply count
  let plies = moves.length;
  do {
    bytes.push((plies & 0x7f) | (plies > 0x7f ? 0x80 : 0));
    plies >>= 7;
  } while (plies > 0);
  while (n > 0n) {
    bytes.push(Number(n & 0xffn));
    n >>= 8n;
  }
  return "2" + toBase64url(bytes);
}

export function decodeShare(code: string): Move[] {
  if (!code.startsWith("2")) throw new PgnError("Unknown share code version");
  const bytes = fromBase64url(code.slice(1));
  let i = 0, plies = 0, shift = 0;
  for (;;) {
    if (i >= bytes.length || shift > 21) throw new PgnError("Bad share code");
    const b = bytes[i++];
    plies |= (b & 0x7f) << shift;
    shift += 7;
    if (!(b & 0x80)) break;
  }
  let n = 0n;
  for (let j = bytes.length - 1; j >= i; j--) n = (n << 8n) | BigInt(bytes[j]);
  const pos = Position.initial();
  const moves: Move[] = [];
  for (let p = 0; p < plies; p++) {
    const legal = canonicalMoves(pos);
    if (legal.length === 0) {
      throw new PgnError("Share code does not match a legal game");
    }
    const base = BigInt(legal.length);
    const m = legal[Number(n % base)];
    n /= base;
    moves.push(m);
    pos.makeMove(m);
  }
  // Anything left over means the code was not produced by encodeShare.
  if (n !== 0n) throw new PgnError("Share code does not match a legal game");
  return moves;
}
