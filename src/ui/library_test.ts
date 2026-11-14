/**
 * Native record storage, with gawa's installMock standing in for the app.
 *
 * The module bridge is created when host.ts loads, so the mock is attached
 * to its own global and handed to the library through testingReset.
 * Deno has no IndexedDB: the browser fallback tested here is the in-memory
 * store, and the IndexedDB → app migration is covered by a legacy seam.
 */
import { assertEquals } from "@std/assert";
import { createBridge, installMock } from "gawa";
import {
  drainOpenedFiles,
  type HostEvents,
  type HostMethods,
  type OpenedFile,
} from "./host.ts";
import {
  deleteRecord,
  type GameRecord,
  getRecord,
  isPersistent,
  type LegacyLibrary,
  listRecords,
  putRecord,
  testingReset,
} from "./library.ts";

const g = {};
const handlers: Record<string, (params: unknown) => unknown> = {};
const store = new Map<string, string>();
const mock = installMock({ global: g, handlers });
const bridge = createBridge<HostMethods, HostEvents>({ global: g });

function game(id: string, updatedAt: number): GameRecord {
  return {
    id,
    createdAt: updatedAt,
    updatedAt,
    moves: [],
    source: "played",
  };
}

function installRecordHandlers(): void {
  handlers["records.list"] = () => [...store.values()];
  handlers["records.put"] = (p) => {
    const { id, json } = p as { id: string; json: string };
    store.set(id, json);
  };
  handlers["records.delete"] = (p) => {
    store.delete((p as { id: string }).id);
  };
  handlers["records.get"] = (p) => store.get((p as { id: string }).id) ?? null;
}

function calls(): string[] {
  return mock.calls.map((c) => c.method).filter((m) => m !== "gawa.methods");
}

async function withShell(
  fn: () => Promise<void>,
  opts?: { records?: boolean; legacy?: LegacyLibrary | null },
): Promise<void> {
  store.clear();
  for (const key of Object.keys(handlers)) delete handlers[key];
  mock.calls.length = 0;
  if (opts?.records !== false) installRecordHandlers();
  testingReset({ host: bridge, legacy: opts?.legacy ?? null });
  try {
    await fn();
  } finally {
    testingReset();
  }
}

/** An older shell: `gawa.methods` is `unknown_method`, so `host.has` is null. */
async function withLegacy(
  fn: (
    legacyMock: ReturnType<typeof installMock>,
    records: Map<string, string>,
  ) => Promise<void>,
  opts?: { records?: boolean },
): Promise<void> {
  const records = new Map<string, string>();
  const global = {};
  const legacyHandlers: Record<string, (params: unknown) => unknown> =
    opts?.records === false ? {} : {
      "records.list": () => [...records.values()],
      "records.put": (p) => {
        const { id, json } = p as { id: string; json: string };
        records.set(id, json);
      },
      "records.delete": (p) => {
        records.delete((p as { id: string }).id);
      },
      "records.get": (p) => records.get((p as { id: string }).id) ?? null,
    };
  const legacyMock = installMock({
    global,
    handlers: legacyHandlers,
    legacyMethods: true,
  });
  const legacyBridge = createBridge<HostMethods, HostEvents>({ global });
  testingReset({ host: legacyBridge });
  try {
    assertEquals(await legacyBridge.has("records.list"), null);
    assertEquals(await legacyBridge.has("records.get"), null);
    await fn(legacyMock, records);
  } finally {
    testingReset();
    legacyMock.uninstall();
  }
}

Deno.test("library: a browser with no IndexedDB keeps records in memory", async () => {
  testingReset();
  try {
    // Deno has no IndexedDB, so persistence is the in-memory fallback.
    assertEquals(await isPersistent(), false);
    const rec = game("web", 3);
    await putRecord(rec);
    assertEquals(await getRecord("web"), rec);
    assertEquals((await listRecords()).map((r) => r.id), ["web"]);
    await deleteRecord("web");
    assertEquals(await getRecord("web"), undefined);
    assertEquals(await listRecords(), []);
  } finally {
    testingReset();
  }
});

