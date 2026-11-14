import { assertEquals } from "@std/assert";
import { callHost, PUBLIC_URL, shareBase } from "./host.ts";

const at = (href: string) => new URL(href) as unknown as Location;

Deno.test("host: share links keep the page's own address on the web", () => {
  assertEquals(
    shareBase(at("https://kt3k.github.io/shatranj/index.html#g=x")),
    "https://kt3k.github.io/shatranj/index.html",
  );
  assertEquals(
    shareBase(at("http://localhost:8000/")),
    "http://localhost:8000/",
  );
});

Deno.test("host: callHost does nothing in a browser", () => {
  assertEquals(
    callHost("files.save", {
      name: "a.pgn",
      mimeType: "application/x-chess-pgn",
      text: "*",
    }),
    false,
  );
});

Deno.test("host: share links point to the public site inside an app", () => {
  for (
    const href of [
      "https://appassets.androidplatform.net/assets/www/index.html",
      "app://localhost/index.html",
      "file:///var/containers/Bundle/www/index.html",
    ]
  ) {
    assertEquals(shareBase(at(href)), PUBLIC_URL);
  }
});
