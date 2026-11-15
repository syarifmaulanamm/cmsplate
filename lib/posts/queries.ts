import "server-only";
import { Prisma, type PostStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  seoScore: number;
  updatedAt: Date;
  publishedAt: Date | null;
  authorName: string;
  categoryName: string;
  featuredImage: { url: string; alt: string } | null;
  locales: Locale[];
  localesPublished: Locale[];
};

function pickTranslation<T extends { locale: string }>(translations: T[], locale: Locale) {
  return (
    translations.find((translation) => translation.locale === locale) ??
    translations.find((translation) => translation.locale === "id") ??
    translations[0]
  );
}

type PostRow = {
  id: string;
  updatedAt: Date;
  author: { name: string };
  category: { translations: { locale: string; name: string }[] };
  featuredImage: { storageKey: string; alt: string | null; variants: { label: string; path: string }[] } | null;
  translations: {
    locale: string;
    title: string;
    slug: string;
    status: PostStatus;
    seoScore: number;
    publishedAt: Date | null;
  }[];
};

function toAdminPost(row: PostRow, locale: Locale): AdminPost {
  const translation = pickTranslation(row.translations, locale);
  const thumb = row.featuredImage?.variants.find((variant) => variant.label === "thumb");

  return {
    id: row.id,
    title: translation?.title ?? "—",
    slug: translation?.slug ?? "",
    status: translation?.status ?? "DRAFT",
    seoScore: translation?.seoScore ?? 0,
    updatedAt: row.updatedAt,
    publishedAt: translation?.publishedAt ?? null,
    authorName: row.author.name,
    categoryName: pickTranslation(row.category.translations, locale)?.name ?? "—",
    featuredImage: row.featuredImage
      ? {
          url: `/api/media/${thumb?.path ?? row.featuredImage.storageKey}`,
          alt: row.featuredImage.alt ?? "",
        }
      : null,
    locales: row.translations.map((item) => item.locale).filter((v): v is Locale => v === "id" || v === "en"),
    localesPublished: row.translations
      .filter((item) => item.status === "PUBLISHED")
      .map((item) => item.locale)
      .filter((v): v is Locale => v === "id" || v === "en"),
  };
}

const includePost = {
  author: { select: { name: true } },
  category: { include: { translations: true } },
  featuredImage: { include: { variants: true } },
  translations: true,
} satisfies Prisma.PostInclude;

export async function listPosts({
  locale,
  query,
  status,
  categoryId,
  page,
  pageSize = 20,
  authorId,
}: {
  locale: Locale;
  query?: string;
  status?: PostStatus;
  categoryId?: string;
  page: number;
  pageSize?: number;
  authorId?: string;
}) {
  const conditions: Prisma.PostWhereInput[] = [{ deletedAt: null }];

  if (categoryId) conditions.push({ categoryId });
  if (authorId) conditions.push({ authorId });

  if (query) {
    conditions.push({
      translations: {
        some: {
          locale,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        },
      },
    });
  }

  if (status) {
    conditions.push({ translations: { some: { locale, status } } });
  }

  const where: Prisma.PostWhereInput = { AND: conditions };
  const safePage = Math.max(1, page);

  const [total, rows] = await Promise.all([
    db.post.count({ where }),
    db.post.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: includePost,
    }),
  ]);

  return {
    items: rows.map((row) => toAdminPost(row, locale)),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPostDetail(id: string, locale: Locale) {
  const row = await db.post.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...includePost,
      revisions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!row) return null;

  const [seo, schema] = await Promise.all([
    db.seoMeta.findUnique({
      where: { entityType_entityId: { entityType: "post", entityId: id } },
      include: { ogImage: { include: { variants: true } } },
    }),
    db.postSchema.findFirst({ where: { postId: id, isActive: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const ogImageKey = seo?.ogImage
    ? (seo.ogImage.variants.find((v) => v.label === "medium")?.path ?? seo.ogImage.storageKey)
    : null;

  return {
    ...toAdminPost(row, locale),
    authorId: row.authorId,
    categoryId: row.categoryId,
    featuredImageId: row.featuredImageId,
    featuredImageUrl: row.featuredImage
      ? `/api/media/${row.featuredImage.variants.find((v) => v.label === "medium")?.path ?? row.featuredImage.storageKey}`
      : null,
    translations: row.translations,
    revisionCount: row.revisions.length,
    seo: {
      ogTitle: seo?.ogTitle ?? "",
      ogDescription: seo?.ogDescription ?? "",
      ogImageId: seo?.ogImageId ?? null,
      ogImageUrl: ogImageKey ? `/api/media/${ogImageKey}` : null,
      ogType: seo?.ogType ?? "article",
      twitterCard: seo?.twitterCard ?? "summary_large_image",
    },
    schemaJson: schema ? JSON.stringify(schema.data, null, 2) : "",
  };
}

export async function listAuthorOptions() {
  return db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export type TrashedPost = {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  authorName: string;
  deletedAt: Date;
};

export async function listDeletedPosts({
  locale,
  page = 1,
  pageSize = 20,
}: {
  locale: Locale;
  page?: number;
  pageSize?: number;
}) {
  const where = { deletedAt: { not: null } };
  const safePage = Math.max(1, page);

  const [total, rows] = await Promise.all([
    db.post.count({ where }),
    db.post.findMany({
      where,
      orderBy: { deletedAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: includePost,
    }),
  ]);

  const items: TrashedPost[] = rows.map((row) => {
    const translation = pickTranslation(row.translations, locale);
    return {
      id: row.id,
      title: translation?.title ?? "—",
      slug: translation?.slug ?? "",
      categoryName: pickTranslation(row.category.translations, locale)?.name ?? "—",
      authorName: row.author.name,
      deletedAt: row.deletedAt ?? new Date(),
    };
  });

  return { items, total, page: safePage, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function countDeletedPosts() {
  return db.post.count({ where: { deletedAt: { not: null } } });
}

