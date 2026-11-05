import { assert, assertEquals, assertThrows } from "@std/assert";
import { Position } from "./position.ts";
import { chooseMove } from "./search.ts";
import {
  canonicalMoves,
  decodeShare,
  encodeShare,
  parsePGN,
  PgnError,
  toPGN,
} from "./record.ts";

/** A reproducible full game between two weak engines. */
function sampleGame(plies = 400) {
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pos = Position.initial();
  const moves = [];
  for (let i = 0; i < plies && !pos.result().over; i++) {
    const m = chooseMove(pos, 1, random).move;
    moves.push(m);
    pos.makeMove(m);
  }
  return moves;
}

Deno.test("PGN round trip of a full game", () => {
  const moves = sampleGame();
  assert(moves.length > 20);
  const pgn = toPGN(moves, {
    White: "You",
    Black: "Aladdin (level 1)",
    Date: "2026.11.05",
  });
  assert(pgn.includes('[Variant "Shatranj"]'));
  assert(pgn.includes('[White "You"]'));
  const { games, errors } = parsePGN(pgn);
  assertEquals(errors, []);
  assertEquals(games.length, 1);
  assertEquals(games[0].moves, moves);
  assertEquals(games[0].tags.Black, "Aladdin (level 1)");
});

Deno.test("PGN: several games, comments, variations and aliases", () => {
  const text = `[Event "A"]
[White "x"]
[Black "y"]

1. e3 {quiet} e6 2. Nf3 (2. Ff2?? Fd7) Fd7 $1 2... ; comment
3. Bc3?! *

[Event "B"]

1. h3 h6 1-0
`;
  // "Bc3" uses the alias B for the fīl (E); from c1 it leaps to a3 or e3,
  // but e3 is occupied, so the only fīl move to c3 does not exist → error.
  const { games, errors } = parsePGN(text);
  assertEquals(games.length, 1);
  assertEquals(errors.length, 1);
  assertEquals(games[0].tags.Event, "B");

  const ok = parsePGN(`1. e3 e6 2. Ba3 Qe7 3. Fe2 *`);
  assertEquals(ok.errors, []);
  assertEquals(ok.games[0].moves.length, 5);
});

Deno.test("PGN escapes quotes in tags", () => {
  const pgn = toPGN([], { White: 'The "Vizier"' });
  assertEquals(parsePGN(pgn).games[0].tags.White, 'The "Vizier"');
});

Deno.test("share code round trip, size and canonical order", () => {
  const moves = sampleGame();
  const code = encodeShare(moves);
  assert(code.startsWith("2"));
  assertEquals(decodeShare(code), moves);
  // Close to the information content: sum of log2(legal moves) per ply.
  const pos = Position.initial();
  let bits = 0;
  for (const m of moves) {
    bits += Math.log2(canonicalMoves(pos).length);
    pos.makeMove(m);
  }
  const ideal = Math.ceil((bits + 16) / 6) + 1; // + ply count, version char
  assert(code.length <= ideal + 2, `${code.length} > ${ideal}`);
  // Clearly shorter than one byte per ply.
  assert(code.length < (moves.length * 4) / 3 * 0.8, `${code.length}`);
  assertEquals(decodeShare(encodeShare([])), []);
  // Canonical order is sorted by origin then destination square.
  const keys = canonicalMoves(Position.initial()).map((m) =>
    Position.initial().toSAN(m)
  );
  assertEquals(keys.slice(0, 4), ["Na3", "Nc3", "Ea3", "Ee3"]);
});

Deno.test("share code rejects garbage and other versions", () => {
  assertThrows(() => decodeShare("1CAkL"), PgnError); // v1 is not supported
  assertThrows(() => decodeShare("2!!"), PgnError);
  assertThrows(() => decodeShare("2"), PgnError); // no ply count
  // A valid ply count but a number too large for the game.
  assertThrows(() => decodeShare("2A_____________"), PgnError);
});
