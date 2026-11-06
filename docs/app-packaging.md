# shatranj をネイティブアプリに埋め込む

`deno task build` の成果物 `dist/` を iOS / Android アプリに同梱し、WebView
で表示するための要件。一般論は
[native-webview-html-embedding.md](native-webview-html-embedding.md) を参照。

## Web 側で対応済み

| 項目                 | 対応                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 外部 CDN 依存        | Web フォントは Fontsource から `dist/fonts/` に同梱 (`fonts.css`)。外部への通信はない                                                                      |
| `confirm` / `prompt` | `<dialog>` による自前 UI に置換 (WKWebView は `WKUIDelegate` 未実装だと `confirm` が常に false)                                                            |
| 共有リンク           | アプリ内オリジン (独自スキーム / `file:` / `appassets.androidplatform.net`) から開かれているときは公開 URL `https://kt3k.github.io/shatranj/` を基準にする |
| PGN 保存・リンク共有 | アプリシェルがあればメッセージで依頼する (下記)。なければ従来どおり `<a download>` / クリップボード                                                        |
| セーフエリア         | `viewport-fit=cover` + `env(safe-area-inset-*)`。ヘッダー・本文・トーストが余白を取る                                                                      |

## アプリシェルが必ず実装すること

### 1. アプリ内オリジンから配信し、オリジンを固定する

- Android: `WebViewAssetLoader` で
  `https://appassets.androidplatform.net/assets/www/index.html`
- iOS: `WKURLSchemeHandler` で `app://localhost/index.html` (スキーム名は任意)
- `file://` は不可。`main.js` は `type="module"`、AI は module Worker
  (`new Worker(new URL("./worker.js", import.meta.url), { type: "module" })`)
  なので、同一オリジン配信と `.js` の正しい MIME (`text/javascript`) が必須。
- 対局状態は `localStorage`、棋譜は IndexedDB
  に保存される。どちらもオリジン単位なので、
  **リリース後にスキーム・ホスト・パスを変えると全データが見えなくなる**。

### 2. `shatranj` メッセージハンドラ

ページは `src/ui/host.ts` の `HostMessage` を JSON 文字列で送る
(一方向、返信不要)。

- iOS: `userContentController.add(handler, name: "shatranj")`
- Android:
  `WebViewCompat.addWebMessageListener(webView, "shatranj", setOf("https://appassets.androidplatform.net"), listener)`

| `type`      | フィールド                 | アプリ側の処理                                                                       |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `saveFile`  | `name`, `mimeType`, `text` | 一時ファイルに書き出し、共有シート / `ACTION_SEND` (または「ファイルに保存」) を開く |
| `shareLink` | `url`, `title`             | 共有シート / `ACTION_SEND` (`text/plain`) を開く                                     |

ハンドラを登録しない場合、ページはブラウザ用の処理にフォールバックするが、
WebView では PGN のダウンロードが動かない。

受信時は送信元オリジン (iOS `message.frameInfo.securityOrigin`、Android
`sourceOrigin`) が自アプリのものか検証し、未知の `type` は無視すること。

### 3. Android: ファイル選択

PGN の読み込みは `<input type="file">`。Android は
`WebChromeClient.onShowFileChooser` を実装しないとタップしても何も起きない
(`ActivityResultContracts.GetMultipleContents` などで `ValueCallback` に返す)。
iOS は追加実装不要。

### 4. 外部リンクへの遷移

自オリジン以外へのナビゲーションはシステムブラウザに渡す (Android
`shouldOverrideUrlLoading`、iOS `decidePolicyFor navigationAction`)。

### 5. エッジ・トゥ・エッジ

WebView を画面全体に広げる (iOS は safe area を無視して配置、Android は
targetSdk 35 の既定動作)。余白はページ側の `env(safe-area-inset-*)`
が取る。Android の WebView で `env()` が 0 になる場合は、WebView を
`WindowInsets` の内側に配置する。

## 推奨 (未対応)

- 共有リンクの Universal Links / App Links 化:
  `https://kt3k.github.io/shatranj/#g=…` をアプリで開き、ハッシュを WebView の
  URL に付けて読み込む (`hashchange` で受け取れる)。
- 棋譜のネイティブストレージへの移行やバックアップ (現状は WebView の IndexedDB
  のみ)。
- Android の戻るボタンで開いているダイアログを閉じる。
- iOS の `webViewWebContentProcessDidTerminate` で再読み込み。
- iOS の `Info.plist` で対応言語 (`CFBundleLocalizations`) を宣言し、
  `navigator.languages` が端末の言語を反映するようにする。
