/**
 * Build script: bundles TypeScript with `deno bundle`, compiles Tailwind CSS
 * (with Basecoat) and copies static assets into `dist/`.
 *
 *   deno task build            # production build
 *   deno task dev              # build, watch and serve on http://localhost:8000
 */
import { serveDir } from "@std/http/file-server";

const args = new Set(Deno.args);
const watch = args.has("--watch");
const serve = args.has("--serve");
const DIST = "dist";

async function run(cmd: string[], label: string) {
  const t = performance.now();
  const { code, stderr } = await new Deno.Command(Deno.execPath(), {
    args: cmd,
    stdout: "inherit",
    stderr: "piped",
  }).output();
  if (code !== 0) {
    console.error(new TextDecoder().decode(stderr));
    throw new Error(`${label} failed`);
  }
  console.log(`  ✓ ${label} (${Math.round(performance.now() - t)}ms)`);
}

async function copyDir(src: string, dest: string) {
  await Deno.mkdir(dest, { recursive: true });
  for await (const entry of Deno.readDir(src)) {
    const from = `${src}/${entry.name}`;
    const to = `${dest}/${entry.name}`;
    if (entry.isDirectory) await copyDir(from, to);
    else await Deno.copyFile(from, to);
  }
}

const bundleFlags = watch ? [] : ["--minify"];

async function buildJS() {
  await Promise.all([
    run(
      [
        "bundle",
        "--platform=browser",
        ...bundleFlags,
        "-o",
        `${DIST}/main.js`,
        "src/ui/main.ts",
      ],
      "main.js",
    ),
    run(
      [
        "bundle",
        "--platform=browser",
        ...bundleFlags,
        "-o",
        `${DIST}/worker.js`,
        "src/ui/worker.ts",
      ],
      "worker.js",
    ),
  ]);
}

async function buildCSS() {
  await run(
    [
      "run",
      "-A",
      "npm:@tailwindcss/cli",
      "-i",
      "src/styles.css",
      "-o",
      `${DIST}/styles.css`,
      ...(watch ? [] : ["--minify"]),
    ],
    "styles.css",
  );
}

async function buildAll() {
  console.log("Building…");
  await Deno.mkdir(DIST, { recursive: true });
  await copyDir("static", DIST);
  await Deno.writeTextFile(`${DIST}/.nojekyll`, "");
  await Promise.all([buildJS(), buildCSS()]);
}

await buildAll();

if (serve) {
  Deno.serve(
    { port: 8000 },
    (req) => serveDir(req, { fsRoot: DIST, quiet: true }),
  );
}

if (watch) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  for await (const _ of Deno.watchFs(["src", "static"])) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      buildAll().catch((e) => console.error(e.message));
    }, 120);
  }
}
