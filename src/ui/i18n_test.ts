import { assertEquals } from "@std/assert";
import { allKeys, dictFor, LANGS, setLang, t } from "./i18n.ts";

const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/** Keys whose plural forms may differ per language (key.one / key.other). */
const base = (k: string) => k.replace(/\.(one|other)$/, "");

for (const { code } of LANGS) {
  Deno.test(`i18n: ${code} covers every English key with matching placeholders`, () => {
    const dict = dictFor(code);
    const en = dictFor("en");
    const missing: string[] = [];
    const mismatched: string[] = [];
    for (const key of allKeys()) {
      const variants = Object.keys(dict).filter((k) => base(k) === base(key));
      if (variants.length === 0) {
        missing.push(key);
        continue;
      }
      for (const v of variants) {
        if (dict[v] === "") continue; // intentionally omitted (e.g. redundant subtitle)
        const want = placeholders(en[key]).filter((p) => p !== "n");
        const got = placeholders(dict[v]).filter((p) => p !== "n");
        if (want.join() !== got.join()) {
          mismatched.push(`${v}: ${got} ≠ ${want}`);
        }
      }
    }
    assertEquals(missing, []);
    assertEquals(mismatched, []);
  });
}

Deno.test("i18n: plurals, digits and fallbacks", () => {
  setLang("en");
  assertEquals(t("moves.count", { n: 1 }), "1 move");
  assertEquals(t("moves.count", { n: 3 }), "3 moves");
  setLang("ja");
  assertEquals(t("moves.count", { n: 3 }), "3手");
  setLang("ar");
  assertEquals(t("moves.count", { n: 3 }), "٣ نقلة");
  setLang("fa");
  assertEquals(t("player.level", { n: 4 }), "سطح ۴");
  assertEquals(t("no.such.key"), "no.such.key");
  setLang("en");
});
