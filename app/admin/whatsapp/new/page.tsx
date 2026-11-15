import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { requirePageUser } from "@/lib/rbac";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { WhatsappNumberForm } from "@/components/admin/whatsapp/number-form";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.whatsapp.create,
    robots: { index: false, follow: false },
  };
}

export default async function NewWhatsappPage() {
  const user = await requirePageUser("EDITOR", adminPath("/whatsapp/new"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Link
          href={adminPath("/whatsapp")}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {dict.admin.whatsapp.form.back}
        </Link>
        <h1 className="font-serif text-3xl tracking-tight">{dict.admin.whatsapp.create}</h1>
      </header>

      <WhatsappNumberForm dict={dict} mode="create" />
    </div>
  );
}
