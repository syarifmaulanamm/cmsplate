import type { Metadata } from "next";
import Link from "next/link";
import { requirePageUser } from "@/lib/rbac";
import { getGlobalSchema } from "@/lib/seo/store";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { GlobalSchemaForm } from "@/components/admin/schema/global-schema-form";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.schema.title,
    robots: { index: false, follow: false },
  };
}

export default async function SchemaPage() {
  const user = await requirePageUser("EDITOR", adminPath("/schema"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const schema = await getGlobalSchema();

  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="font-serif text-3xl tracking-tight">{dict.admin.schema.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{dict.admin.schema.description}</p>
      </header>

      <GlobalSchemaForm dict={dict} initialJson={schema?.raw ?? ""} />

      <p className="text-xs text-muted-foreground">
        {dict.admin.schema.perPost}{" "}
        <Link href={adminPath("/posts")} className="text-primary underline-offset-4 hover:underline">
          {dict.admin.posts.title}
        </Link>
      </p>
    </div>
  );
}
