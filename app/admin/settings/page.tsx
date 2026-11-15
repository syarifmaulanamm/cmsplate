import type { Metadata } from "next";
import { requirePageUser } from "@/lib/rbac";
import { getSiteSettings } from "@/lib/settings/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.settings.title,
    robots: { index: false, follow: false },
  };
}

export default async function SettingsPage() {
  const user = await requirePageUser("SUPER_ADMIN", adminPath("/settings"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();

  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="font-serif text-3xl tracking-tight">{dict.admin.settings.title}</h1>
        <p className="text-sm text-muted-foreground">{dict.admin.settings.description}</p>
      </header>

      <SettingsForm dict={dict} settings={settings} />
    </div>
  );
}
