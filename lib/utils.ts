import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format tanggal panjang ala Indonesia: 15 November 2026 */
export function formatDate(date: Date | string, locale = "id-ID") {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

/** "3 menit lalu" tanpa dependensi tambahan */
export function timeAgo(date: Date | string, locale = "id") {
  const value = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(0, Date.now() - value.getTime());
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1_000],
  ];

  for (const [unit, ms] of units) {
    if (diff >= ms || unit === "second") {
      return formatter.format(-Math.round(diff / ms), unit);
    }
  }
  return formatter.format(0, "second");
}

/** Perkiraan waktu baca dalam menit, minimal 1 */
export function readingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Warna pastel deterministik dari nama, dipakai avatar inisial */
export function avatarTone(seed: string) {
  const tones = [
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
    "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200",
    "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200",
  ];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  }
  return tones[hash % tones.length] ?? tones[0];
}

export function absoluteUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
