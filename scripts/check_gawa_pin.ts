/**
 * Fails when the three gawa pins are not the same commit.
 * See scripts/gawa_pin.ts.
 */
import { readPins, sharedSha } from "./gawa_pin.ts";

try {
  sharedSha(await readPins());
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  Deno.exit(1);
}
