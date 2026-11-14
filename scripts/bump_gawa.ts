/**
 * Rewrite the three gawa pins to one commit.
 *
 *   deno task bump-gawa <sha>
 *
 * Refuses to write when the pins already differ. `deno install` afterwards
 * refreshes deno.lock for the new URL.
 */
import { readPins, sharedSha, writePin } from "./gawa_pin.ts";

const sha = Deno.args[0]?.toLowerCase();
if (!sha || !/^[0-9a-f]{40}$/.test(sha)) {
  console.error("usage: deno task bump-gawa <40-char sha>");
  Deno.exit(1);
}

let pins;
try {
  pins = await readPins();
  const current = sharedSha(pins);
  if (current === sha) {
    console.log(`gawa pin already ${sha}`);
    Deno.exit(0);
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  Deno.exit(1);
}

for (const source of pins) await writePin(source, sha);
console.log(`gawa pin is ${sha}`);
