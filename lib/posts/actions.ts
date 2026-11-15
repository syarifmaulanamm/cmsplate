"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/rbac";
import { slugify } from "@/lib/content/slug";
import { estimateReadTime, htmlToPlainText, sanitizeContent } from "@/lib/content/sanitize";
import { scorePost } from "@/lib/seo/score";
import { postFormSchema, type PostStatusValue } from "@/lib/posts/schema";
import { parseSchemaJson } from "@/lib/seo/schema";
import { Prisma } from "@prisma/client";
import { locales, type Locale } from "@/lib/i18n/config";
import { adminPath } from "@/lib/admin-path";

export type PostFormState = {
  errorCode?:
    | "VALIDATION"
    | "AT_LEAST_ONE_LOCALE"
    | "SLUG_TAKEN"
    | "INVALID_DATE"
    | "INVALID_SCHEMA"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "UNKNOWN";
  errorLocale?: Locale;
};

function readBlock(formData: FormData, locale: Locale) {
  const value = (key: string) => String(formData.get(`${key}_${locale}`) ?? "");
  return {
    title: value("title").trim(),
    slug: value("slug").trim(),
    excerpt: value("excerpt").trim(),
    metaTitle: value("metaTitle").trim(),
    metaDescription: value("metaDescription").trim(),
    focusKeyword: value("focusKeyword").trim(),
    contentHtml: value("contentHtml"),
    contentJson: value("contentJson") || "{}",
    status: (value("status") || "DRAFT") as PostStatusValue,
    publishedAt: value("publishedAt").trim(),
  };
}

function parsePublishedAt(raw: string): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

type PostExtras = {
  ogTitle: string;
  ogDescription: string;
  ogImageId: string | null;
  ogType: string;
  twitterCard: string;
  schema: unknown | null;
};

function readExtras(formData: FormData): { ok: boolean; extras: PostExtras } {
  const value = (key: string) => String(formData.get(key) ?? "").trim();
  const parsed = parseSchemaJson(value("schemaJson"));

  return {
    ok: parsed.ok,
    extras: {
      ogTitle: value("ogTitle").slice(0, 70),
      ogDescription: value("ogDescription").slice(0, 200),
      ogImageId: value("ogImageId") || null,
      ogType: value("ogType") === "website" ? "website" : "article",
      twitterCard: value("twitterCard") === "summary" ? "summary" : "summary_large_image",
      schema: parsed.ok ? parsed.data : null,
    },
  };
}

async function persistExtras(postId: string, extras: PostExtras) {
  await db.seoMeta.upsert({
    where: { entityType_entityId: { entityType: "post", entityId: postId } },
    update: {
      ogTitle: extras.ogTitle || null,
      ogDescription: extras.ogDescription || null,
      ogImageId: extras.ogImageId,
      ogType: extras.ogType,
      twitterCard: extras.twitterCard,
    },
    create: {
      entityType: "post",
      entityId: postId,
      ogTitle: extras.ogTitle || null,
      ogDescription: extras.ogDescription || null,
      ogImageId: extras.ogImageId,
      ogType: extras.ogType,
      twitterCard: extras.twitterCard,
    },
  });

  const active = await db.postSchema.findFirst({
    where: { postId, isActive: true },
    select: { id: true },
  });

  if (extras.schema === null) {
    if (active) {
      await db.postSchema.update({ where: { id: active.id }, data: { isActive: false } });
    }
    return;
  }

  const data = extras.schema as Prisma.InputJsonValue;

  if (active) {
    await db.postSchema.update({ where: { id: active.id }, data: { data, isActive: true } });
  } else {
    await db.postSchema.create({ data: { postId, data, isActive: true } });
  }
}

