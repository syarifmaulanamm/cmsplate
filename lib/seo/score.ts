import { countWords, hasInternalLink } from "@/lib/content/text";

export type SeoCheckId =
  | "titleLength"
  | "excerpt"
  | "metaDescription"
  | "keywordInTitle"
  | "contentLength"
  | "slugLength"
  | "internalLink";

export type SeoCheck = {
  id: SeoCheckId;
  ok: boolean;
  weight: number;
};

export type SeoInput = {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  contentHtml: string;
  contentText: string;
};

const WEIGHTS: Record<SeoCheckId, number> = {
  titleLength: 15,
  excerpt: 15,
  metaDescription: 15,
  keywordInTitle: 20,
  contentLength: 15,
  slugLength: 10,
  internalLink: 10,
};

/**
 * Skor panduan on-site, bukan prediksi peringkat Google.
 * Fungsi murni agar bisa dipakai di server (simpan) dan klien (preview).
 */
export function scorePost(input: SeoInput): { score: number; checks: SeoCheck[] } {
  const title = input.title.trim();
  const keyword = input.focusKeyword?.trim().toLowerCase() ?? "";
  const words = countWords(input.contentText);
  const metaDescription = (input.metaDescription?.trim() || input.excerpt).trim();

  const results: Record<SeoCheckId, boolean> = {
    titleLength: title.length >= 30 && title.length <= 60,
    excerpt: input.excerpt.trim().length >= 50,
    metaDescription: metaDescription.length >= 70 && metaDescription.length <= 160,
    keywordInTitle: Boolean(keyword) && title.toLowerCase().includes(keyword),
    contentLength: words >= 300,
    slugLength: input.slug.length > 0 && input.slug.length <= 75,
    internalLink: hasInternalLink(input.contentHtml),
  };

  const checks = (Object.keys(WEIGHTS) as SeoCheckId[]).map((id) => ({
    id,
    ok: results[id],
    weight: WEIGHTS[id],
  }));

  const score = checks.reduce((total, check) => total + (check.ok ? check.weight : 0), 0);

  return { score, checks };
}

export function scoreLabel(score: number): "poor" | "fair" | "good" | "great" {
  if (score >= 85) return "great";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}
