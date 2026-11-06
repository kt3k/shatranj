# ネイティブアプリへの HTML 埋め込み: ベストプラクティス

iOS / Android のネイティブアプリに Web コンテンツ (HTML / CSS / JS)
を同梱し、WebView で表示する場合の推奨パターンをまとめる。特定のフレームワーク
(React Native, Capacitor など) に依存しない、OS の WebView API
を直接使う前提で書く。

調査日: 2026-11。

## TL;DR

1. **同梱する**。オフラインで動き、起動が速く、ネットワーク帯域も使わない。
2. **`file://`
   で開かない**。アプリ内で「本物らしいオリジン」を作り、そこから配信する。
   - Android: `WebViewAssetLoader` → `https://appassets.androidplatform.net/`
   - iOS: `WKURLSchemeHandler` → `app://localhost/` などの独自スキーム
3. **アセット参照は相対パス**
   にしておき、スキームやホストをコードに埋め込まない。
4. **`allowFileAccessFromFileURLs` / `allowUniversalAccessFromFileURLs`
   などの緩和設定に頼らない**。
5. ネイティブとの通信は **オリジンを検証できる API** を使う。
6. 開発時は dev サーバー、リリース時は同梱物、と読み込み先を切り替える。

## なぜ `file://` を避けるのか

`file://` や `data:` で読み込んだページのオリジンは不透明 (`null`)
になる。その結果:

- `<script type="module">` や `fetch()` によるローカルファイル読み込みが CORS
  で失敗しやすい (Vite などモダンなバンドラの既定出力がそのまま動かない)
- Cookie / Storage / Service Worker / 一部 Web API
  の挙動が不安定、または使えない
- 回避のために `allowFileAccessFromFileURLs`
  等を有効にすると、ファイルシステムへの
  アクセス範囲が広がりセキュリティリスクになる (OWASP MASTG も無効化を推奨)

Android 公式ドキュメント "Load in-app content" は `file://` と `data:` URL
を「opaque origin なので強く非推奨」とし、`WebViewAssetLoader` を推奨している。
Cordova (iOS 6+ / Android 10+)、Capacitor、Tauri
といった主要ハイブリッドフレームワークも、いずれも `file://`
方式からアプリ内オリジン方式に移行済み。

| 実装                 | 配信オリジン                                                                       |
| -------------------- | ---------------------------------------------------------------------------------- |
| Android 素の WebView | `https://appassets.androidplatform.net/`                                           |
| iOS 素の WKWebView   | 任意の独自スキーム (例 `app://localhost/`)                                         |
| Capacitor            | iOS `capacitor://localhost` / Android `https://localhost` (http も可)              |
| Cordova              | iOS `app://localhost` / Android `https://localhost`                                |
| Tauri v2             | Android `https://tauri.localhost` (Windows と同じ `https://<name>.localhost` 方式) |

## Android: `WebViewAssetLoader`

`androidx.webkit` の `WebViewAssetLoader` を `shouldInterceptRequest`
に繋ぎ、予約ドメイン `appassets.androidplatform.net` へのリクエストをアプリ内の
assets / res から返す。実際のネットワーク通信は発生しない。

```kotlin
private class LocalContentWebViewClient(
    private val assetLoader: WebViewAssetLoader,
) : WebViewClientCompat() {
    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest,
    ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)
}

// onCreate()
val assetLoader = WebViewAssetLoader.Builder()
    .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
    .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(this))
    .build()

webView.settings.allowFileAccess = false // 不要なので明示的に無効化
webView.webViewClient = LocalContentWebViewClient(assetLoader)
webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
```

ポイント:

- テキスト (HTML / JS / CSS) は `src/main/assets/`、画像などは `res/`
  に置くのが公式の推奨。 ただし Web ビルド成果物は丸ごと `assets/www/`
  に置くほうが扱いやすい。
- どの `PathHandler` にも当たらないパスはネットワークにフォールバックする。
  自前サイトのリソースと混在させる場合は `/assets/`
  のようなパスをアプリ内用に予約する。
- `setAllowFileAccess` の既定値は targetSdk 30 以上で
  `false`。`file:///android_asset/`
  自体はこのフラグに関係なく読めるが、上記の理由でそちらは使わない。
- ページがシンプルな単一 HTML でサブリソースの横取りが不要なら
  `loadDataWithBaseURL()` も公式に挙げられている選択肢 (引数の選び方に注意)。

## iOS: `WKURLSchemeHandler`

`http` / `https` は WKWebView
が予約しているため、ローカル配信には独自スキームを使う (Capacitor でも iOS だけ
`http(s)` にできないのはこのため)。iOS 11+。

