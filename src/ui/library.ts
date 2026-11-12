/**
 * The game library: saved game records.
 *
 * - In a browser they live in IndexedDB, with an in-memory fallback when
 *   IndexedDB is unavailable (e.g. some private modes) so the UI still works
 *   for the session.
 * - Inside an app shell they are kept by the app itself (`records.*` host
 *   methods), not in the WebView's storage, which the system may clear.
 *   Records an older version of the app left in IndexedDB are moved over
 *   the first time.
 */
import type { Color, Move } from "../engine/position.ts";
import { host } from "./host.ts";

export interface GameRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  moves: Move[];
  /** Where it came from: played here, imported from PGN, or opened from a link. */
  source: "played" | "imported" | "shared";
  /** For played games: which side the human had and the opponent level. */
  player?: Color;
  level?: number;
  /** For imported games: names from the PGN tags. */
  white?: string;
  black?: string;
  /** Outcome when the game was saved (recomputed on load anyway). */
  winner?: Color | 0 | null;
  reason?: string;
  /** Whose game this is: the player's own, or someone else's (shared or
   * imported). Saving a shared game does not make it the player's. */
  owner?: "me" | "other";
  /** The time of day is not known (imported without a PGN Time tag). */
  timeUnknown?: boolean;
  /** A played game that was left unfinished when a new one started. */
  abandoned?: boolean;
  /** Review data when the game was analysed. */
  review?: { scores: (number | null)[]; best: (Move | null)[] };
}

const DB_NAME = "shatranj";
const STORE = "games";

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memory = new Map<string, GameRecord>();

function openDB(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" }).createIndex(
            "updatedAt",
            "updatedAt",
          );
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** Native storage in the app shell, or null in a browser (or an app shell
 * too old to keep records). Moves IndexedDB records over the first time. */
let nativePromise: Promise<boolean> | null = null;
function useNative(): Promise<boolean> {
  nativePromise ??= (async () => {
    if (!host.available) return false;
    try {
      await host.call("records.list");
    } catch {
      return false;
    }
    await moveFromIndexedDB();
    return true;
  })();
  return nativePromise;
}

async function moveFromIndexedDB() {
  try {
    if (!(await openDB())) return;
    const old = await tx<GameRecord[]>("readonly", (s) => s.getAll());
    for (const rec of old) {
      await host.call("records.put", { id: rec.id, json: JSON.stringify(rec) });
      await tx("readwrite", (s) => s.delete(rec.id));
    }
  } catch (e) {
    console.error("moving records to the app failed:", e);
  }
}

/** True when records survive a reload. */
export async function isPersistent(): Promise<boolean> {
  return (await useNative()) || (await openDB()) !== null;
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then((db) =>
    new Promise<T>((resolve, reject) => {
      if (!db) return reject(new Error("no db"));
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    })
  );
}

export async function putRecord(rec: GameRecord): Promise<void> {
  memory.set(rec.id, rec);
  try {
    if (await useNative()) {
      await host.call("records.put", { id: rec.id, json: JSON.stringify(rec) });
    } else await tx("readwrite", (s) => s.put(rec));
  } catch {
    // memory fallback already holds it
  }
}

export async function getRecord(id: string): Promise<GameRecord | undefined> {
  if (await useNative()) {
    return (await listRecords()).find((r) => r.id === id);
  }
  try {
    return (await tx<GameRecord | undefined>("readonly", (s) => s.get(id))) ??
      memory.get(id);
  } catch {
    return memory.get(id);
  }
}

export async function deleteRecord(id: string): Promise<void> {
  memory.delete(id);
  try {
    if (await useNative()) await host.call("records.delete", { id });
    else await tx("readwrite", (s) => s.delete(id));
  } catch {
    // ignore
  }
}

async function readAll(): Promise<GameRecord[]> {
  if (await useNative()) {
    const out: GameRecord[] = [];
    for (const json of await host.call("records.list")) {
      try {
        out.push(JSON.parse(json));
      } catch {
        // skip a damaged record rather than losing the whole list
      }
    }
    return out;
  }
  return await tx<GameRecord[]>("readonly", (s) => s.getAll());
}

/** All records, most recent first. */
export async function listRecords(): Promise<GameRecord[]> {
  let all: GameRecord[];
  try {
    all = await readAll();
    for (const r of memory.values()) {
      if (!all.some((a) => a.id === r.id)) all.push(r);
    }
  } catch {
    all = [...memory.values()];
  }
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
