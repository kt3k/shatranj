import { assert, assertEquals } from "@std/assert";
import {
  BLACK,
  encodeMove,
  FERZ,
  type Move,
  parseSquare,
  Position,
  WHITE,
} from "./position.ts";
import { chooseMove, LEVELS, MATE, Searcher } from "./search.ts";

const mv = (from: string, to: string): Move =>
  encodeMove(parseSquare(from), parseSquare(to));

function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  let n = 0;
  for (const m of pos.generate([])) {
    if (pos.makeMove(m)) n += perft(pos, depth - 1);
    pos.unmakeMove();
  }
  return n;
}

Deno.test("initial position move counts", () => {
  const pos = Position.initial();
  // 8 baidaq moves + 4 faras moves + 4 alfil moves (c1->a3,e3; f1->d3,h3)
  assertEquals(pos.legalMoves().length, 16);
  assertEquals(perft(pos, 2), 16 * 16);
});

Deno.test("make/unmake restores hash", () => {
  const pos = Position.initial();
  const h = [pos.hashLo, pos.hashHi];
  perft(pos, 3);
  assertEquals([pos.hashLo, pos.hashHi], h);
  assertEquals(pos.hashHistory.length, 1);
});

Deno.test("alfil leaps over pieces", () => {
  const pos = Position.fromPieces({
    c1: "E",
    d2: "P",
    e1: "K",
    e8: "k",
    a8: "r",
  });
  const moves = pos.legalMoves().map((m) => pos.toSAN(m));
  assert(moves.includes("Ee3"));
  assert(moves.includes("Ea3"));
});

Deno.test("ferz moves one step diagonally", () => {
  const pos = Position.fromPieces({ d4: "F", a1: "K", h8: "k", h7: "r" });
  const ferzMoves = pos.legalMoves().filter((m) =>
    Math.abs(pos.pieceAt(m & 127)) === FERZ
  );
  assertEquals(ferzMoves.length, 4);
});

Deno.test("baidaq promotes to ferz", () => {
  const pos = Position.fromPieces({ a7: "P", e1: "K", e8: "k", h8: "r" });
  const m = mv("a7", "a8");
  assertEquals(pos.toSAN(m), "a8=F");
  pos.makeMove(m);
  assertEquals(pos.pieceAt(parseSquare("a8")), FERZ);
  pos.unmakeMove();
  assertEquals(pos.pieceAt(parseSquare("a7")), 1);
});

Deno.test("baidaq has no double step", () => {
  const pos = Position.initial();
  assert(!pos.legalMoves().includes(mv("e2", "e4")));
  assert(pos.legalMoves().includes(mv("e2", "e3")));
});

Deno.test("checkmate and stalemate are both losses for the stalemated side", () => {
  const pos = Position.fromPieces(
    { a8: "k", a1: "R", c7: "K", h7: "p", h6: "P" },
    BLACK,
  );
  assertEquals(pos.result(), {
    over: true,
    winner: WHITE,
    reason: "checkmate",
  });

  const stale = Position.fromPieces(
    { h8: "k", f7: "K", g6: "F", a3: "p", a2: "P" },
    BLACK,
  );
  assertEquals(stale.result(), {
    over: true,
    winner: WHITE,
    reason: "stalemate",
  });
});

Deno.test("bare king loses", () => {
  const pos = Position.fromPieces(
    { e1: "K", a1: "R", h1: "R", e8: "k" },
    BLACK,
  );
  assertEquals(pos.result(), {
    over: true,
    winner: WHITE,
    reason: "bare-king",
  });
});

Deno.test("bare king can draw by baring back", () => {
  // Black just lost his last piece but can capture White's last piece.
  const pos = Position.fromPieces({ e1: "K", d7: "R", e8: "k" }, BLACK);
  assertEquals(pos.result(), { over: false });
  pos.makeMove(mv("e8", "d7"));
  assertEquals(pos.result(), { over: true, winner: 0, reason: "draw-bare" });
});

Deno.test("engine finds a mate in one", () => {
  const pos = Position.fromPieces({ g6: "K", b1: "R", h8: "k", a7: "p" });
  const res = new Searcher(pos.clone()).search({ maxDepth: 4, timeMs: 2000 });
  assertEquals(pos.toSAN(res.move), "Rb8#");
  assert(res.score > MATE - 10);
});

Deno.test("engine bares the king when possible", () => {
  const pos = Position.fromPieces({
    e1: "K",
    a1: "R",
    h1: "R",
    e8: "k",
    a5: "f",
  });
  const res = new Searcher(pos.clone()).search({ maxDepth: 3, timeMs: 2000 });
  assertEquals(pos.toSAN(res.move), "Rxa5");
});

Deno.test("all levels return a legal move from the start", () => {
  const pos = Position.initial();
  const legal = pos.legalMoves();
  for (const level of LEVELS.slice(0, 4)) {
    const r = chooseMove(pos, level.id);
    assert(legal.includes(r.move), `level ${level.id}`);
  }
});

Deno.test("SAN disambiguation", () => {
  const pos = Position.fromPieces({
    a1: "R",
    h1: "R",
    e2: "K",
    e8: "k",
    a7: "p",
  });
  assertEquals(pos.toSAN(mv("a1", "d1")), "Rad1");
  assertEquals(pos.toSAN(mv("h1", "d1")), "Rhd1");
});
