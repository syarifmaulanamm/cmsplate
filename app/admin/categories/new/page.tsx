import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { requirePageUser } from "@/lib/rbac";
import { listCategoryOptions } from "@/lib/categories/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.categories.createPage.title,
    robots: { index: false, follow: false },
  };
}

export default async function NewCategoryPage() {
  const user = await requirePageUser("EDITOR", adminPath("/categories/new"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.categories;
  const parents = await listCategoryOptions(locale);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Link
          href={adminPath("/categories")}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t.form.back}
        </Link>
        <h1 className="font-serif text-3xl tracking-tight">{t.createPage.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t.createPage.description}</p>
      </header>

      <CategoryForm dict={dict} mode="create" parents={parents} />
    </div>
  );
}
