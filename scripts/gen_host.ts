/**
 * Regenerate the host bridge types with the pinned gawa schema generator.
 *
 *   deno task gen
 *   deno task gen -- --check
 *
 * The generator is `schema/generate.ts` at the pinned commit:
 *
 *   deno run -A schema/generate.ts \
 *     --schema schema/host.json \
 *     --ts src/ui/host.gen.ts \
 *     --swift app/ios/Sources/HostTypes.swift \
 *     --kotlin app/android/app/src/main/kotlin/io/github/kt3k/shatranj/HostTypes.kt \
 *     --kotlin-package io.github.kt3k.shatranj
 */
import { readPins, sharedSha } from "./gawa_pin.ts";

const root = new URL("../", import.meta.url);
const outputs = [
  "src/ui/host.gen.ts",
  "app/ios/Sources/HostTypes.swift",
  "app/android/app/src/main/kotlin/io/github/kt3k/shatranj/HostTypes.kt",
];

const check = Deno.args.includes("--check");

function fileUrl(path: string): URL {
  return new URL(path, root);
}

async function readOrNull(path: string): Promise<string | null> {
  try {
    return await Deno.readTextFile(fileUrl(path));
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return null;
    throw e;
  }
}

async function restore(saved: Map<string, string | null>): Promise<void> {
  for (const [path, text] of saved) {
    const url = fileUrl(path);
    if (text === null) {
      try {
        await Deno.remove(url);
      } catch (e) {
        if (!(e instanceof Deno.errors.NotFound)) throw e;
      }
    } else await Deno.writeTextFile(url, text);
  }
}

const pin = sharedSha(await readPins());
const generator =
  `https://raw.githubusercontent.com/kt3k/gawa/${pin}/schema/generate.ts`;
const saved = new Map<string, string | null>();
for (const path of outputs) saved.set(path, await readOrNull(path));

const run = await new Deno.Command(Deno.execPath(), {
  args: [
    "run",
    "-A",
    generator,
    "--schema",
    "schema/host.json",
    "--ts",
    outputs[0],
    "--swift",
    outputs[1],
    "--kotlin",
    outputs[2],
    "--kotlin-package",
    "io.github.kt3k.shatranj",
  ],
  cwd: root.pathname,
  stdout: "piped",
  stderr: "piped",
}).output();
const stdout = new TextDecoder().decode(run.stdout);
const stderr = new TextDecoder().decode(run.stderr);
if (!run.success) {
  await restore(saved);
  if (stdout) console.error(stdout);
  if (stderr) console.error(stderr);
  Deno.exit(1);
}

if (!check) {
  if (stdout.trim()) console.log(stdout.trim());
  Deno.exit(0);
}

const changed: string[] = [];
for (const path of outputs) {
  const next = await Deno.readTextFile(fileUrl(path));
  if (saved.get(path) !== next) changed.push(path);
}
if (changed.length === 0) Deno.exit(0);

for (const path of changed) {
  const before = saved.get(path);
  const after = await readOrNull(path);
  if (before == null || after == null) {
    console.error(`${path} is missing or changed`);
    continue;
  }
  const a = await Deno.makeTempFile();
  const b = await Deno.makeTempFile();
  await Deno.writeTextFile(a, before);
  await Deno.writeTextFile(b, after);
  const diff = await new Deno.Command("diff", {
    args: ["-u", a, b],
    stdout: "piped",
  }).output();
  console.error(new TextDecoder().decode(diff.stdout));
}
console.error(
  "generated bridge types differ from schema/host.json; run deno task gen",
);
await restore(saved);
Deno.exit(1);
