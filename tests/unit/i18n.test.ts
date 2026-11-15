import { describe, expect, it } from "vitest";
import { id } from "@/lib/i18n/dictionaries/id";
import { en } from "@/lib/i18n/dictionaries/en";
import { formatMessage, plural } from "@/lib/i18n/format";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function flatten(value: Json, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  if (Array.isArray(value)) return value.flatMap((item, index) => flatten(item, `${prefix}[${index}]`));
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child as Json, prefix ? `${prefix}.${key}` : key),
  );
}

describe("kamus i18n", () => {
  it("memiliki kunci yang sama untuk id dan en", () => {
    const idKeys = flatten(id as unknown as Json).sort();
    const enKeys = flatten(en as unknown as Json).sort();
    expect(enKeys).toEqual(idKeys);
  });

  it("tidak membiarkan nilai kosong", () => {
    for (const key of flatten(en as unknown as Json)) {
      const path = key.split(".");
      let current: unknown = en;
      for (const segment of path) {
        current = (current as Record<string, unknown>)[segment];
      }
      expect(String(current).trim().length, key).toBeGreaterThan(0);
    }
  });
});

describe("format pesan", () => {
  it("mengganti placeholder", () => {
    expect(formatMessage("Halo {name}, {count} artikel", { name: "Sari", count: 3 })).toBe(
      "Halo Sari, 3 artikel",
    );
  });

  it("membiarkan placeholder yang tidak punya nilai", () => {
    expect(formatMessage("Hapus {name}?", {})).toBe("Hapus {name}?");
  });

  it("memilih bentuk plural sederhana", () => {
    expect(plural(1, { one: "artikel", other: "artikel" }, "{count} {form}")).toBe("1 artikel");
    expect(plural(4, { one: "article", other: "articles" }, "{count} {form}")).toBe("4 articles");
  });
});