export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const featuredImageIdRaw = String(formData.get("featuredImageId") ?? "").trim();
  const featuredImageId = featuredImageIdRaw || null;

  const parsed = postFormSchema.safeParse({
    categoryId,
    featuredImageId: featuredImageId ?? undefined,
    locales: {
      id: readBlock(formData, "id"),
      en: readBlock(formData, "en"),
    },
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === "AT_LEAST_ONE_LOCALE") return { errorCode: "AT_LEAST_ONE_LOCALE" };
    return { errorCode: "VALIDATION" };
  }

  const extras = readExtras(formData);
  if (!extras.ok) return { errorCode: "INVALID_SCHEMA" };

  const category = await db.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) return { errorCode: "VALIDATION" };

  if (id) {
    const existing = await db.post.findUnique({ where: { id }, select: { authorId: true } });
    if (!existing) return { errorCode: "NOT_FOUND" };
    if (user.role === "AUTHOR" && existing.authorId !== user.id) {
      return { errorCode: "FORBIDDEN" };
    }
  }

  const blocks = locales.map((locale) => {
    const block = parsed.data.locales[locale];
    if (!block.title) return null;

    const slug = slugify(block.slug || block.title);
    const contentHtml = sanitizeContent(block.contentHtml);
    const contentText = htmlToPlainText(contentHtml);

    const isLive = block.status === "PUBLISHED" || block.status === "SCHEDULED";
    const publishedAt = isLive ? (parsePublishedAt(block.publishedAt) ?? new Date()) : null;

    const { score } = scorePost({
      title: block.title,
      slug,
      excerpt: block.excerpt,
      metaTitle: block.metaTitle,
      metaDescription: block.metaDescription,
      focusKeyword: block.focusKeyword,
      contentHtml,
      contentText,
    });

    return {
      locale,
      title: block.title,
      slug,
      excerpt: block.excerpt,
      metaTitle: block.metaTitle || null,
      metaDescription: block.metaDescription || null,
      focusKeyword: block.focusKeyword || null,
      contentHtml,
      contentText,
      content: safeJson(block.contentJson),
      status: block.status,
      publishedAt,
      readTime: estimateReadTime(contentText),
      seoScore: score,
    };
  });

  const translations = blocks.filter((block): block is NonNullable<typeof block> => Boolean(block));
  if (translations.length === 0) return { errorCode: "AT_LEAST_ONE_LOCALE" };

  for (const translation of translations) {
    const clash = await db.postTranslation.findFirst({
      where: {
        locale: translation.locale,
        slug: translation.slug,
        ...(id ? { NOT: { postId: id } } : {}),
      },
      select: { id: true },
    });
    if (clash) return { errorCode: "SLUG_TAKEN", errorLocale: translation.locale };
  }

  let savedId = id ?? null;

  try {
    if (id) {
      await db.$transaction(async (tx) => {
        await tx.post.update({
          where: { id },
          data: { categoryId, featuredImageId, updatedById: user.id },
        });

        for (const translation of translations) {
          await tx.postTranslation.upsert({
            where: { postId_locale: { postId: id, locale: translation.locale } },
            update: {
              title: translation.title,
              slug: translation.slug,
              excerpt: translation.excerpt,
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription,
              focusKeyword: translation.focusKeyword,
              content: translation.content,
              contentHtml: translation.contentHtml,
              contentText: translation.contentText,
              status: translation.status,
              publishedAt: translation.publishedAt,
              readTime: translation.readTime,
              seoScore: translation.seoScore,
            },
            create: {
              postId: id,
              locale: translation.locale,
              title: translation.title,
              slug: translation.slug,
              excerpt: translation.excerpt,
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription,
              focusKeyword: translation.focusKeyword,
              content: translation.content,
              contentHtml: translation.contentHtml,
              contentText: translation.contentText,
              status: translation.status,
              publishedAt: translation.publishedAt,
              readTime: translation.readTime,
              seoScore: translation.seoScore,
            },
          });

          await tx.postRevision.create({
            data: {
              postId: id,
              title: translation.title,
              content: translation.content,
              contentHtml: translation.contentHtml,
              createdById: user.id,
            },
          });
        }

        const keep = translations.map((translation) => translation.locale);
        await tx.postTranslation.deleteMany({
          where: { postId: id, locale: { notIn: keep } },
        });
      });

      savedId = id;
    } else {
      const created = await db.post.create({
        data: {
          categoryId,
          featuredImageId,
          authorId: user.id,
          updatedById: user.id,
          translations: {
            create: translations.map((translation) => ({
              locale: translation.locale,
              title: translation.title,
              slug: translation.slug,
              excerpt: translation.excerpt,
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription,
              focusKeyword: translation.focusKeyword,
              content: translation.content,
              contentHtml: translation.contentHtml,
              contentText: translation.contentText,
              status: translation.status,
              publishedAt: translation.publishedAt,
              readTime: translation.readTime,
              seoScore: translation.seoScore,
            })),
          },
        },
      });
      savedId = created.id;
    }

    if (savedId) await persistExtras(savedId, extras.extras);
  } catch (error) {
    console.error("savePost gagal", error);
    return { errorCode: "UNKNOWN" };
  }

  if (!savedId) return { errorCode: "UNKNOWN" };

  for (const translation of translations) {
    revalidatePath(`/${translation.locale}/blog/${translation.slug}`);
    revalidatePath(`/${translation.locale}/blog`);
  }
  revalidatePath(adminPath("/posts"));
  revalidatePath(adminPath(`/posts/${savedId}`));

  redirect(adminPath(`/posts/${savedId}/edit`));
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as object;
  } catch {
    return {};
  }
}

export type DeletePostResult = { ok: boolean; code?: "NOT_FOUND" | "FORBIDDEN" | "UNKNOWN" };

