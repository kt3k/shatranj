/**
 * Integration with an optional native app shell (iOS / Android WebView),
 * through the gawa bridge (https://github.com/kt3k/gawa).
 *
 * The web build runs unchanged in a browser. When it is embedded in an app
 * that attaches a gawa bridge, the methods in {@link HostMethods} are
 * handled natively. See docs/app-packaging.md.
 */
import { createBridge } from "gawa";

/** Public address of the web version, used for links shared from the app. */
export const PUBLIC_URL = "https://kt3k.github.io/shatranj/";

/** Origins an app shell serves the bundled page from. */
const APP_HOSTS = new Set(["appassets.androidplatform.net"]);

/** What an app shell implements. */
export type HostMethods = {
  /** Save (or share) a text file, e.g. a PGN. */
  "files.save": (p: { name: string; mimeType: string; text: string }) => void;
  /** Open the system share sheet for a link. */
  "share.link": (p: { url: string; title: string }) => void;
  /** Game records kept by the app (one JSON document per record). */
  "records.list": () => string[];
  "records.put": (p: { id: string; json: string }) => void;
  "records.delete": (p: { id: string }) => void;
  /** PGN files opened with the app ("Open in Shatranj") since the last call. */
  "files.takeOpened": () => { name: string; text: string }[];
};

/** Events the app shell sends. */
export type HostEvents = {
  /** A file was opened with the app; fetch it with `files.takeOpened`. */
  "files.opened": null;
};

/** The bridge to the app shell; `host.available` is false in a browser. */
export const host = createBridge<HostMethods, HostEvents>();

/**
 * Asks the app shell to handle something; returns false when there is no
 * app shell (the caller then uses the web fallback).
 */
export function callHost<K extends keyof HostMethods>(
  method: K,
  params: Parameters<HostMethods[K]>[0],
): boolean {
  if (!host.available) return false;
  // deno-lint-ignore no-explicit-any
  (host.call as any)(method, params).catch((e: Error) =>
    console.error(`app shell: ${method} failed:`, e)
  );
  return true;
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