Deno.test("host.has: true and false", async () => {
  await withShell(async () => {
    assertEquals(await bridge.has("records.list"), true);
    assertEquals(await bridge.has("records.missing"), false);
  });
});

Deno.test("library: native list, put, delete, and get", async () => {
  await withShell(async () => {
    const older = game("old", 1);
    const newer = game("new", 5);
    await putRecord(older);
    await putRecord(newer);
    assertEquals(await getRecord("new"), newer);
    assertEquals((await listRecords()).map((r) => r.id), ["new", "old"]);
    mock.calls.length = 0;
    assertEquals(await getRecord("new"), newer);
    assertEquals(calls(), ["records.get"]);
    await deleteRecord("old");
    assertEquals(store.has("old"), false);
    assertEquals(await getRecord("old"), undefined);
    assertEquals(await isPersistent(), true);
  });
});

Deno.test("library: get falls back to list when the shell has no records.get", async () => {
  await withShell(async () => {
    delete handlers["records.get"];
    const rec = game("abc", 2);
    await putRecord(rec);
    mock.calls.length = 0;
    assertEquals(await getRecord("abc"), rec);
    assertEquals(calls().includes("records.get"), false);
    assertEquals(calls().includes("records.list"), true);
  });
});

Deno.test("library: has false keeps the web store and does not call records.list", async () => {
  await withShell(async () => {
    const rec = game("web", 4);
    await putRecord(rec);
    assertEquals(calls().includes("records.list"), false);
    assertEquals(calls().includes("records.put"), false);
    assertEquals(await isPersistent(), false);
    assertEquals(await getRecord("web"), rec);
    assertEquals(store.size, 0);
  }, { records: false });
});

Deno.test("library: legacyMethods makes has() null and probes records.list", async () => {
  await withLegacy(async (legacyMock, records) => {
    const rec = game("listed", 6);
    await putRecord(rec);
    legacyMock.calls.length = 0;
    assertEquals(await getRecord("listed"), rec);
    const methods = legacyMock.calls.map((c) => c.method).filter((m) =>
      m !== "gawa.methods"
    );
    assertEquals(methods.includes("records.get"), false);
    assertEquals(methods.includes("records.list"), true);
    assertEquals(records.has("listed"), true);
    assertEquals(await isPersistent(), true);
  });
});

Deno.test("library: legacy shell without records.list stays on the web store", async () => {
  await withLegacy(async (legacyMock) => {
    const rec = game("old-shell", 8);
    await putRecord(rec);
    assertEquals(await isPersistent(), false);
    assertEquals(await getRecord("old-shell"), rec);
    assertEquals(
      legacyMock.calls.some((c) => c.method === "records.put"),
      false,
    );
  }, { records: false });
});

Deno.test("library: records.get null or damaged text misses, and list skips damaged JSON", async () => {
  await withShell(async () => {
    store.set("bad", "not-json");
    store.set("good", JSON.stringify(game("good", 2)));
    assertEquals((await listRecords()).map((r) => r.id), ["good"]);
    assertEquals(await getRecord("missing"), undefined);
    store.set("bad", "not-json");
    assertEquals(await getRecord("bad"), undefined);
  });
});

Deno.test("library: a record only in memory is still listed", async () => {
  await withShell(async () => {
    const rec = game("mem", 9);
    await putRecord(rec);
    store.delete("mem");
    assertEquals((await listRecords()).map((r) => r.id), ["mem"]);
  });
});

Deno.test("library: legacy records move into the shell once", async () => {
  const rec = game("mig", 4);
  let reads = 0;
  const deleted: string[] = [];
  await withShell(async () => {
    await listRecords();
    assertEquals(store.get("mig"), JSON.stringify(rec));
    assertEquals(deleted, ["mig"]);
    await listRecords();
    assertEquals(reads, 1);
    assertEquals(await getRecord("mig"), rec);
  }, {
    legacy: {
      readAll() {
        reads++;
        return Promise.resolve([rec]);
      },
      delete(id) {
        deleted.push(id);
        return Promise.resolve();
      },
    },
  });
});