export async function deletePost(postId: string): Promise<DeletePostResult> {
  const user = await requireUser();

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, translations: { select: { locale: true, slug: true } } },
  });

  if (!post) return { ok: false, code: "NOT_FOUND" };
  if (user.role === "AUTHOR" && post.authorId !== user.id) return { ok: false, code: "FORBIDDEN" };

  try {
    await db.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
    for (const translation of post.translations) {
      revalidatePath(`/${translation.locale}/blog/${translation.slug}`);
      revalidatePath(`/${translation.locale}/blog`);
    }
    revalidatePath(adminPath("/posts"));
    return { ok: true };
  } catch (error) {
    console.error("deletePost gagal", error);
    return { ok: false, code: "UNKNOWN" };
  }
}

export async function restorePost(postId: string): Promise<DeletePostResult> {
  const user = await requireUser();

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, translations: { select: { locale: true, slug: true } } },
  });

  if (!post) return { ok: false, code: "NOT_FOUND" };
  if (user.role === "AUTHOR" && post.authorId !== user.id) return { ok: false, code: "FORBIDDEN" };

  try {
    await db.post.update({ where: { id: postId }, data: { deletedAt: null } });
    for (const translation of post.translations) {
      revalidatePath(`/${translation.locale}/blog/${translation.slug}`);
      revalidatePath(`/${translation.locale}/blog`);
    }
    revalidatePath(adminPath("/posts"));
    revalidatePath(adminPath("/posts/trash"));
    return { ok: true };
  } catch (error) {
    console.error("restorePost gagal", error);
    return { ok: false, code: "UNKNOWN" };
  }
}

export async function permanentlyDeletePost(postId: string): Promise<DeletePostResult> {
  await requireRole("SUPER_ADMIN");

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, translations: { select: { locale: true, slug: true } } },
  });

  if (!post) return { ok: false, code: "NOT_FOUND" };

  try {
    await db.post.delete({ where: { id: postId } });
    for (const translation of post.translations) {
      revalidatePath(`/${translation.locale}/blog/${translation.slug}`);
    }
    revalidatePath(adminPath("/posts"));
    revalidatePath(adminPath("/posts/trash"));
    return { ok: true };
  } catch (error) {
    console.error("permanentlyDeletePost gagal", error);
    return { ok: false, code: "UNKNOWN" };
  }
}

export type AutosaveResult = { ok: boolean; savedAt?: string };

/**
 * Menyimpan perubahan tanpa navigasi dan tanpa membuat revisi baru.
 * Dipakai oleh autosave 20 detik di editor.
 */
export async function autosavePost(formData: FormData): Promise<AutosaveResult> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false };

  const post = await db.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!post) return { ok: false };
  if (user.role === "AUTHOR" && post.authorId !== user.id) return { ok: false };

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const featuredImageId = String(formData.get("featuredImageId") ?? "").trim() || null;

  try {
    await db.post.update({
      where: { id },
      data: {
        ...(categoryId ? { categoryId } : {}),
        featuredImageId,
        updatedById: user.id,
      },
    });

    for (const locale of locales) {
      const block = readBlock(formData, locale);
      if (!block.title) continue;

      const slug = slugify(block.slug || block.title);
      const contentHtml = sanitizeContent(block.contentHtml);
      const contentText = htmlToPlainText(contentHtml);
      const isLive = block.status === "PUBLISHED" || block.status === "SCHEDULED";
      const publishedAt = isLive ? (parsePublishedAt(block.publishedAt) ?? new Date()) : null;
      const { score } = scorePost({
        title: block.title,
        slug,
        excerpt: block.excerpt,
        metaTitle: block.metaTitle,
        metaDescription: block.metaDescription,
        focusKeyword: block.focusKeyword,
        contentHtml,
        contentText,
      });

      const clash = await db.postTranslation.findFirst({
        where: { locale, slug, NOT: { postId: id } },
        select: { id: true },
      });
      if (clash) continue;

      await db.postTranslation.upsert({
        where: { postId_locale: { postId: id, locale } },
        update: {
          title: block.title,
          slug,
          excerpt: block.excerpt,
          metaTitle: block.metaTitle || null,
          metaDescription: block.metaDescription || null,
          focusKeyword: block.focusKeyword || null,
          content: safeJson(block.contentJson),
          contentHtml,
          contentText,
          status: block.status,
          publishedAt,
          readTime: estimateReadTime(contentText),
          seoScore: score,
        },
        create: {
          postId: id,
          locale,
          title: block.title,
          slug,
          excerpt: block.excerpt,
          metaTitle: block.metaTitle || null,
          metaDescription: block.metaDescription || null,
          focusKeyword: block.focusKeyword || null,
          content: safeJson(block.contentJson),
          contentHtml,
          contentText,
          status: block.status,
          publishedAt,
          readTime: estimateReadTime(contentText),
          seoScore: score,
        },
      });
    }

    const extras = readExtras(formData);
    if (extras.ok) await persistExtras(id, extras.extras);

    return { ok: true, savedAt: new Date().toISOString() };
  } catch (error) {
    console.error("autosavePost gagal", error);
    return { ok: false };
  }
}
