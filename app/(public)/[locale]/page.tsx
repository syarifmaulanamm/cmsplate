import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, BookOpenIcon, LineChartIcon, SearchCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/settings/queries";
import { alternatesFor } from "@/lib/i18n/server";
import { adminLoginPath, adminPath } from "@/lib/admin-path";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const settings = await getSiteSettings();

  return {
    title: { absolute: settings.siteName || dict.meta.siteName },
    description: settings.description || dict.meta.description,
    alternates: alternatesFor("/"),
    openGraph: {
      title: dict.meta.siteName,
      description: dict.meta.description,
      locale: locale === "id" ? "id_ID" : "en_US",
    },
  };
}

const highlightIcons = { writing: BookOpenIcon, seo: SearchCheckIcon, analytics: LineChartIcon };

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale as Locale);
  const t = dict.public.home;
  const highlights = Object.entries(t.highlights) as Array<
    [keyof typeof highlightIcons, { title: string; description: string }]
  >;

  return (
    <main className="mx-auto max-w-5xl px-6 pt-20 pb-24 md:pt-28">
      <section className="max-w-3xl">
        <p className="mb-5 text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          {t.eyebrow}
        </p>
        <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-balance md:text-6xl">
          {t.title}
        </h1>
        <p className="prose-readable mt-6 text-muted-foreground">{t.intro}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href={adminPath("")}>
              {t.ctaPrimary}
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href={`/${locale}/blog`}>{dict.public.nav.blog}</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href={adminLoginPath()}>{t.ctaSecondary}</Link>
          </Button>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {highlights.map(([key, item]) => {
          const Icon = highlightIcons[key];
          return (
            <article
              key={key}
              className="rounded-xl border border-border bg-card p-6 shadow-elevated-sm transition-colors duration-200 hover:border-primary/30"
            >
              <Icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-4 text-sm font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mt-16 grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="grid gap-1">
          <h2 className="font-serif text-2xl tracking-tight">{dict.public.blog.title}</h2>
          <p className="text-sm text-muted-foreground">{dict.public.blog.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/${locale}/blog`}>{dict.public.nav.blog}</Link>
          </Button>
          <Button asChild variant="soft" size="sm">
            <Link href={adminPath("")}>{t.ctaPrimary}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
