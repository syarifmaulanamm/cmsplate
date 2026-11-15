import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

export type AdminCategory = {
  id: string;
  parentId: string | null;
  position: number;
  updatedAt: Date;
  name: string;
  slug: string;
  parentName: string | null;
  postCount: number;
  childCount: number;
  locales: Locale[];
};

type TranslationLike = { locale: string; name: string; slug: string };

export function pickTranslation<T extends TranslationLike>(
  translations: T[],
  locale: Locale,
): T | undefined {
  return (
    translations.find((translation) => translation.locale === locale) ??
    translations.find((translation) => translation.locale === "id") ??
    translations[0]
  );
}

function toAdminCategory(
  row: {
    id: string;
    parentId: string | null;
    position: number;
    updatedAt: Date;
    translations: TranslationLike[];
    parent: { translations: TranslationLike[] } | null;
    _count: { posts: number; children: number };
  },
  locale: Locale,
): AdminCategory {
  const translation = pickTranslation(row.translations, locale);

  return {
    id: row.id,
    parentId: row.parentId,
    position: row.position,
    updatedAt: row.updatedAt,
    name: translation?.name ?? "—",
    slug: translation?.slug ?? "",
    parentName: row.parent ? (pickTranslation(row.parent.translations, locale)?.name ?? null) : null,
    postCount: row._count.posts,
    childCount: row._count.children,
    locales: row.translations.map((item) => item.locale).filter((v): v is Locale => v === "id" || v === "en"),
  };
}

export async function listCategories({
  locale,
  query,
  parentId,
  page,
  pageSize = 20,
}: {
  locale: Locale;
  query?: string;
  parentId?: string;
  page: number;
  pageSize?: number;
}) {
  const where: Prisma.CategoryWhereInput = {
    ...(parentId ? { parentId } : {}),
    ...(query
      ? {
          translations: {
            some: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        }
      : {}),
  };

  const safePage = Math.max(1, page);
  const [total, rows] = await Promise.all([
    db.category.count({ where }),
    db.category.findMany({
      where,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        translations: true,
        parent: { include: { translations: true } },
        _count: { select: { posts: true, children: true } },
      },
    }),
  ]);

  return {
    items: rows.map((row) => toAdminCategory(row, locale)),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCategoryDetail(id: string, locale: Locale) {
  const row = await db.category.findUnique({
    where: { id },
    include: {
      translations: true,
      parent: { include: { translations: true } },
      children: { include: { translations: true }, orderBy: { position: "asc" } },
      _count: { select: { posts: true, children: true } },
    },
  });

  if (!row) return null;

  return {
    ...toAdminCategory(row, locale),
    translations: row.translations,
    children: row.children.map((child) => toAdminCategory({ ...child, parent: null, _count: { posts: 0, children: 0 } }, locale)),
    meta: {
      metaTitle: row.translations.find((t) => t.locale === locale)?.metaTitle ?? "",
      metaDescription: row.translations.find((t) => t.locale === locale)?.metaDescription ?? "",
    },
  };
}

export type CategoryOption = { id: string; name: string; depth: number };

type OptionRow = {
  id: string;
  parentId: string | null;
  translations: Array<{ locale: string; name: string; slug: string }>;
};

export async function listCategoryOptions(locale: Locale, excludeId?: string): Promise<CategoryOption[]> {
  const rows: OptionRow[] = await db.category.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { translations: true },
  });

  const byParent = new Map<string | null, OptionRow[]>();
  for (const row of rows) {
    const list = byParent.get(row.parentId) ?? [];
    list.push(row);
    byParent.set(row.parentId, list);
  }

  const options: CategoryOption[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const row of byParent.get(parentId) ?? []) {
      if (row.id === excludeId) continue;
      options.push({
        id: row.id,
        name: (pickTranslation(row.translations, locale)?.name ?? "—").trim(),
        depth,
      });
      walk(row.id, depth + 1);
    }
  }
  walk(null, 0);

  return options;
}

/** Kedalaman sebuah kategori (root = 1). */
export async function categoryDepth(categoryId: string) {
  let depth = 0;
  let current: string | null = categoryId;
  const seen = new Set<string>();

  while (current && depth < 10) {
    if (seen.has(current)) break;
    seen.add(current);
    const row: { parentId: string | null } | null = await db.category.findUnique({
      where: { id: current },
      select: { parentId: true },
    });
    if (!row) break;
    depth += 1;
    current = row.parentId;
  }

  return depth;
}

/** Apakah `candidateParentId` adalah turunan dari `categoryId`? */
export async function isDescendant(categoryId: string, candidateParentId: string) {
  let current: string | null = candidateParentId;
  const seen = new Set<string>();

  while (current && !seen.has(current)) {
    if (current === categoryId) return true;
    seen.add(current);
    const row: { parentId: string | null } | null = await db.category.findUnique({
      where: { id: current },
      select: { parentId: true },
    });
    current = row?.parentId ?? null;
  }

  return false;
}

export async function slugExists(locale: Locale, slug: string, excludeCategoryId?: string) {
  const found = await db.categoryTranslation.findFirst({
    where: {
      locale,
      slug,
      ...(excludeCategoryId ? { NOT: { categoryId: excludeCategoryId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(found);
}
