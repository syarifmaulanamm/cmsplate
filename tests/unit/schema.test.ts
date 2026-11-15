import { describe, expect, it } from "vitest";
import {
  parseSchemaJson,
  resolveSchema,
  schemaTemplates,
  stringifySchemaForHtml,
} from "@/lib/seo/schema";

describe("schema JSON-LD", () => {
  it("mem-parse JSON valid dan menolak yang rusak", () => {
    expect(parseSchemaJson('{"@type":"FAQPage"}').ok).toBe(true);
    expect(parseSchemaJson("").ok).toBe(true);
    expect(parseSchemaJson("{").ok).toBe(false);
    expect(parseSchemaJson('"teks"').ok).toBe(false);
  });

  it("mengganti variabel secara rekursif", () => {
    const resolved = resolveSchema(
      {
        "@type": "Article",
        headline: "{{post.title}}",
        author: { name: "{{post.author}}" },
        tags: ["{{post.slug}}", "statis"],
      },
      { "post.title": "Halo", "post.author": "Sari", "post.slug": "halo" },
    ) as Record<string, unknown>;

    expect(resolved.headline).toBe("Halo");
    expect((resolved.author as Record<string, string>).name).toBe("Sari");
    expect(resolved.tags).toEqual(["halo", "statis"]);
  });

  it("membiarkan variabel yang tidak dikenal", () => {
    expect(resolveSchema("{{post.unknown}}", {})).toBe("{{post.unknown}}");
  });

  it("meng-escape tag penutup script", () => {
    expect(stringifySchemaForHtml({ text: "</script>" })).not.toContain("</script>");
  });

  it("menyediakan template yang valid", () => {
    for (const template of Object.values(schemaTemplates)) {
      expect(parseSchemaJson(JSON.stringify(template)).ok).toBe(true);
    }
  });
});
