import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsappRowActions } from "@/components/admin/whatsapp/row-actions";
import { requirePageUser } from "@/lib/rbac";
import { getWhatsappNumber } from "@/lib/whatsapp/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { whatsappLink } from "@/lib/whatsapp/schedule";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.whatsapp.detail.title,
    robots: { index: false, follow: false },
  };
}

export default async function WhatsappDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser("EDITOR", adminPath("/whatsapp"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.whatsapp;

  const { id } = await params;
  const number = await getWhatsappNumber(id);
  if (!number) notFound();

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <Link
          href={adminPath("/whatsapp")}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t.detail.backToIndex}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <h1 className="font-serif text-3xl tracking-tight">{number.label}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">+{number.phone}</span>
              <Badge variant={number.isActive ? (number.online ? "success" : "warning") : "muted"} className="text-[10px]">
                {number.isActive
                  ? number.online
                    ? t.status.online
                    : t.status.offline
                  : t.status.inactive}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href={adminPath(`/whatsapp/${number.id}/edit`)}>
                <PencilIcon className="size-4" aria-hidden />
                {t.detail.editAction}
              </Link>
            </Button>
            <WhatsappRowActions id={number.id} name={number.label} dict={dict} trigger="button" />
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.detail.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t.columns.agent}</dt>
                <dd className="font-medium">{number.agentName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t.columns.schedule}</dt>
                <dd className="font-medium">
                  {number.schedule
                    ? `${number.schedule.days.join(", ")} · ${number.schedule.start}–${number.schedule.end} (${number.schedule.timezone})`
                    : "24/7"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t.form.weight}</dt>
                <dd className="font-medium tabular-nums">{number.weight}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t.form.position}</dt>
                <dd className="font-medium tabular-nums">{number.position}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t.form.message}</dt>
                <dd className="mt-1 leading-relaxed">{number.defaultMessage || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {number.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={number.avatarUrl}
                alt={number.agentName}
                className="size-16 rounded-full border border-border object-cover"
              />
            ) : null}
            <Button asChild variant="soft" size="sm">
              <a
                href={whatsappLink(number.phone, number.defaultMessage || undefined)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {dict.public.whatsapp.open}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
