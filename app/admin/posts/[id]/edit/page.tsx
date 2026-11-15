import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { requirePageUser } from "@/lib/rbac";
import { getPostDetail } from "@/lib/posts/queries";
import { listCategoryOptions } from "@/lib/categories/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { PostForm, type PostFormDefaults } from "@/components/admin/posts/post-form";
import type { PostStatusValue } from "@/lib/posts/schema";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.posts.detail.editAction,
    robots: { index: false, follow: false },
  };
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser("AUTHOR", adminPath("/posts"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);

  const { id } = await params;
  const [post, categories] = await Promise.all([
    getPostDetail(id, locale),
    listCategoryOptions(locale),
  ]);

  if (!post) notFound();
  if (user.role === "AUTHOR" && post.authorId !== user.id) notFound();

  const defaults: PostFormDefaults = {
    id: post.id,
    categoryId: post.categoryId,
    featuredImageId: post.featuredImageId,
    featuredImageUrl: post.featuredImageUrl,
    locales: Object.fromEntries(
      locales.map((item) => {
        const translation = post.translations.find((entry) => entry.locale === item);
        return [
          item,
          {
            title: translation?.title ?? "",
            slug: translation?.slug ?? "",
            excerpt: translation?.excerpt ?? "",
            metaTitle: translation?.metaTitle ?? "",
            metaDescription: translation?.metaDescription ?? "",
            focusKeyword: translation?.focusKeyword ?? "",
            contentHtml: translation?.contentHtml ?? "",
            status: (translation?.status ?? "DRAFT") as PostStatusValue,
            publishedAt: translation?.publishedAt ? translation.publishedAt.toISOString() : "",
          },
        ];
      }),
    ) as PostFormDefaults["locales"],
    seo: {
      ogTitle: post.seo.ogTitle,
      ogDescription: post.seo.ogDescription,
      ogImageId: post.seo.ogImageId,
      ogImageUrl: post.seo.ogImageUrl,
      ogType: post.seo.ogType === "website" ? "website" : "article",
      twitterCard: post.seo.twitterCard === "summary" ? "summary" : "summary_large_image",
    },
    schemaJson: post.schemaJson,
  };

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Link
          href={adminPath(`/posts/${post.id}`)}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {dict.admin.posts.form.back}
        </Link>
        <h1 className="font-serif text-3xl tracking-tight">{post.title}</h1>
      </header>

      <PostForm dict={dict} mode="edit" defaults={defaults} categories={categories} />
    </div>
  );
}
