import type { Metadata } from "next";
import { requirePageUser } from "@/lib/rbac";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getPreferredLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminPath } from "@/lib/admin-path";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("AUTHOR", adminPath(""));
  const locale: Locale = isLocale(user.locale) ? user.locale : await getPreferredLocale();
  const dict = getDictionary(locale);

  return (
    <AdminShell user={user} locale={locale} dict={dict}>
      {children}
    </AdminShell>
  );
}
