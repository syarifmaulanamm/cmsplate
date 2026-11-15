import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleIcon, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WhatsappSettingsForm } from "@/components/admin/whatsapp/settings-form";
import { WhatsappRowActions } from "@/components/admin/whatsapp/row-actions";
import { requirePageUser } from "@/lib/rbac";
import { getWhatsappSettings, listWhatsappNumbers } from "@/lib/whatsapp/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.whatsapp.title,
    robots: { index: false, follow: false },
  };
}

export default async function WhatsappPage() {
  const user = await requirePageUser("EDITOR", adminPath("/whatsapp"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.whatsapp;

  const [numbers, settings] = await Promise.all([listWhatsappNumbers(), getWhatsappSettings()]);

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="font-serif text-3xl tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <Button asChild>
          <Link href={adminPath("/whatsapp/new")}>
            <PlusIcon className="size-4" aria-hidden />
            {t.create}
          </Link>
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4">
          {numbers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[var(--whatsapp)]/10 text-[var(--whatsapp)]">
                <MessageCircleIcon className="size-5" aria-hidden />
              </span>
              <p className="mt-4 text-sm font-medium">{t.emptyTitle}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
              <Button asChild className="mt-5" size="sm">
                <Link href={adminPath("/whatsapp/new")}>
                  <PlusIcon className="size-4" aria-hidden />
                  {t.create}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.columns.label}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.columns.agent}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t.columns.phone}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.columns.schedule}</TableHead>
                  <TableHead>{t.columns.status}</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">{dict.common.actions}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbers.map((number) => (
                  <TableRow key={number.id}>
                    <TableCell>
                      <Link
                        href={adminPath(`/whatsapp/${number.id}`)}
                        className="font-medium transition-colors hover:text-primary"
                      >
                        {number.label}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {number.agentName}
                    </TableCell>
                    <TableCell className="hidden font-mono text-[12px] sm:table-cell">
                      +{number.phone}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {number.schedule
                        ? `${number.schedule.start}–${number.schedule.end}`
                        : "24/7"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={!number.isActive ? "muted" : number.online ? "success" : "warning"}
                        className="text-[10px]"
                      >
                        {!number.isActive
                          ? t.status.inactive
                          : number.online
                            ? t.status.online
                            : t.status.offline}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <WhatsappRowActions id={number.id} name={number.label} dict={dict} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <WhatsappSettingsForm dict={dict} settings={settings} />
      </div>
    </div>
  );
}
