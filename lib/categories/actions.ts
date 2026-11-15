"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { slugify } from "@/lib/content/slug";
import { categoryFormSchema } from "@/lib/categories/schema";
import { categoryDepth, isDescendant, slugExists } from "@/lib/categories/queries";
import { locales, type Locale } from "@/lib/i18n/config";
import { adminPath } from "@/lib/admin-path";

export type CategoryErrorCode =
  | "VALIDATION"
  | "AT_LEAST_ONE_LOCALE"
  | "NAME_TOO_SHORT"
  | "SLUG_TAKEN"
  | "PARENT_CYCLE"
  | "PARENT_DEPTH"
  | "NOT_FOUND"
  | "UNKNOWN";

export type CategoryFormState = {
  errorCode?: CategoryErrorCode;
  errorField?: string;
  errorLocale?: Locale;
};

const MAX_DEPTH = 3;

function readLocaleBlock(formData: FormData, locale: Locale) {
  const value = (key: string) => String(formData.get(`${key}_${locale}`) ?? "").trim();
  return {
    name: value("name"),
    slug: value("slug"),
    description: value("description"),
    metaTitle: value("metaTitle"),
    metaDescription: value("metaDescription"),
  };
}

export async function saveCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireRole("EDITOR");

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const parentId = parentIdRaw === "" || parentIdRaw === "none" ? null : parentIdRaw;
  const position = Number(formData.get("position") ?? 0);

  const parsed = categoryFormSchema.safeParse({
    parentId,
    position,
    locales: {
      id: readLocaleBlock(formData, "id"),
      en: readLocaleBlock(formData, "en"),
    },
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === "AT_LEAST_ONE_LOCALE") return { errorCode: "AT_LEAST_ONE_LOCALE" };
    if (issue?.message === "NAME_TOO_SHORT") {
      return { errorCode: "NAME_TOO_SHORT", errorLocale: issue.path[1] as Locale };
    }
    return { errorCode: "VALIDATION" };
  }

  const { locales: blocks } = parsed.data;

  if (id && parentId === id) {
    return { errorCode: "PARENT_CYCLE" };
  }

  if (parentId) {
    const parent = await db.category.findUnique({ where: { id: parentId }, select: { id: true } });
    if (!parent) return { errorCode: "PARENT_CYCLE" };

    const parentDepth = await categoryDepth(parentId);
    if (parentDepth + 1 > MAX_DEPTH) return { errorCode: "PARENT_DEPTH" };

    if (id && (await isDescendant(id, parentId))) {
      return { errorCode: "PARENT_CYCLE" };
    }
  }

  const normalized = locales.map((locale) => {
    const block = blocks[locale];
    const name = block.name.trim();
    if (!name) return null;
    const slug = slugify(block.slug || name);
    return {
      locale,
      name,
      slug,
      description: block.description,
      metaTitle: block.metaTitle,
      metaDescription: block.metaDescription,
    };
  });

  for (const entry of normalized) {
    if (!entry) continue;
    if (await slugExists(entry.locale, entry.slug, id)) {
      return { errorCode: "SLUG_TAKEN", errorLocale: entry.locale };
    }
  }

  const translations = normalized.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  let savedId: string | null = null;

  try {
    if (id) {
      await db.$transaction(async (tx) => {
        await tx.category.update({
          where: { id },
          data: { parentId, position },
        });

        for (const translation of translations) {
          await tx.categoryTranslation.upsert({
            where: { categoryId_locale: { categoryId: id, locale: translation.locale } },
            update: {
              name: translation.name,
              slug: translation.slug,
              description: translation.description,
              metaTitle: translation.metaTitle || null,
              metaDescription: translation.metaDescription || null,
            },
            create: {
              categoryId: id,
              locale: translation.locale,
              name: translation.name,
              slug: translation.slug,
              description: translation.description,
              metaTitle: translation.metaTitle || null,
              metaDescription: translation.metaDescription || null,
            },
          });
        }

        const keep = translations.map((translation) => translation.locale);
        await tx.categoryTranslation.deleteMany({
          where: { categoryId: id, locale: { notIn: keep } },
        });
      });

      savedId = id;
    } else {
      const created = await db.category.create({
        data: {
          parentId,
          position,
          translations: {
            create: translations.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
              slug: translation.slug,
              description: translation.description,
              metaTitle: translation.metaTitle || null,
              metaDescription: translation.metaDescription || null,
            })),
          },
        },
      });
      savedId = created.id;
    }
  } catch (error) {
    console.error("saveCategory gagal", error);
    return { errorCode: "UNKNOWN" };
  }

  if (!savedId) return { errorCode: "UNKNOWN" };

  revalidatePath(adminPath("/categories"));
  revalidatePath(adminPath(`/categories/${savedId}`));
  revalidatePath(adminPath(""));

  redirect(adminPath(`/categories/${savedId}`));
}

export type DeleteCategoryResult = {
  ok: boolean;
  code?: "NOT_FOUND" | "IN_USE" | "UNKNOWN";
  posts?: number;
  children?: number;
};

export async function deleteCategory(categoryId: string): Promise<DeleteCategoryResult> {
  await requireRole("EDITOR");

  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { id: true, _count: { select: { posts: true, children: true } } },
  });

  if (!category) return { ok: false, code: "NOT_FOUND" };

  if (category._count.posts > 0 || category._count.children > 0) {
    return {
      ok: false,
      code: "IN_USE",
      posts: category._count.posts,
      children: category._count.children,
    };
  }

  try {
    await db.category.delete({ where: { id: categoryId } });
    revalidatePath(adminPath("/categories"));
    revalidatePath(adminPath(""));
    return { ok: true };
  } catch (error) {
    console.error("deleteCategory gagal", error);
    return { ok: false, code: "UNKNOWN" };
  }
}
