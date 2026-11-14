/**
 * The gawa commit is pinned in three places. They must be the same SHA.
 *
 * - deno.json import `gawa`
 * - app/android/gradle.properties `gawaRevision`
 * - app/ios/project.yml package `revision`
 */

export type PinSource = {
  path: string;
  text: string;
  sha: string;
};

const FILES: { path: string; pattern: RegExp }[] = [
  {
    path: "deno.json",
    pattern:
      /https:\/\/raw\.githubusercontent\.com\/kt3k\/gawa\/([0-9a-f]{40})\/web\/mod\.ts/,
  },
  {
    path: "app/android/gradle.properties",
    pattern: /^gawaRevision=([0-9a-f]{40})$/m,
  },
  {
    path: "app/ios/project.yml",
    pattern: /^ {4}revision: ([0-9a-f]{40})$/m,
  },
];

function repoFile(path: string): URL {
  return new URL(`../${path}`, import.meta.url);
}

export async function readPins(): Promise<PinSource[]> {
  const out: PinSource[] = [];
  for (const file of FILES) {
    const text = await Deno.readTextFile(repoFile(file.path));
    const found = text.match(file.pattern);
    if (!found) {
      throw new Error(`${file.path}: gawa pin not found`);
    }
    out.push({ path: file.path, text, sha: found[1] });
  }
  return out;
}

/** The shared SHA, or an error that lists each file when they differ. */
export function sharedSha(sources: PinSource[]): string {
  const unique = [...new Set(sources.map((s) => s.sha))];
  if (unique.length !== 1) {
    const lines = sources.map((s) => `  ${s.path}: ${s.sha}`);
    throw new Error(`gawa pins differ:\n${lines.join("\n")}`);
  }
  return unique[0];
}

export async function writePin(source: PinSource, sha: string): Promise<void> {
  if (!source.text.includes(source.sha)) {
    throw new Error(`${source.path}: pin ${source.sha} is not in the file`);
  }
  await Deno.writeTextFile(
    repoFile(source.path),
    source.text.replaceAll(source.sha, sha),
  );
}
