import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { AnalyticsTracker } from "@/components/public/analytics-tracker";
import { ConsentBanner } from "@/components/public/consent-banner";
import { GoogleTags } from "@/components/public/google-tags";
import { WhatsappFloat } from "@/components/public/whatsapp-float";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getIntegrations, hasActiveIntegrations } from "@/lib/integrations/queries";
import { getPublicWhatsapp } from "@/lib/whatsapp/queries";
import { getSiteSettings } from "@/lib/settings/queries";
import { getGlobalSchema } from "@/lib/seo/store";
import { resolveSchema, stringifySchemaForHtml } from "@/lib/seo/schema";
import { absoluteUrl } from "@/lib/utils";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const [integrations, whatsapp, settings, globalSchema] = await Promise.all([
    getIntegrations(),
    getPublicWhatsapp(),
    getSiteSettings(),
    getGlobalSchema(),
  ]);
  const consentRequired = hasActiveIntegrations(integrations);

  const globalSchemaJson = globalSchema
    ? stringifySchemaForHtml(
        resolveSchema(globalSchema.data, {
          "site.name": settings.siteName,
          "site.url": absoluteUrl("/"),
          "site.email": settings.contactEmail,
          "site.locale": locale === "id" ? "id-ID" : "en-US",
        }),
      )
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      {globalSchemaJson ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: globalSchemaJson }}
        />
      ) : null}
      <SiteHeader locale={locale} dict={dict} siteName={settings.siteName} />
      <div className="flex-1">{children}</div>
      <SiteFooter dict={dict} tagline={settings.tagline} />
      <GoogleTags integrations={integrations} />
      <AnalyticsTracker />
      {consentRequired ? <ConsentBanner dict={dict} /> : null}
      {whatsapp.numbers.length > 0 ? (
        <WhatsappFloat
          numbers={whatsapp.numbers}
          mode={whatsapp.settings.mode}
          position={whatsapp.settings.position}
          dict={dict}
        />
      ) : null}
    </div>
  );
}
