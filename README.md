# Shatranj · شطرنج

Play **shatranj** — the medieval chess of the Abbasid court of Baghdad — against
the computer, right in your browser.

- Five opponents, from _Aladdin_ to _Hārūn al-Rashīd_ and the _Jinn_
- Authentic rules: firzān, fīl (alfil), bare king, stalemate wins
- Engine runs in a Web Worker (alpha-beta, transposition table, quiescence)
- Drag-and-drop, click or keyboard play; take back, hints, dark mode
- Click any move in the list (or use ← →) to review earlier positions
- Game review: the engine classifies every move (best … blunder), shows the
  better move on the board, an evaluation graph and accuracy for both sides
- Interface in 12 languages — English, 日本語, العربية, فارسی, Español, Deutsch,
  Français, Русский, Türkçe, 中文, 한국어 and Coptic (ⲧⲙⲛ̄ⲧⲣⲙ̄ⲛ̄ⲕⲏⲙⲉ, the language
  of 9th-century Egypt); right-to-left layout for Arabic and Persian; picks your
  browser language, switch any time
- Works offline: fonts are self-hosted, nothing is loaded from a CDN
- Game records: every game is saved in the browser (IndexedDB) and listed in a
  library — open any game to replay or review it, download one or all as PGN,
  import PGN files, or copy a share link that encodes the whole game in the URL
  (no server involved)

## Development

Requires [Deno](https://deno.com) 2.x.

```sh
deno install          # fetch npm deps (tailwindcss, basecoat-css)
deno task dev         # build, watch and serve on http://localhost:8000
deno task test        # engine, host, and library tests
deno task check       # types, lint, format, gawa pin, generated bridge types
deno task gen         # regenerate bridge types from schema/host.json
deno task bump-gawa   # deno task bump-gawa <sha> — rewrite the three gawa pins
deno task build       # production build into dist/
```

Stack: Deno (`deno bundle`), Tailwind CSS v4,
[Basecoat](https://basecoatui.com).

## Embedding in a native app

The `dist/` build can be bundled into an iOS / Android app and shown in a
WebView. The shell talks to the page through
[gawa](https://github.com/kt3k/gawa). The commit is pinned in `deno.json`,
`app/android/gradle.properties`, and `app/ios/project.yml` (kept in step by
`deno task check`). Bridge types are generated from `schema/host.json`
(`deno task gen`). See [docs/app-packaging.md](docs/app-packaging.md) for what
the app shell must provide, and
[docs/native-webview-html-embedding.md](docs/native-webview-html-embedding.md)
for general best practices.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds and
deploys `dist/` to GitHub Pages. In the repository settings, set **Pages → Build
and deployment → Source** to **GitHub Actions**.

## Rules in brief

| Piece  | Arabic | Moves                                                     |
| ------ | ------ | --------------------------------------------------------- |
| Shāh   | شاه    | one square any direction                                  |
| Firzān | فرزان  | one square diagonally                                     |
| Fīl    | فيل    | leaps exactly two squares diagonally                      |
| Faras  | فرس    | like a knight                                             |
| Rukh   | رخ     | like a rook                                               |
| Baidaq | بيدق   | one step forward, captures diagonally; promotes to firzān |

Checkmate, stalemate and baring the opponent's king all win.