```swift
import UniformTypeIdentifiers
import WebKit

final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root: URL

    init(root: URL) { self.root = root.standardizedFileURL }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }

        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL
        // ディレクトリトラバーサル対策: root 配下以外は拒否
        guard file.path.hasPrefix(root.path + "/"),
              let data = try? Data(contentsOf: file)
        else {
            let res = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!
            task.didReceive(res)
            task.didReceive(Data())
            task.didFinish()
            return
        }

        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType
            ?? "application/octet-stream"
        let res = HTTPURLResponse(
            url: url, statusCode: 200, httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": mime, "Content-Length": "\(data.count)"]
        )!
        task.didReceive(res)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

// セットアップ
let root = Bundle.main.url(forResource: "www", withExtension: nil)! // フォルダ参照で同梱
let config = WKWebViewConfiguration()
config.setURLSchemeHandler(BundleSchemeHandler(root: root), forURLScheme: "app")
let webView = WKWebView(frame: .zero, configuration: config)
webView.load(URLRequest(url: URL(string: "app://localhost/index.html")!))
```

ポイント:

- Web ビルド成果物は Xcode に **フォルダ参照 (青いフォルダ)** として追加し、
  Copy Bundle Resources に含める。
- `.js` は正しい JavaScript MIME で返すこと (ES モジュールは MIME
  を厳密にチェックする)。
- SPA のクライアントサイドルーティングを使うなら、存在しないパスを `index.html`
  にフォールバックさせる。
- やむを得ず `file://` を使う場合は `loadFileURL(_:allowingReadAccessTo:)`
  で読み取り範囲を同梱ディレクトリに限定する
  (ファイルシステム全体を許可しない)。

### iOS 独自スキームの既知の注意点

- 独自スキームのページは secure context の扱いが `https` と異なる場合がある。
  `https` ページから独自スキームのリソースを読むと mixed content
  としてブロックされる、 `fetch()` だけ失敗して XHR
  は通る、といった報告がある。ページ自体を独自スキームで開き、
  サブリソースも同じオリジンから読む構成にすると問題が起きにくい。
- Service Worker は独自スキームでは登録できない (WebKit
  がプロトコルをチェックする。 Tauri の macOS
  での報告)。オフライン対応は同梱でまかなうので通常は不要。
- OAuth などオリジン許可リストを要求する外部サービスでは `app://localhost`
  のような値を登録する必要があり、拒否されるサービスもある (Google
  認証で事例あり)。 認証はシステムブラウザ (`ASWebAuthenticationSession`)
  で行うのが無難。

## Web 側のビルド設定

- **相対パスで出力する**。Vite なら `base: './'`。 Android
  公式サンプルにも「スキームやドメインを後から変えられるよう相対 URL
  を使え」とある。
- 同一オリジン配信なら `type="module"` やコード分割はそのまま使える (`file://`
  方式だとここで詰まる)。
- 外部 CDN に依存しない。フォント・ライブラリもすべて同梱する。
- CSP を `<meta http-equiv="Content-Security-Policy">` で設定し、
  `script-src 'self'` を基本にする。インラインスクリプトは避ける。
- 小さな単一ページで済むなら、JS / CSS を 1 つの HTML にインライン化する
  (`vite-plugin-singlefile` 等) のも手軽な選択肢。ただしマルチページ不可、
  sourcemap が使えない、`public/`
  内のファイルはインライン化されない、などの制約がある。

## ネイティブとの通信 (ブリッジ)

- **Android**: `addJavascriptInterface` よりも `androidx.webkit` の
  `WebViewCompat.addWebMessageListener` を使い、許可するオリジンを
  `https://appassets.androidplatform.net` に限定する。
- **iOS**: `WKScriptMessageHandler` (返り値が要るなら
  `WKScriptMessageHandlerWithReply`) を使い、`message.frameInfo.securityOrigin`
  が自アプリのスキーム / ホストであることを検証する。
- メッセージは JSON にシリアライズし、種別 (`type`) と相関 ID を持たせて
  リクエスト / レスポンスを対応付ける。ネイティブ側は未知の `type`
  を必ず拒否する。
- 同梱コンテンツから外部サイトへ遷移させない。`shouldOverrideUrlLoading`
  (Android) / `decidePolicyFor navigationAction` (iOS)
  で自オリジン以外はシステムブラウザに渡す。
  外部ページにブリッジを触らせないため。

## 開発ワークフロー

- デバッグビルドでは dev サーバー (`http://<PC の IP>:5173` など)
  を読み込み、HMR を使う。 リリースビルドでは同梱物を読む。ビルド設定
  (BuildConfig / Info.plist / xcconfig) で切り替え、リリースに dev 用 URL や
  cleartext 許可が残らないようにする。
- デバッグ時のみ WebView のリモートデバッグを有効にする (Android
  `WebView.setWebContentsDebuggingEnabled(true)`、iOS 16.4+
  `webView.isInspectable = true`)。
