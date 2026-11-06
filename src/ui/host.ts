/**
 * Integration with an optional native app shell (iOS / Android WebView).
 *
 * The web build runs unchanged in a browser. When it is embedded in an app,
 * the app registers a message handler named `shatranj`:
 *
 * - iOS:     `WKUserContentController.add(_:name: "shatranj")`
 *            → `window.webkit.messageHandlers.shatranj.postMessage(json)`
 * - Android: `WebViewCompat.addWebMessageListener(webView, "shatranj", …)`
 *            → `window.shatranj.postMessage(json)`
 *
 * Messages are JSON strings of {@link HostMessage}. They are one-way: the
 * page never waits for an answer.
 *
 * See docs/native-webview-html-embedding.md and docs/app-packaging.md.
 */

/** Public address of the web version, used for links shared from the app. */
export const PUBLIC_URL = "https://kt3k.github.io/shatranj/";

/** Origins an app shell serves the bundled page from. */
const APP_HOSTS = new Set(["appassets.androidplatform.net"]);

export type HostMessage =
  /** Save (or share) a text file, e.g. a PGN. */
  | { type: "saveFile"; name: string; mimeType: string; text: string }
  /** Open the system share sheet for a link. */
  | { type: "shareLink"; url: string; title: string };

type Poster = { postMessage(message: string): void };

function poster(): Poster | null {
  // deno-lint-ignore no-explicit-any
  const g = globalThis as any;
  return g.webkit?.messageHandlers?.shatranj ??
    (typeof g.shatranj?.postMessage === "function" ? g.shatranj : null);
}

/** True when running inside an app shell that handles {@link HostMessage}s. */
export const inApp = () => poster() !== null;

/** Sends a message to the app shell; returns false when there is none. */
export function postToHost(message: HostMessage): boolean {
  const p = poster();
  if (!p) return false;
  try {
    p.postMessage(JSON.stringify(message));
    return true;
  } catch {
    return false;
  }
}

/**
 * Base URL for shareable links: the page's own address on the web, or the
 * public site when the page is served from inside an app (custom scheme,
 * `file:` or the Android asset host), where its address means nothing to
 * anyone else.
 */
export function shareBase(loc: Location = location): string {
  const web = (loc.protocol === "https:" || loc.protocol === "http:") &&
    !APP_HOSTS.has(loc.hostname);
  return web ? `${loc.origin}${loc.pathname}` : PUBLIC_URL;
}
