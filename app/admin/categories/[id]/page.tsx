import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryRowActions } from "@/components/admin/categories/category-row-actions";
import { requirePageUser } from "@/lib/rbac";
import { getCategoryDetail } from "@/lib/categories/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, localeMeta, locales, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.categories.detail.title,
    robots: { index: false, follow: false },
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser("EDITOR", adminPath("/categories"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.categories;

  const { id } = await params;
  const category = await getCategoryDetail(id, locale);
  if (!category) notFound();

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <Link
          href={adminPath("/categories")}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t.detail.backToIndex}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <h1 className="font-serif text-3xl tracking-tight">{category.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">/{category.slug}</span>
              {category.locales.map((item) => (
                <Badge key={item} variant="muted" className="text-[10px]">
                  {localeMeta[item].short}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href={adminPath(`/categories/${category.id}/edit`)}>
                <PencilIcon className="size-4" aria-hidden />
                {t.detail.editAction}
              </Link>
            </Button>
            <CategoryRowActions
              id={category.id}
              name={category.name}
              dict={dict}
              canEdit
              trigger="button"
            />
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.form.translations}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {locales.map((item) => {
              const translation = category.translations.find((entry) => entry.locale === item);
              return (
                <div key={item} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{localeMeta[item].name}</h3>
                    {translation ? (
                      <Badge variant="success" className="text-[10px]">
                        {localeMeta[item].short}
                      </Badge>
                    ) : (
                      <Badge variant="muted" className="text-[10px]">
                        {t.localeTabs.incomplete}
                      </Badge>
                    )}
                  </div>
                  {translation ? (
                    <dl className="mt-3 grid gap-2 text-sm">
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-muted-foreground">{t.form.slug}:</dt>
                        <dd className="font-mono text-[13px]">/{translation.slug}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">{t.form.description}</dt>
                        <dd className="mt-1 leading-relaxed">
                          {translation.description || "—"}
                        </dd>
                      </div>
                      {translation.metaTitle ? (
                        <div>
                          <dt className="text-muted-foreground">{t.form.metaTitle}</dt>
                          <dd className="mt-1">{translation.metaTitle}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">{t.localeTabs.incomplete}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.form.sectionPlacement}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t.detail.parent}</dt>
                  <dd className="font-medium">{category.parentName ?? t.detail.noParent}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t.detail.position}</dt>
                  <dd className="font-medium tabular-nums">{category.position}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t.detail.postsCount}</dt>
                  <dd className="font-medium tabular-nums">{category.postCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t.detail.childrenCount}</dt>
                  <dd className="font-medium tabular-nums">{category.childCount}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {category.children.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t.detail.childrenCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={adminPath(`/categories/${child.id}`)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-accent"
                      >
                        <span className="truncate">{child.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          /{child.slug}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
