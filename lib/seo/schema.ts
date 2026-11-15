export const schemaTemplates = {
  article: {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "{{post.title}}",
    description: "{{post.excerpt}}",
    inLanguage: "{{post.locale}}",
    datePublished: "{{post.publishedAt}}",
    author: { "@type": "Person", name: "{{post.author}}" },
    publisher: { "@type": "Organization", name: "{{site.name}}" },
    mainEntityOfPage: "{{post.url}}",
    image: "{{post.image}}",
  },
  faq: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "{{post.title}}",
        acceptedAnswer: { "@type": "Answer", text: "{{post.excerpt}}" },
      },
    ],
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "{{site.name}}", item: "{{site.url}}" },
      { "@type": "ListItem", position: 2, name: "{{post.title}}", item: "{{post.url}}" },
    ],
  },
} as const;

export const globalSchemaTemplates = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "{{site.name}}",
    url: "{{site.url}}",
    logo: "{{site.url}}/favicon.ico",
  },
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "{{site.name}}",
    url: "{{site.url}}",
    inLanguage: "{{site.locale}}",
  },
  localBusiness: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "{{site.name}}",
    url: "{{site.url}}",
    telephone: "{{site.email}}",
    address: { "@type": "PostalAddress", addressCountry: "ID" },
  },
} as const;

export type SchemaTemplateKey = keyof typeof schemaTemplates;
export type GlobalSchemaTemplateKey = keyof typeof globalSchemaTemplates;

export function parseSchemaJson(raw: string): { ok: true; data: unknown } | { ok: false } {
  if (!raw.trim()) return { ok: true, data: null };
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return { ok: false };
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

function replacePlaceholders(value: string, vars: Record<string, string>) {
  return value.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key: string) => vars[key] ?? match);
}

/** Ganti variabel `{{...}}` secara rekursif pada struktur JSON. */
export function resolveSchema(value: unknown, vars: Record<string, string>): unknown {
  if (typeof value === "string") return replacePlaceholders(value, vars);
  if (Array.isArray(value)) return value.map((item) => resolveSchema(item, vars));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        resolveSchema(child, vars),
      ]),
    );
  }
  return value;
}

export function stringifySchemaForHtml(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
