/**
 * Regenerate the host bridge types with gawa's schema generator.
 *
 *   deno task gen
 *   deno task gen -- --check
 *
 * `schema/generate.ts` at the pinned commit reads `schema/example.json` and
 * writes the example apps. It takes no arguments for another schema, other
 * output paths, or the Kotlin package (see schema/host.json). This fetches
 * that file and points those paths at this repository. Types the generator
 * cannot express stay hand-written.
 */
import { readPins, sharedSha } from "./gawa_pin.ts";

const repo = new URL("../", import.meta.url);
const schemaPath = new URL("schema/host.json", repo);
const outputs = {
  "examples/web/src/methods.ts": new URL("src/ui/host.gen.ts", repo),
  "examples/ios/Sources/ExampleTypes.swift": new URL(
    "app/ios/Sources/HostTypes.swift",
    repo,
  ),
  "examples/android/src/main/kotlin/io/github/kt3k/gawa/example/ExampleTypes.kt":
    new URL(
      "app/android/app/src/main/kotlin/io/github/kt3k/shatranj/HostTypes.kt",
      repo,
    ),
};

const check = Deno.args.includes("--check");

function replaceNewUrl(src: string, marker: string, dest: URL): string {
  const idx = src.indexOf(marker);
  if (idx < 0) {
    throw new Error(
      `pinned schema/generate.ts has no ${marker}; the generator moved`,
    );
  }
  const start = src.lastIndexOf("new URL(", idx);
  if (start < 0) throw new Error(`no new URL( before ${marker}`);
  let depth = 0;
  let end = -1;
  for (let j = start; j < src.length; j++) {
    if (src[j] === "(") depth++;
    else if (src[j] === ")") {
      depth--;
      if (depth === 0) {
        end = j + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error(`unbalanced new URL( for ${marker}`);
  return src.slice(0, start) + JSON.stringify(dest.pathname) + src.slice(end);
}

async function generatorSource(pin: string): Promise<string> {
  const url =
    `https://raw.githubusercontent.com/kt3k/gawa/${pin}/schema/generate.ts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
  let src = await res.text();
  src = replaceNewUrl(src, '"./example.json"', schemaPath);
  for (const [marker, dest] of Object.entries(outputs)) {
    src = replaceNewUrl(src, marker, dest);
  }
  src = src.replaceAll("schema/example.json", "schema/host.json");
  const pkg = "package io.github.kt3k.gawa.example";
  if (!src.includes(pkg)) {
    throw new Error("pinned schema/generate.ts has no example Kotlin package");
  }
  src = src.replaceAll(pkg, "package io.github.kt3k.shatranj");
  if (src.includes("example.json") || src.includes("examples/")) {
    throw new Error("schema/generate.ts still points at the gawa example");
  }
  return src;
}

async function formatGenerated(url: URL): Promise<void> {
  const fmt = await new Deno.Command(Deno.execPath(), {
    args: ["fmt", url.pathname],
  }).output();
  if (!fmt.success) {
    console.error(new TextDecoder().decode(fmt.stderr));
    throw new Error(`deno fmt failed on ${url.pathname}`);
  }
}

async function readOrNull(url: URL): Promise<string | null> {
  try {
    return await Deno.readTextFile(url);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return null;
    throw e;
  }
}

async function restore(saved: Map<URL, string | null>): Promise<void> {
  for (const [url, text] of saved) {
    if (text === null) {
      try {
        await Deno.remove(url);
      } catch (e) {
        if (!(e instanceof Deno.errors.NotFound)) throw e;
      }
    } else await Deno.writeTextFile(url, text);
  }
}

const saved = new Map<URL, string | null>();
for (const url of Object.values(outputs)) saved.set(url, await readOrNull(url));

try {
  const pin = sharedSha(await readPins());
  const tmp = await Deno.makeTempFile({ suffix: ".ts" });
  await Deno.writeTextFile(tmp, await generatorSource(pin));
  const run = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", tmp],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const stdout = new TextDecoder().decode(run.stdout);
  const stderr = new TextDecoder().decode(run.stderr);
  if (!run.success) {
    if (stdout) console.error(stdout);
    if (stderr) console.error(stderr);
    throw new Error("schema/generate.ts failed");
  }
  const tsOut = outputs["examples/web/src/methods.ts"];
  await formatGenerated(tsOut);
  // An empty event list is `{}` after formatting, which deno lint rejects.
  // The schema has no expressible events (schema/host.json).
  const ts = await Deno.readTextFile(tsOut);
  const empty = "export type Events = {};\n";
  if (ts.includes(empty) && !ts.includes("deno-lint-ignore ban-types")) {
    await Deno.writeTextFile(
      tsOut,
      ts.replace(empty, "// deno-lint-ignore ban-types\n" + empty),
    );
    await formatGenerated(tsOut);
  }

  if (!check) {
    if (stdout.trim()) console.log(stdout.trim());
  } else {
    const changed: URL[] = [];
    for (const url of Object.values(outputs)) {
      const next = await Deno.readTextFile(url);
      if (saved.get(url) !== next) changed.push(url);
    }
    if (changed.length > 0) await reportDrift(changed);
  }
} catch (e) {
  await restore(saved);
  console.error(e instanceof Error ? e.message : e);
  Deno.exit(1);
}

async function reportDrift(changed: URL[]): Promise<void> {
  for (const url of changed) {
    const before = saved.get(url);
    const after = await readOrNull(url);
    if (before == null || after == null || before === after) {
      console.error(`${url.pathname} is missing or changed`);
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
}
