import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { requirePageUser } from "@/lib/rbac";
import { getCategoryDetail, listCategoryOptions } from "@/lib/categories/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { CategoryForm, type CategoryFormDefaults } from "@/components/admin/categories/category-form";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.categories.editPage.title,
    robots: { index: false, follow: false },
  };
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser("EDITOR", adminPath("/categories"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.categories;

  const { id } = await params;
  const [category, parents] = await Promise.all([
    getCategoryDetail(id, locale),
    listCategoryOptions(locale, id),
  ]);

  if (!category) notFound();

  const defaults: CategoryFormDefaults = {
    id: category.id,
    parentId: category.parentId,
    position: category.position,
    locales: Object.fromEntries(
      locales.map((item) => {
        const translation = category.translations.find((entry) => entry.locale === item);
        return [
          item,
          {
            name: translation?.name ?? "",
            slug: translation?.slug ?? "",
            description: translation?.description ?? "",
            metaTitle: translation?.metaTitle ?? "",
            metaDescription: translation?.metaDescription ?? "",
          },
        ];
      }),
    ) as CategoryFormDefaults["locales"],
  };

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Link
          href={adminPath(`/categories/${category.id}`)}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t.detail.backToIndex}
        </Link>
        <h1 className="font-serif text-3xl tracking-tight">{t.editPage.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t.editPage.description}</p>
      </header>

      <CategoryForm dict={dict} mode="edit" defaults={defaults} parents={parents} />
    </div>
  );
}
