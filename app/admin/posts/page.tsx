import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileTextIcon, PlusIcon } from "lucide-react";
import type { PostStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PostFilters } from "@/components/admin/posts/post-filters";
import { PostRowActions } from "@/components/admin/posts/post-row-actions";
import { requirePageUser } from "@/lib/rbac";
import { listPosts, countDeletedPosts } from "@/lib/posts/queries";
import { listCategoryOptions } from "@/lib/categories/queries";
import { getDictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { isLocale, localeMeta, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/utils";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.posts.title,
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

const validStatuses: PostStatus[] = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }>;
}) {
  const user = await requirePageUser("AUTHOR", adminPath("/posts"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.posts;

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const categoryId = params.category ?? "";
  const status = validStatuses.find((value) => value === params.status);
  const page = Number(params.page ?? "1") || 1;

  const [{ items, total, pageCount, page: currentPage }, categories, trashedCount] = await Promise.all([
    listPosts({
      locale,
      query,
      status,
      categoryId: categoryId || undefined,
      page,
      authorId: user.role === "AUTHOR" ? user.id : undefined,
    }),
    listCategoryOptions(locale),
    countDeletedPosts(),
  ]);

  const hasFilters = Boolean(query || status || categoryId);

  function pageHref(target: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (status) search.set("status", status);
    if (categoryId) search.set("category", categoryId);
    if (target > 1) search.set("page", String(target));
    const suffix = search.toString();
    return suffix ? adminPath(`/posts?${suffix}`) : adminPath("/posts");
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="font-serif text-3xl tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="soft">
            <Link href={adminPath("/posts/trash")}>
              {t.trash.open}
              {trashedCount > 0 ? (
                <span className="rounded-full bg-secondary px-1.5 text-[11px] tabular-nums">
                  {trashedCount}
                </span>
              ) : null}
            </Link>
          </Button>
          <Button asChild>
            <Link href={adminPath("/posts/new")}>
              <PlusIcon className="size-4" aria-hidden />
              {t.create}
            </Link>
          </Button>
        </div>
      </header>

      <PostFilters dict={dict} categories={categories} />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <FileTextIcon className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-medium">
            {hasFilters ? t.emptyFilteredTitle : t.emptyTitle}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {hasFilters ? t.emptyFilteredBody : t.emptyBody}
          </p>
          {hasFilters ? (
            <Button asChild variant="soft" className="mt-5" size="sm">
              <Link href={adminPath("/posts")}>{t.resetFilters}</Link>
            </Button>
          ) : (
            <Button asChild className="mt-5" size="sm">
              <Link href={adminPath("/posts/new")}>
                <PlusIcon className="size-4" aria-hidden />
                {t.create}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.columns.title}</TableHead>
                <TableHead>{t.columns.status}</TableHead>
                <TableHead className="hidden md:table-cell">{t.columns.category}</TableHead>
                <TableHead className="hidden lg:table-cell">{t.columns.author}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.columns.seo}</TableHead>
                <TableHead className="hidden lg:table-cell">{t.columns.updated}</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">{dict.common.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {post.featuredImage ? (
                        <span className="relative hidden size-10 shrink-0 overflow-hidden rounded-md border border-border sm:block">
                          <Image
                            src={post.featuredImage.url}
                            alt={post.featuredImage.alt}
                            fill
                            unoptimized
                            sizes="40px"
                            className="object-cover"
                          />
                        </span>
                      ) : null}
                      <div className="min-w-0">
                        <Link
                          href={adminPath(`/posts/${post.id}`)}
                          className="block max-w-[24rem] truncate font-medium transition-colors hover:text-primary"
                        >
                          {post.title}
                        </Link>
                        <span className="font-mono text-xs text-muted-foreground">
                          /{post.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusTone[post.status]} className="text-[10px]">
                      {dict.admin.status[statusKey[post.status]]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {post.categoryName}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {post.authorName}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="tabular-nums">{post.seoScore}</span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {formatDate(post.updatedAt, locale === "id" ? "id-ID" : "en-US")}
                  </TableCell>
                  <TableCell className="text-right">
                    <PostRowActions id={post.id} name={post.title} dict={dict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              {formatMessage(t.list.showing, {
                from: (currentPage - 1) * 20 + 1,
                to: Math.min(currentPage * 20, total),
                total,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button asChild variant="soft" size="sm" disabled={currentPage <= 1}>
                {currentPage <= 1 ? (
                  <span>{t.list.prev}</span>
                ) : (
                  <Link href={pageHref(currentPage - 1)}>{t.list.prev}</Link>
                )}
              </Button>
              <span className="text-xs">
                {formatMessage(t.list.page, { page: currentPage, total: pageCount })}
              </span>
              <Button asChild variant="soft" size="sm" disabled={currentPage >= pageCount}>
                {currentPage >= pageCount ? (
                  <span>{t.list.next}</span>
                ) : (
                  <Link href={pageHref(currentPage + 1)}>{t.list.next}</Link>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        {localeMeta[locale].name} · {items.length} {dict.admin.posts.columns.title.toLowerCase()}
      </p>
    </div>
  );
}
