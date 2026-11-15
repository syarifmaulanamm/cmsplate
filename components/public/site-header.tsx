import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/public/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { adminPath } from "@/lib/admin-path";

export function SiteHeader({
  locale,
  dict,
  siteName,
}: {
  locale: Locale;
  dict: Dictionary;
  siteName?: string;
}) {
  const t = dict.public;

  return (
    <header className="sticky top-4 z-20 mx-4 md:mx-auto md:max-w-5xl">
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-elevated-sm backdrop-blur-md">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <Image
            src="/brand/cmsplate-icon.png"
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0"
            priority
          />
          <span className="text-sm font-semibold tracking-tight">
            {siteName || dict.meta.siteName}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Navigasi" className="mr-1 hidden items-center gap-0.5 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/blog`}>{t.nav.blog}</Link>
            </Button>
          </nav>
          <LocaleSwitcher locale={locale} label={t.language.label} />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href={adminPath()}>{t.nav.admin}</Link>
          </Button>
          <Button asChild size="icon-sm" className="sm:hidden" aria-label={t.nav.admin}>
            <Link href={adminPath()}>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
