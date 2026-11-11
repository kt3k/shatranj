# shatranj をネイティブアプリに埋め込む

## iOS アプリを Xcode なしで実機に入れる

GitHub Actions の `ios app` ワークフローが、main への push と手動実行 (Actions →
ios app → Run workflow) のたびに署名なしの `Shatranj.ipa` を成果物として作る (30
日保存)。PC (Windows / Mac) のサイドロードツールで 自分の Apple ID
で署名して入れる。

1. 実行結果ページの Artifacts から `Shatranj-ipa-<commit>` をダウンロードし、
   展開して `Shatranj.ipa` を取り出す。
2. [Sideloadly](https://sideloadly.io/) (または AltStore) を入れる。Windows では
   Apple のサイトから iTunes と iCloud を入れておく (Microsoft Store
   版は不可のことがある)。
3. iPhone を USB で接続して「このコンピュータを信頼」。
4. Sideloadly に IPA をドラッグし、Apple ID を入れて Start。
5. iPhone で「設定 → プライバシーとセキュリティ → デベロッパモード」をオン (iOS
   16 以降、要再起動)、「設定 → 一般 → VPN とデバイス管理」で開発元を信頼。

無料の Apple ID では 7 日で起動できなくなるので、同じ IPA で再署名する
(ビルドし直す必要はない)。同時に入れられるのは 3 アプリまで。Apple ID
をサードパーティのツールに渡すことになるので、気になる場合は検証用の Apple ID
を使う。

## Android アプリを入れる

GitHub Actions の `android app` ワークフローが、main への push と手動実行
(Actions → android app → Run workflow) のたびにデバッグ署名の `Shatranj.apk`
を成果物として作る (30 日保存)。

1. 実行結果ページの Artifacts から `Shatranj-apk-<commit>` をダウンロードし、
   展開して `Shatranj.apk` を取り出す。
2. Android 端末で APK を開き、「この提供元のアプリを許可」してインストールする
   (PC からなら `adb install Shatranj.apk`)。

デバッグ署名の鍵は CI の実行ごとに変わるので、新しい APK
で上書きできないときは一度アンインストールする (棋譜も消えるので、先に
「すべて書き出す」で PGN を保存しておく)。Google Play
に出すときはリリース署名の鍵を Secrets に置いて `assembleRelease` /
`bundleRelease` にする。

## Android アプリをローカルでビルドする

[`app/android`](../app/android) は gawa を使った最小のアプリシェル (Kotlin、
minSdk 24 / targetSdk 35)。gawa の Android ライブラリは
`app/android/gradle.properties` の `gawaRevision` のコミットを初回ビルド時に
`app/android/.gawa/` へ clone してソースからビルドする (web の `deno.json` と
iOS の `project.yml` と同じコミットに揃える)。必要なもの: JDK 17 と Android SDK
(Android Studio に付属)。

```sh
deno install && deno task build      # dist/ を作る
cd app/android && ./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

Android Studio で `app/android` を開いてもよい。デバッグビルドは PC の Chrome の
`chrome://inspect` から WebView を検証できる。

アプリシェルが実装していること: `WebViewAssetLoader` で
`https://appassets.androidplatform.net/` から配信、`files.save`
(キャッシュに書いて 共有シート)、`share.link`
(共有シート)、`<input type="file">` のファイル選択、 戻るボタン (WebView
の履歴を戻り、最初の画面ならアプリを閉じる)、edge-to-edge
(システムバーと切り欠きの分は WebView
の外側に余白を取る)、レンダラーが落ちたときの 再生成、ライト / ダークのテーマ
(ページの `prefers-color-scheme` に反映)。

## アプリアイコン

元データは [`design/app-icon.svg`](../design/app-icon.svg)
(円城バグダードと盤)。 各サイズはこれから作っている:

| 用途       | ファイル                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| iOS        | `app/ios/Sources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` (1024px、アルファなし。Xcode が各サイズを生成) |
| Android 8+ | `res/drawable/ic_launcher_{background,foreground,monochrome}.xml` (アダプティブアイコン。前景は中央 66dp に収める)   |
| Android 7  | `res/mipmap/ic_launcher.xml`                                                                                         |
| Web        | `static/favicon.svg`、`static/apple-touch-icon.png` (180px)                                                          |

デザインを変えたら上のすべてを作り直す (PNG は SVG をブラウザで描画して
書き出し、アルファチャンネルを外す)。

## iOS アプリを実機で動かす

[`app/ios`](../app/ios) は gawa を使った最小のアプリシェル (XcodeGen +
SwiftUI)。必要なもの: Mac と Xcode、iOS 15 以上の iPhone (iOS 16
以降はデベロッパモードをオン)、Apple ID (無料の Personal Team
でも自分の端末なら可。署名は 7 日で失効)。

```sh
brew install xcodegen deno
deno install && deno task build      # dist/ を作る
cd app/ios && xcodegen generate && open Shatranj.xcodeproj
```

Xcode の Signing & Capabilities で Team を選び、Bundle Identifier
を自分用に変えてから実機を選んで Run。初回は iPhone の「設定 → 一般 → VPN
とデバイス管理」で開発元を信頼する。デバッグ時は Mac の Safari の
「開発」メニューから Web インスペクタが使える。

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
| セーフエリア         | `viewport-fit=cover` + `env(safe-area-inset-*)`。ヘッダー・本文・トースト・ダイアログが余白を取る                                                          |
| CSP                  | `index.html` に `script-src 'self'` などの CSP。インラインスクリプト・`on*` 属性はなし (テーマ初期化は `theme.js`)                                         |
| 戻る操作             | ダイアログと棋譜の閲覧モードは History API のエントリを持つ。「戻る」でダイアログが閉じ、閲覧モードから元の対局に戻る                                      |

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

### 2. gawa ブリッジとホストメソッド

ネイティブとの通信には [gawa](https://github.com/kt3k/gawa) を使う (`deno.json`
の `gawa` で版を固定)。アプリは `GawaBridge` を WebView
に取り付け、`src/ui/host.ts` の `HostMethods` を実装する。送信元オリジンの検証と
メインフレーム限定は gawa が行う。

| メソッド     | パラメータ                 | アプリ側の処理                                                                       |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------ |
| `files.save` | `name`, `mimeType`, `text` | 一時ファイルに書き出し、共有シート / `ACTION_SEND` (または「ファイルに保存」) を開く |
| `share.link` | `url`, `title`             | 共有シート / `ACTION_SEND` (`text/plain`) を開く                                     |

ブリッジがない場合、ページはブラウザ用の処理にフォールバックするが、WebView では
PGN のダウンロードが動かない。

iOS の実装は [`app/ios`](../app/ios) を参照。

### 3. Android: ファイル選択

PGN の読み込みは `<input type="file">`。Android は
`WebChromeClient.onShowFileChooser` を実装しないとタップしても何も起きない
(`ActivityResultContracts.GetMultipleContents` などで `ValueCallback` に返す)。
iOS は追加実装不要。

### 4. 外部リンクへの遷移

自オリジン以外へのナビゲーションはシステムブラウザに渡す (Android
`shouldOverrideUrlLoading`、iOS `decidePolicyFor navigationAction`)。

### 5. Android: 戻るボタン

`OnBackPressedCallback` で `webView.canGoBack()` なら `webView.goBack()`、
そうでなければ既定の動作 (アプリを閉じる) にする。ページ側はダイアログと
閲覧モードを履歴エントリにしているので、これだけで「戻る」が期待どおり
ダイアログを閉じ、閲覧中の棋譜から対局に戻る。

### 6. エッジ・トゥ・エッジ

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
- iOS の `webViewWebContentProcessDidTerminate` で再読み込み。
- iOS の `Info.plist` で対応言語 (`CFBundleLocalizations`) を宣言し、
  `navigator.languages` が端末の言語を反映するようにする。
