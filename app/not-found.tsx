import Link from "next/link";
import { ArrowLeftIcon, FileQuestionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminLoginPath } from "@/lib/admin-path";

export default async function NotFound() {
  const locale = await getRequestLocale();
  const t = getDictionary(locale).public.notFound;

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <FileQuestionIcon className="size-6" aria-hidden />
        </span>
        <p className="mt-6 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {t.code}
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">{t.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href={`/${locale}`}>
              <ArrowLeftIcon className="size-4" aria-hidden />
              {t.home}
            </Link>
          </Button>
          <Button asChild variant="soft">
            <Link href={adminLoginPath()}>{t.admin}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
