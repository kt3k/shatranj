/**
 * Writes `dist/licenses.html`: the licence of every third-party work shipped
 * in the build (fonts, CSS, the gawa bridge and the icons), read from the
 * packages themselves so the page cannot drift from what is bundled.
 */

/** [title, what it is used for, licence file]. */
const WORKS: [string, string, string][] = [
  ["Inter", "Font", "node_modules/@fontsource/inter/LICENSE"],
  ["Marcellus", "Font", "node_modules/@fontsource/marcellus/LICENSE"],
  ["Reem Kufi", "Font", "node_modules/@fontsource/reem-kufi/LICENSE"],
  ["Vazirmatn", "Font", "node_modules/@fontsource/vazirmatn/LICENSE"],
  [
    "Noto Sans Coptic",
    "Font",
    "node_modules/@fontsource/noto-sans-coptic/LICENSE",
  ],
  ["Tailwind CSS", "Styles", "node_modules/tailwindcss/LICENSE"],
  ["Basecoat", "Styles", "node_modules/basecoat-css/LICENSE.md"],
  ["gawa", "App bridge", "licenses/gawa.txt"],
  ["Lucide", "Icons", "licenses/lucide.txt"],
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function buildLicenses(dist: string) {
  const sections: string[] = [];
  for (const [title, use, file] of WORKS) {
    const text = (await Deno.readTextFile(file)).trim();
    sections.push(
      `<h2>${esc(title)} <span class="muted">· ${esc(use)}</span></h2>\n` +
        `<pre>${esc(text)}</pre>`,
    );
  }
  await Deno.writeTextFile(
    `${dist}/licenses.html`,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'" />
    <title>Licenses · Shatranj</title>
    <link rel="icon" href="favicon.svg" type="image/svg+xml" />
    <script src="theme.js"></script>
    <link rel="stylesheet" href="legal.css" />
  </head>
  <body>
    <main>
      <a class="back" href="index.html">← Shatranj</a>
      <h1>Licenses</h1>
      <p class="muted">Shatranj is built with the following works. Their licences are reproduced below.</p>
      ${sections.join("\n      ")}
    </main>
  </body>
</html>
`,
  );
}