Deno.test("library: legacy records stay put when the shell has no records.list", async () => {
  let reads = 0;
  await withShell(async () => {
    assertEquals(await listRecords(), []);
    assertEquals(reads, 0);
  }, {
    records: false,
    legacy: {
      readAll() {
        reads++;
        return Promise.resolve([game("stay", 1)]);
      },
      delete() {
        return Promise.resolve();
      },
    },
  });
});

Deno.test("library: the shell override does not stick", async () => {
  testingReset();
  assertEquals(await isPersistent(), false);
});

Deno.test("files: takeOpened drains until the shell is empty", async () => {
  const files = {} as Record<string, unknown>;
  let n = 0;
  const local = installMock({
    global: files,
    handlers: {
      "files.takeOpened": () => {
        n++;
        if (n === 1) return [{ name: "a.pgn", text: "A" }];
        if (n === 2) return [{ name: "b.pgn", text: "B" }];
        return [];
      },
    },
  });
  const page = createBridge<HostMethods, HostEvents>({ global: files });
  const batches: string[][] = [];
  await drainOpenedFiles(
    (opened) => {
      batches.push(opened.map((f) => f.name));
      return Promise.resolve();
    },
    () => page.call("files.takeOpened"),
  );
  assertEquals(batches, [["a.pgn"], ["b.pgn"]]);
  local.uninstall();
});

Deno.test("files: files.opened imports what takeOpened returns", async () => {
  const files = {} as Record<string, unknown>;
  const queued: OpenedFile[][] = [[{ name: "a.pgn", text: "A" }], []];
  const local = installMock({
    global: files,
    handlers: {
      "files.takeOpened": () => queued.shift() ?? [],
    },
  });
  const page = createBridge<HostMethods, HostEvents>({ global: files });
  const seen: string[] = [];
  const pending: Promise<void>[] = [];
  page.on("files.opened", () => {
    pending.push(drainOpenedFiles(
      (opened) => {
        seen.push(opened[0].name);
        return Promise.resolve();
      },
      () => page.call("files.takeOpened"),
    ));
  });
  local.emit("files.opened");
  await Promise.all(pending);
  assertEquals(seen, ["a.pgn"]);
  local.uninstall();
});

Deno.test("files: a drain in progress ignores a nested drain", async () => {
  const files = {} as Record<string, unknown>;
  const queued: OpenedFile[][] = [[{ name: "a.pgn", text: "A" }], []];
  const local = installMock({
    global: files,
    handlers: {
      "files.takeOpened": () => queued.shift() ?? [],
    },
  });
  const page = createBridge<HostMethods, HostEvents>({ global: files });
  let outer = 0;
  let inner = 0;
  await drainOpenedFiles(
    async () => {
      outer++;
      await drainOpenedFiles(() => {
        inner++;
        return Promise.resolve();
      }, () => page.call("files.takeOpened"));
    },
    () => page.call("files.takeOpened"),
  );
  assertEquals(outer, 1);
  assertEquals(inner, 0);
  local.uninstall();
});

Deno.test("files: takeOpened failing does not throw, and a later drain runs", async () => {
  const files = {} as Record<string, unknown>;
  // "fail" rejects the call. "file" returns one PGN, then nothing.
  let mode: "fail" | "file" | "empty" = "fail";
  const local = installMock({
    global: files,
    handlers: {
      "files.takeOpened": () => {
        if (mode === "fail") throw new Error("boom");
        if (mode === "empty") return [];
        mode = "empty";
        return [{ name: "a.pgn", text: "A" }];
      },
    },
  });
  const page = createBridge<HostMethods, HostEvents>({ global: files });
  const seen: string[] = [];
  const take = () => page.call("files.takeOpened");
  const error = console.error;
  console.error = () => {};
  try {
    await drainOpenedFiles((opened) => {
      seen.push(opened[0].name);
      return Promise.resolve();
    }, take);
  } finally {
    console.error = error;
  }
  mode = "file";
  await drainOpenedFiles((opened) => {
    seen.push(opened[0].name);
    return Promise.resolve();
  }, take);
  assertEquals(seen, ["a.pgn"]);
  local.uninstall();
});
