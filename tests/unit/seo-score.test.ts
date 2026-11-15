import { describe, expect, it } from "vitest";
import { scorePost, scoreLabel } from "@/lib/seo/score";

const base = {
  title: "Panduan menulis artikel yang ramah SEO",
  slug: "panduan-menulis-artikel",
  excerpt:
    "Panduan singkat untuk menulis artikel yang mudah dibaca dan ramah mesin pencari tanpa mengorbankan gaya.",
  metaTitle: "Panduan menulis artikel yang ramah SEO",
  metaDescription:
    "Langkah praktis menulis artikel yang mudah dibaca, punya struktur jelas, dan ramah mesin pencari.",
  focusKeyword: "panduan menulis",
  contentHtml: '<p><a href="/blog">Tautan internal</a></p>',
  contentText: Array.from({ length: 320 }, () => "kata").join(" "),
};

describe("skor SEO", () => {
  it("memberi skor penuh untuk artikel yang lengkap", () => {
    const result = scorePost(base);
    expect(result.score).toBe(100);
    expect(result.checks.every((check) => check.ok)).toBe(true);
  });

  it("menurunkan skor saat judul terlalu pendek", () => {
    const result = scorePost({ ...base, title: "Pendek" });
    const titleCheck = result.checks.find((check) => check.id === "titleLength");
    expect(titleCheck?.ok).toBe(false);
    // Judul pendek juga kehilangan poin kata kunci di judul.
    expect(result.score).toBe(65);
  });

  it("menandai kata kunci yang tidak ada di judul", () => {
    const result = scorePost({ ...base, focusKeyword: "astro" });
    expect(result.checks.find((check) => check.id === "keywordInTitle")?.ok).toBe(false);
  });

  it("menghitung konten pendek dan tanpa link internal", () => {
    const result = scorePost({
      ...base,
      contentHtml: "<p>Hanya teks.</p>",
      contentText: "Hanya beberapa kata saja.",
    });
    expect(result.checks.find((check) => check.id === "contentLength")?.ok).toBe(false);
    expect(result.checks.find((check) => check.id === "internalLink")?.ok).toBe(false);
  });

  it("memetakan label skor", () => {
    expect(scoreLabel(90)).toBe("great");
    expect(scoreLabel(75)).toBe("good");
    expect(scoreLabel(55)).toBe("fair");
    expect(scoreLabel(20)).toBe("poor");
  });
});
