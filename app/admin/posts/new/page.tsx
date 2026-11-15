import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { requirePageUser } from "@/lib/rbac";
import { listCategoryOptions } from "@/lib/categories/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { PostForm } from "@/components/admin/posts/post-form";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: `${getDictionary(locale).admin.posts.title} — ${getDictionary(locale).admin.posts.create}`,
    robots: { index: false, follow: false },
  };
}

export default async function NewPostPage() {
  const user = await requirePageUser("AUTHOR", adminPath("/posts/new"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const categories = await listCategoryOptions(locale);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Link
          href={adminPath("/posts")}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {dict.admin.posts.form.back}
        </Link>
        <h1 className="font-serif text-3xl tracking-tight">{dict.admin.posts.create}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {dict.admin.posts.description}
        </p>
      </header>

      <PostForm dict={dict} mode="create" categories={categories} />
    </div>
  );
}
