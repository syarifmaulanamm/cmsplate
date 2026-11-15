import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "@/lib/content/slug";

describe("slug", () => {
  it("menormalkan huruf, spasi, dan tanda baca", () => {
    expect(slugify("Halo Dunia!")).toBe("halo-dunia");
    expect(slugify("  Panduan   SEO 2026 ")).toBe("panduan-seo-2026");
    expect(slugify("Café & Crème")).toBe("cafe-creme");
  });

  it("membatasi panjang dan tidak menyisakan tanda hubung di ujung", () => {
    const long = slugify("a".repeat(120));
    expect(long).toHaveLength(80);
    expect(slugify("--tes--")).toBe("tes");
  });

  it("memvalidasi format slug", () => {
    expect(isValidSlug("panduan-seo")).toBe(true);
    expect(isValidSlug("panduan--seo")).toBe(false);
    expect(isValidSlug("Panduan")).toBe(false);
    expect(isValidSlug("-panduan")).toBe(false);
  });
});
