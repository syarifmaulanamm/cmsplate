import type { MetadataRoute } from "next";
import { listSitemapEntries } from "@/lib/posts/public";
import { locales } from "@/lib/i18n/config";import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const localeUrl = (locale: string, path = "") => absoluteUrl(`/${locale}${path}`);
const languageCode = (locale: string) => (locale === "id" ? "id-ID" : "en-US");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, categories } = await listSitemapEntries();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: localeUrl(locale),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: Object.fromEntries(locales.map((item) => [languageCode(item), localeUrl(item)])),
      },
    });
    entries.push({
      url: localeUrl(locale, "/blog"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((item) => [languageCode(item), localeUrl(item, "/blog")]),
        ),
      },
    });
  }

  const postGroups = new Map<string, typeof posts>();
  for (const post of posts) {
    const list = postGroups.get(post.postId) ?? [];
    list.push(post);
    postGroups.set(post.postId, list);
  }

  for (const group of postGroups.values()) {
    const languages = Object.fromEntries(
      group.map((item) => [languageCode(item.locale), localeUrl(item.locale, `/blog/${item.slug}`)]),
    );

    for (const item of group) {
      entries.push({
        url: localeUrl(item.locale, `/blog/${item.slug}`),
        lastModified: item.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  for (const category of categories) {
    entries.push({
      url: localeUrl(category.locale, `/kategori/${category.slug}`),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}
