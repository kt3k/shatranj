/**
 * Integration with an optional native app shell (iOS / Android WebView),
 * through the gawa bridge (https://github.com/kt3k/gawa).
 *
 * The web build runs unchanged in a browser. When it is embedded in an app
 * that attaches a gawa bridge, the methods in {@link HostMethods} are
 * handled natively. Those types are generated from schema/host.json
 * ({@link ./host.gen.ts}). See docs/app-packaging.md.
 */
import { createBridge } from "gawa";
import type { Events, Methods, OpenedFile } from "./host.gen.ts";

export type { OpenedFile };

/** Public address of the web version, used for links shared from the app. */
export const PUBLIC_URL = "https://kt3k.github.io/shatranj/";

/** Origins an app shell serves the bundled page from. */
const APP_HOSTS = new Set(["appassets.androidplatform.net"]);

/** What an app shell implements. Generated from schema/host.json. */
export type HostMethods = Methods;

/** Events the app shell sends. Generated from schema/host.json. */
export type HostEvents = Events;

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
  host.call(method, params).catch((e: Error) =>
    console.error(`app shell: ${method} failed:`, e)
  );
  return true;
}

/** True while {@link drainOpenedFiles} is pulling files in. */
let importingOpened = false;

/**
 * Pulls `files.takeOpened` until the shell has nothing left. A second call
 * while one is in progress does nothing, so a `files.opened` event during
 * an import does not run two imports at once.
 */
export async function drainOpenedFiles(
  importBatch: (files: OpenedFile[]) => Promise<void>,
  take: () => Promise<OpenedFile[]> = () => host.call("files.takeOpened"),
): Promise<void> {
  if (importingOpened) return;
  importingOpened = true;
  try {
    for (;;) {
      const files = await take();
      if (files.length === 0) break;
      await importBatch(files);
    }
  } catch (e) {
    console.error("opening files from the app failed:", e);
  } finally {
    importingOpened = false;
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
