import { assert, assertEquals } from "@std/assert";
import { encodeMove, parseSquare, Position } from "./position.ts";
import {
  analysePosition,
  classify,
  formatScore,
  gameAccuracy,
  moveAccuracy,
  reviewMoves,
  summarize,
  winChance,
} from "./analysis.ts";
import { MATE } from "./search.ts";

const mv = (f: string, t: string) => encodeMove(parseSquare(f), parseSquare(t));

Deno.test("win chance is symmetric and monotonic", () => {
  assertEquals(winChance(0), 0.5);
  assert(Math.abs(winChance(300) + winChance(-300) - 1) < 1e-9);
  assert(winChance(500) > winChance(100));
  assert(winChance(MATE - 3) > 0.99);
});

Deno.test("classification thresholds", () => {
  assertEquals(classify(30, true), "best");
  assertEquals(classify(1, false), "best");
  assertEquals(classify(4, false), "good");
  assertEquals(classify(8, false), "inaccuracy");
  assertEquals(classify(15, false), "mistake");
  assertEquals(classify(40, false), "blunder");
  assert(moveAccuracy(0) > 99.9);
  assert(moveAccuracy(50) < 15);
});

Deno.test("reviewMoves flags a hanging rukh as a blunder", () => {
  // Scores from the side to move. White is fine (0), then after White's move
  // Black is +520 (White hung a rukh). Black's reply keeps it.
  const moves = [mv("a1", "a2"), mv("e8", "d8")];
  const reviews = reviewMoves(moves, [0, 520, -520], [
    mv("e1", "d1"),
    moves[1],
  ]);
  assertEquals(reviews.length, 2);
  assertEquals(reviews[0].classification, "blunder");
  assertEquals(reviews[1].classification, "best");
  const white = summarize(reviews, 1);
  const black = summarize(reviews, -1);
  assertEquals(white.counts.blunder, 1);
  assert(black.accuracy > white.accuracy);
});

Deno.test("reviewMoves stops at the first unknown score", () => {
  const moves = [mv("a2", "a3"), mv("a7", "a6"), mv("b2", "b3")];
  assertEquals(
    reviewMoves(moves, [0, 0, null, 0], [null, null, null]).length,
    1,
  );
});

Deno.test("analysePosition scores finished games exactly", () => {
  const mated = Position.fromPieces(
    { a8: "k", a1: "R", c7: "K", h7: "p", h6: "P" },
    -1,
  );
  assertEquals(analysePosition(mated, 50), { score: -MATE, best: null });
  // Single legal move is still searched for a real score.
  const forced = Position.fromPieces({ a1: "K", b3: "R", h8: "k", c8: "r" });
  const r = analysePosition(forced, 100);
  assert(r.best !== null);
});

Deno.test("formatScore", () => {
  assertEquals(formatScore(140), "+1.4");
  assertEquals(formatScore(-30), "−0.3");
  assertEquals(formatScore(2), "0.0");
  assertEquals(formatScore(MATE - 5), "+M");
});

Deno.test("one blunder pulls game accuracy down noticeably", () => {
  const clean = gameAccuracy(Array(30).fill(0.5));
  const oneBlunder = gameAccuracy([...Array(29).fill(0.5), 40]);
  assert(clean > 97);
  assert(oneBlunder < clean - 8, `${oneBlunder}`);
  assertEquals(gameAccuracy([]), 0);
});
