import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import type { PostStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostRowActions } from "@/components/admin/posts/post-row-actions";
import { requirePageUser } from "@/lib/rbac";
import { getPostDetail } from "@/lib/posts/queries";
import { getDictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { isLocale, localeMeta, locales, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { formatDate } from "@/lib/utils";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.posts.detail.title,
    robots: { index: false, follow: false },
  };
}

const statusTone: Record<PostStatus, "muted" | "warning" | "default" | "success" | "secondary"> = {
  DRAFT: "muted",
  IN_REVIEW: "warning",
  SCHEDULED: "default",
  PUBLISHED: "success",
  ARCHIVED: "secondary",
};

const statusKey = {
  DRAFT: "draft",
  IN_REVIEW: "in_review",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser("AUTHOR", adminPath("/posts"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.posts;

  const { id } = await params;
  const post = await getPostDetail(id, locale);
  if (!post) notFound();
  if (user.role === "AUTHOR" && post.authorId !== user.id) notFound();

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <Link
          href={adminPath("/posts")}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t.detail.backToIndex}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <h1 className="font-serif text-3xl tracking-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">/{post.slug}</span>
              <Badge variant={statusTone[post.status]} className="text-[10px]">
                {dict.admin.status[statusKey[post.status]]}
              </Badge>
              {post.locales.map((item) => (
                <Badge key={item} variant={post.localesPublished.includes(item) ? "success" : "muted"} className="text-[10px]">
                  {localeMeta[item].short}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href={adminPath(`/posts/${post.id}/edit`)}>
                <PencilIcon className="size-4" aria-hidden />
                {t.detail.editAction}
              </Link>
            </Button>
            <PostRowActions id={post.id} name={post.title} dict={dict} trigger="button" />
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.detail.locales}</CardTitle>
            <CardDescription>{t.detail.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {locales.map((item) => {
              const translation = post.translations.find((entry) => entry.locale === item);
              return (
                <div key={item} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{localeMeta[item].name}</h3>
                    {translation ? (
                      <Badge variant={statusTone[translation.status]} className="text-[10px]">
                        {dict.admin.status[statusKey[translation.status]]}
                      </Badge>
                    ) : (
                      <Badge variant="muted" className="text-[10px]">
                        {t.detail.notTranslated}
                      </Badge>
                    )}
                  </div>

                  {translation ? (
                    <dl className="mt-3 grid gap-2 text-sm">
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-muted-foreground">{dict.admin.categories.form.slug}:</dt>
                        <dd className="font-mono text-[13px]">/{translation.slug}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">{t.form.excerpt}</dt>
                        <dd className="mt-1 leading-relaxed">{translation.excerpt || "—"}</dd>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          {dict.admin.seo.score}:
                          <span className="font-medium text-foreground tabular-nums">
                            {translation.seoScore}
                          </span>
                        </span>
                        <span>{formatMessage(t.detail.revision, { count: post.revisionCount })}</span>
                        {translation.publishedAt ? (
                          <span>
                            {t.detail.publishedAt}:{" "}
                            {formatDate(translation.publishedAt, locale === "id" ? "id-ID" : "en-US")}
                          </span>
                        ) : null}
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">{t.detail.notTranslated}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.detail.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t.detail.author}</dt>
                  <dd className="font-medium">{post.authorName}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t.detail.category}</dt>
                  <dd className="font-medium">{post.categoryName}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t.detail.updatedAt}</dt>
                  <dd className="font-medium">
                    {formatDate(post.updatedAt, locale === "id" ? "id-ID" : "en-US")}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
