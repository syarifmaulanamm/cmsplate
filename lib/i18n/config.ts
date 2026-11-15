export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "id";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value) && locales.includes(value as Locale);
}

export const localeMeta: Record<
  Locale,
  { name: string; short: string; htmlLang: string; ogLocale: string; flagHint: string }
> = {
  id: { name: "Bahasa Indonesia", short: "ID", htmlLang: "id-ID", ogLocale: "id_ID", flagHint: "ID" },
  en: { name: "English", short: "EN", htmlLang: "en-US", ogLocale: "en_US", flagHint: "EN" },
};

export function otherLocale(locale: Locale): Locale {
  return locale === "id" ? "en" : "id";
}

/** Ganti prefiks locale pada sebuah path. */
export function switchLocalePath(pathname: string, next: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return `/${next}`;
  if (isLocale(segments[0])) {
    segments[0] = next;
    return `/${segments.join("/")}`;
  }
  return `/${next}/${segments.join("/")}`;
}

/** Path publik tanpa prefiks locale, dipakai untuk menyusun alternates. */
export function stripLocale(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    return `/${segments.slice(1).join("/")}`;
  }
  return pathname;
}
