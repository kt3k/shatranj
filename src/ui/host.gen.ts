// Generated from schema/host.json by schema/generate.ts. Do not edit.
export type Methods = {
  "files.save": (p: { name: string; mimeType: string; text: string }) => void;
  "share.link": (p: { url: string; title: string }) => void;
  "records.list": () => string[];
  "records.put": (p: { id: string; json: string }) => void;
  "records.delete": (p: { id: string }) => void;
};

// deno-lint-ignore ban-types
export type Events = {};
