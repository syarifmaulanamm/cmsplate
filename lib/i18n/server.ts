import "server-only";
import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/** Locale dari cookie untuk area non-prefix (admin dan login). */
export async function getPreferredLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Locale yang dipasang proxy pada header `x-locale`. */
export async function getRequestLocale(): Promise<Locale> {
  const headerList = await headers();
  const value = headerList.get("x-locale");
  return isLocale(value) ? value : defaultLocale;
}

/** Href publik dengan prefiks locale. */
export function localeHref(locale: Locale, path = "/") {
  return `/${locale}${path === "/" ? "" : path}`;
}

export function alternatesFor(path: string) {
  const canonical = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: `/id${canonical}`,
    languages: {
      "id-ID": `/id${canonical}`,
      "en-US": `/en${canonical}`,
      "x-default": `/id${canonical}`,
    },
  };
}
