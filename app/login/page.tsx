import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { LoginForm, LoginLocaleToggle } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { localeMeta, otherLocale } from "@/lib/i18n/config";
import { getPreferredLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  if (session) {
    redirect(params.next ?? adminPath());
  }

  const locale = await getPreferredLocale();
  const dict = getDictionary(locale);
  const t = dict.auth;
  const next = otherLocale(locale);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-secondary/60 p-10 lg:flex">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <Image
            src="/brand/cmsplate-icon.png"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0"
            priority
          />
          <span className="text-sm font-semibold tracking-tight">{dict.meta.siteName}</span>
        </Link>

        <div className="max-w-md">
          <blockquote className="font-serif text-3xl leading-tight text-balance">{t.quote}</blockquote>
          <p className="mt-5 text-sm text-muted-foreground">{t.quoteBody}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          {t.statusActive}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -bottom-24 size-72 rounded-full border border-primary/15 bg-primary/5"
        />
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            {t.back}
          </Link>
          <div className="flex items-center gap-1">
            <LoginLocaleToggle
              label={localeMeta[next].short}
              targetLabel={localeMeta[next].name}
              localeValue={next}
            />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Image
                src="/brand/cmsplate-icon.png"
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0"
                priority
              />
            </div>
            <h1 className="font-serif text-3xl tracking-tight">{t.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>

            <div className="mt-8">
              <LoginForm next={params.next} dict={dict} />
            </div>

            <p className="mt-6 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              {t.demo}{" "}
              <span className="font-mono text-foreground">admin@simplecms.local</span> /{" "}
              <span className="font-mono text-foreground">Admin123!</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
