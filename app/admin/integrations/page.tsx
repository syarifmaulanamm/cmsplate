import type { Metadata } from "next";
import { requirePageUser } from "@/lib/rbac";
import { getIntegrations } from "@/lib/integrations/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { IntegrationForm } from "@/components/admin/integrations/integration-form";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.integrations.title,
    robots: { index: false, follow: false },
  };
}

export default async function IntegrationsPage() {
  const user = await requirePageUser("SUPER_ADMIN", adminPath("/integrations"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const integrations = await getIntegrations();

  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="font-serif text-3xl tracking-tight">{dict.admin.integrations.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {dict.admin.integrations.description}
        </p>
      </header>

      <div className="max-w-2xl">
        <IntegrationForm dict={dict} integrations={integrations} />
      </div>
    </div>
  );
}
