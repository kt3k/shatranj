// Generated from schema/host.json by schema/generate.ts. Do not edit.
export type RecordId = { id: string };
export type OpenedFile = { name: string; text: string };

export type Methods = {
  "files.save": (p: { name: string; mimeType: string; text: string }) => void;
  "share.link": (p: { url: string; title: string }) => void;
  "records.list": () => string[];
  "records.put": (p: { id: string; json: string }) => void;
  "records.delete": (p: RecordId) => void;
  "records.get": (p: RecordId) => string | null;
  "files.takeOpened": () => OpenedFile[];
};

export type Events = {
  "files.opened": null;
};
