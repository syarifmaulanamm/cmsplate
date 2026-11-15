export const INTEGRATION_KEYS = ["gtm", "ga4", "ads"] as const;
export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

export const integrationPatterns: Record<IntegrationKey, RegExp> = {
  gtm: /^GTM-[A-Z0-9]{4,10}$/,
  ga4: /^G-[A-Z0-9]{6,14}$/,
  ads: /^AW-[A-Z0-9]{6,12}$/,
};

export const integrationPlaceholders: Record<IntegrationKey, string> = {
  gtm: "GTM-XXXXXXX",
  ga4: "G-XXXXXXXXXX",
  ads: "AW-XXXXXXXXX",
};
