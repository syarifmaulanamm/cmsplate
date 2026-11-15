import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

/** Filter "sudah terbit" — tanggal dievaluasi ulang setiap query. */
function publishedFilter() {
  return { status: "PUBLISHED" as const, publishedAt: { lte: new Date() } };
}

export async function listPublishedPosts({
  locale,
  categorySlug,
  page = 1,
  pageSize = 9,
}: {
  locale: Locale;
  categorySlug?: string;
  page?: number;
  pageSize?: number;
}) {
  const safePage = Math.max(1, page);

  const where = {
    locale,
    ...publishedFilter(),
    post: {
      deletedAt: null,
      ...(categorySlug ? { category: { translations: { some: { locale, slug: categorySlug } } } } : {}),
    },
  };

  const [total, rows] = await Promise.all([
    db.postTranslation.count({ where }),
    db.postTranslation.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        post: {
          include: {
            featuredImage: { include: { variants: true } },
            category: { include: { translations: true } },
          },
        },
      },
    }),
  ]);

  return {
    items: rows.map((row) => ({
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      publishedAt: row.publishedAt,
      readTime: row.readTime,
      categoryName:
        row.post.category.translations.find((t) => t.locale === locale)?.name ??
        row.post.category.translations[0]?.name ??
        "",
      categorySlug:
        row.post.category.translations.find((t) => t.locale === locale)?.slug ??
        row.post.category.translations[0]?.slug ??
        "",
      image: row.post.featuredImage
        ? {
            url: `/api/media/${
              row.post.featuredImage.variants.find((v) => v.label === "medium")?.path ??
              row.post.featuredImage.storageKey
            }`,
            alt: row.post.featuredImage.alt ?? row.title,
          }
        : null,
    })),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getPublishedPost = cache(async (locale: Locale, slug: string) => {
  const row = await db.postTranslation.findFirst({
    where: { locale, slug, ...publishedFilter(), post: { deletedAt: null } },
    include: {
      post: {
        include: {
          featuredImage: { include: { variants: true } },
          category: { include: { translations: true } },
          author: { select: { name: true } },
          translations: { where: publishedFilter(), select: { locale: true, slug: true } },
        },
      },
    },
  });

  if (!row) return null;

  const [seo, schema] = await Promise.all([
    db.seoMeta.findUnique({
      where: { entityType_entityId: { entityType: "post", entityId: row.postId } },
      include: { ogImage: { include: { variants: true } } },
    }),
    db.postSchema.findFirst({ where: { postId: row.postId, isActive: true } }),
  ]);

  const ogImageKey = seo?.ogImage
    ? (seo.ogImage.variants.find((v) => v.label === "large")?.path ?? seo.ogImage.storageKey)
    : null;

  const imageKey = row.post.featuredImage
    ? (row.post.featuredImage.variants.find((v) => v.label === "large")?.path ??
      row.post.featuredImage.storageKey)
    : null;

  return {
    id: row.id,
    postId: row.postId,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    contentHtml: row.contentHtml,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    readTime: row.readTime,
    seoScore: row.seoScore,
    authorName: row.post.author.name,
    category: {
      name:
        row.post.category.translations.find((t) => t.locale === locale)?.name ??
        row.post.category.translations[0]?.name ??
        "",
      slug:
        row.post.category.translations.find((t) => t.locale === locale)?.slug ??
        row.post.category.translations[0]?.slug ??
        "",
    },
    image: imageKey ? { url: `/api/media/${imageKey}`, alt: row.post.featuredImage?.alt ?? row.title } : null,
    alternates: row.post.translations
      .filter((t): t is { locale: Locale; slug: string } => t.locale === "id" || t.locale === "en")
      .map((t) => ({ locale: t.locale, href: `/${t.locale}/blog/${t.slug}` })),
    seo: seo
      ? {
          ogTitle: seo.ogTitle,
          ogDescription: seo.ogDescription,
          ogType: seo.ogType,
          twitterCard: seo.twitterCard,
          ogImageUrl: ogImageKey ? `/api/media/${ogImageKey}` : null,
        }
      : null,
    schemaData: schema?.data ?? null,
  };
});

export async function listPublishedCategories(locale: Locale) {
  const rows = await db.category.findMany({
    where: { translations: { some: { locale } }, posts: { some: { deletedAt: null, translations: { some: { locale, ...publishedFilter() } } } } },
    include: { translations: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return rows.map((row) => {
    const translation = row.translations.find((t) => t.locale === locale) ?? row.translations[0];
    return {
      id: row.id,
      name: translation?.name ?? "—",
      slug: translation?.slug ?? "",
      description: translation?.description ?? "",
    };
  });
}

export async function getPublishedCategory(locale: Locale, slug: string) {
  const row = await db.categoryTranslation.findUnique({
    where: { locale_slug: { locale, slug } },
    include: { category: { include: { translations: true } } },
  });

  if (!row) return null;

  return {
    id: row.categoryId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    alternates: row.category.translations
      .filter((t) => t.locale === "id" || t.locale === "en")
      .map((t) => ({ locale: t.locale as Locale, href: `/${t.locale}/kategori/${t.slug}` })),
  };
}

export async function listSitemapEntries() {
  const posts = await db.postTranslation.findMany({
    where: { ...publishedFilter(), post: { deletedAt: null } },
    select: { locale: true, slug: true, updatedAt: true, postId: true },
    orderBy: { updatedAt: "desc" },
  });

  const categories = await db.categoryTranslation.findMany({
    select: { locale: true, slug: true, categoryId: true },
  });

  return { posts, categories };
}
