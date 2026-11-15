import { defaultLocale, isLocale, type Locale } from "./config";
import { id, type Dictionary } from "./dictionaries/id";
import { en } from "./dictionaries/en";

export * from "./config";
export * from "./format";

const dictionaries: Record<Locale, Dictionary> = { id, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/** Untuk kode server: locale dari parameter route dengan fallback aman. */
export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export type { Dictionary };