- Web のビルドをネイティブのビルドに組み込む (Gradle タスク / Xcode Run Script)
  か、CI で Web をビルドしてから成果物をコピーする手順を固定する。

## 更新 (OTA) について

同梱の弱点は、Web 部分の変更にもアプリのリリースが必要になること、
古いアプリ版と Web サイトの内容がずれうること (Android 公式ドキュメントも指摘)。

- 同梱を基本にしつつ、Web 層だけを後から差し替える live update 方式が一般的
  (Capacitor 向けの Capgo / Capawesome などが商用提供)。
- Apple の審査ガイドラインには、ダウンロードしたインタープリタ型コードを
  「アプリの主目的を変えない」「他コードのストアにしない」「署名・サンドボックスを迂回しない」
  条件で認める例外がある。ただし条項番号や最新の文言は情報源ごとにばらつくため、
  採用前に Apple 公式の App Review Guidelines を直接確認すること。
- 差し替え用バンドルは署名・ハッシュ検証し、失敗時は同梱版にロールバックできるようにする。

## 選択肢の比較

| 方式                                 | 評価                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| 同梱 + アプリ内オリジン (本書の推奨) | 第一選択。オフライン可、起動が速い、Web 標準機能がほぼそのまま使える                 |
| 同梱 + 単一 HTML にインライン化      | 小規模なら最も手軽。アセットが多い / コード分割する場合は不向き                      |
| 同梱 + `file://`                     | 非推奨。オリジンが `null` になり、緩和設定に頼ることになる                           |
| アプリ内ローカル HTTP サーバー       | 本物の http オリジンが得られるが、ポートを他アプリから叩かれるリスク。Tauri も非推奨 |
| リモートホスト                       | 更新は自由だがオフライン・初回表示に弱い。審査上「Web サイトの包装」と見なされる懸念 |

## チェックリスト

- [ ] Web 成果物はアプリに同梱されている (CDN 依存なし)
- [ ] Android は `WebViewAssetLoader`、iOS は `WKURLSchemeHandler`
      で配信している
- [ ] `allowFileAccess` / `allowFileAccessFromFileURLs` /
      `allowUniversalAccessFromFileURLs` を有効にしていない
- [ ] アセット参照は相対パス
- [ ] iOS のスキームハンドラはパストラバーサルを防ぎ、正しい MIME を返す
- [ ] ブリッジはオリジンを検証し、未知のメッセージを拒否する
- [ ] 自オリジン以外へのナビゲーションはシステムブラウザに逃がす
- [ ] CSP を設定している
- [ ] dev サーバー URL・cleartext 許可・WebView デバッグはデバッグビルド限定
- [ ] (OTA を使う場合) バンドルの検証とロールバックがある

## 参考資料

- [Android Developers: Load in-app content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content)
- [Android Developers: WebViewAssetLoader](https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader)
- [Android Developers: WebView – Unsafe File Inclusion](https://developer.android.com/privacy-and-security/risks/webview-unsafe-file-inclusion)
- [OWASP MASTG-TEST-0032 (Android WebView local file access)](https://mas.owasp.org/MASTG/tests/android/MASVS-PLATFORM/MASTG-TEST-0032/)
- [OWASP MASTG-TEST-0077 (iOS WebView origin)](https://mas.owasp.org/MASTG/tests/ios/MASVS-PLATFORM/MASTG-TEST-0077/)
- [OWASP MASTG-TEST-0336 (iOS file access settings)](https://mas.owasp.org/MASTG/tests/ios/MASVS-PLATFORM/MASTG-TEST-0336/)
- [Apple Developer Forums: WKURLSchemeHandler and fetch](https://developer.apple.com/forums/thread/725916)
- [Apple Developer Forums: Loading Angular project in WKWebView (CORS)](https://developer.apple.com/forums/thread/705380)
- [WebKit Bugzilla 201180](https://bugs.webkit.org/show_bug.cgi?id=201180)
- [cordova-ios PR #866 (scheme handler)](https://github.com/apache/cordova-ios/pull/866)
- [Ionic Forum: Capacitor iOS scheme](https://forum.ionicframework.com/t/is-that-possible-to-change-ios-capacitor-scheme-from-capacitor-to-http-or-https/218036)
- [Tauri: custom protocol `.localhost` handling](https://github.com/tauri-apps/tauri/commit/ba025588f3559858f43547e8c04424c47a3c445b)
- [Tauri issue #13031 (Service Worker on custom scheme)](https://github.com/tauri-apps/tauri/issues/13031)
- [Tauri localhost plugin (security warning)](https://tauri.app/plugin/localhost)
- [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile)
- [Capawesome: Live Updates FAQ](https://capawesome.io/docs/cloud/live-updates/faq/)
