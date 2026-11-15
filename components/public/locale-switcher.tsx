"use client";

import { usePathname, useRouter } from "next/navigation";
import { LanguagesIcon } from "lucide-react";
import {
  LOCALE_COOKIE,
  localeMeta,
  otherLocale,
  switchLocalePath,
  type Locale,
} from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const next = otherLocale(locale);

  function switchTo() {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.push(switchLocalePath(pathname, next));
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchTo}
      aria-label={`${label}: ${localeMeta[next].name}`}
      className="gap-1.5"
    >
      <LanguagesIcon className="size-4" aria-hidden />
      <span className="text-[13px] font-medium">{localeMeta[next].short}</span>
    </Button>
  );
}
