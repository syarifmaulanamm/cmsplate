import Script from "next/script";
import type { Integrations } from "@/lib/integrations/queries";

/**
 * Consent Mode v2 default `denied`, lalu GTM/GA4/Ads.
 * Jika GTM aktif, GA4 dan Ads tidak diinjeksi langsung agar tidak dobel hit.
 */
export function GoogleTags({ integrations }: { integrations: Integrations }) {
  const gtm = integrations.gtm;
  const ga4 = integrations.ga4;
  const ads = integrations.ads;

  const active = [gtm, ga4, ads].filter((item) => item.enabled && item.id);
  if (active.length === 0) return null;

  const gtmActive = gtm.enabled && Boolean(gtm.id);

  return (
    <>
      <Script id="consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
        `}
      </Script>

      {gtmActive ? (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm.id}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtm.id}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      ) : null}

      {!gtmActive && ga4.enabled && ga4.id ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4.id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`gtag('js', new Date()); gtag('config', '${ga4.id}');`}
          </Script>
        </>
      ) : null}

      {!gtmActive && ads.enabled && ads.id ? (
        <Script id="ads-init" strategy="afterInteractive">
          {`gtag('config', '${ads.id}');`}
        </Script>
      ) : null}
    </>
  );
}
