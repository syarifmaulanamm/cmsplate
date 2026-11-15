import type { Metadata } from "next";
import Link from "next/link";
import { FolderTreeIcon, PlusIcon } from "lucide-react";
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
import { CategoryFilters } from "@/components/admin/categories/category-filters";
import { CategoryRowActions } from "@/components/admin/categories/category-row-actions";
import { requirePageUser } from "@/lib/rbac";
import { listCategories, listCategoryOptions } from "@/lib/categories/queries";
import { getDictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { isLocale, localeMeta, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/utils";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.categories.title,
    robots: { index: false, follow: false },
  };
}

type SearchParams = { q?: string; parent?: string; page?: string };

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePageUser("EDITOR", adminPath("/categories"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.categories;

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const parentId = params.parent ?? "";
  const page = Number(params.page ?? "1") || 1;

  const [{ items, total, pageCount, page: currentPage }, parents] = await Promise.all([
    listCategories({ locale, query, parentId: parentId || undefined, page }),
    listCategoryOptions(locale),
  ]);

  const hasFilters = Boolean(query || parentId);
  const showEmpty = items.length === 0;

  function pageHref(target: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (parentId) search.set("parent", parentId);
    if (target > 1) search.set("page", String(target));
    const suffix = search.toString();
    return suffix ? adminPath(`/categories?${suffix}`) : adminPath("/categories");
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="font-serif text-3xl tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <Button asChild>
          <Link href={adminPath("/categories/new")}>
            <PlusIcon className="size-4" aria-hidden />
            {t.create}
          </Link>
        </Button>
      </header>

      <CategoryFilters dict={dict} parents={parents} />

      {showEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <FolderTreeIcon className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-medium">
            {hasFilters ? t.emptyFilteredTitle : t.emptyTitle}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {hasFilters ? t.emptyFilteredBody : t.emptyBody}
          </p>
          {hasFilters ? (
            <Button asChild variant="soft" className="mt-5" size="sm">
              <Link href={adminPath("/categories")}>{t.resetFilters}</Link>
            </Button>
          ) : (
            <Button asChild className="mt-5" size="sm">
              <Link href={adminPath("/categories/new")}>
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
                <TableHead>{t.columns.name}</TableHead>
                <TableHead className="hidden md:table-cell">{t.columns.parent}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.columns.locale}</TableHead>
                <TableHead className="hidden lg:table-cell">{t.columns.posts}</TableHead>
                <TableHead className="hidden lg:table-cell">{t.columns.updated}</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">{dict.common.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Link
                      href={adminPath(`/categories/${category.id}`)}
                      className="block max-w-[22rem] truncate font-medium transition-colors hover:text-primary"
                    >
                      {category.name}
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">
                      /{category.slug}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {category.parentName ?? "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex gap-1">
                      {category.locales.map((item) => (
                        <Badge key={item} variant="muted" className="text-[10px]">
                          {localeMeta[item].short}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden tabular-nums lg:table-cell">
                    {category.postCount}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {formatDate(category.updatedAt, locale === "id" ? "id-ID" : "en-US")}
                  </TableCell>
                  <TableCell className="text-right">
                    <CategoryRowActions
                      id={category.id}
                      name={category.name}
                      dict={dict}
                      canEdit
                    />
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
    </div>
  );
}
