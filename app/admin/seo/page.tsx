import type { Metadata } from "next";
import Link from "next/link";
import { GaugeIcon, NewspaperIcon, ShieldAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IgnoreIssueButton } from "@/components/admin/seo/ignore-issue-button";
import { RunAuditButton } from "@/components/admin/seo/run-audit-button";
import { requirePageUser } from "@/lib/rbac";
import { getSeoOverview } from "@/lib/seo/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/utils";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.seo.monitor.title,
    robots: { index: false, follow: false },
  };
}

const severityTone = {
  CRITICAL: "destructive",
  WARNING: "warning",
  INFO: "muted",
} as const;

export default async function SeoMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string }>;
}) {
  const user = await requirePageUser("EDITOR", adminPath("/seo"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.seo.monitor;

  const params = await searchParams;
  const severity =
    params.severity === "CRITICAL" || params.severity === "WARNING" || params.severity === "INFO"
      ? params.severity
      : null;

  const { audit, issues, published, counts } = await getSeoOverview(locale);
  const filtered = severity ? issues.filter((issue) => issue.severity === severity) : issues;

  const filters: Array<{ key: string | null; label: string; count: number }> = [
    { key: null, label: t.filters.all, count: issues.length },
    { key: "CRITICAL", label: t.filters.critical, count: counts.critical },
    { key: "WARNING", label: t.filters.warning, count: counts.warning },
    { key: "INFO", label: t.filters.info, count: counts.info },
  ];

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="font-serif text-3xl tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <RunAuditButton dict={dict} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="gap-4 p-5">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardDescription className="text-[13px]">{t.score}</CardDescription>
            <span className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground">
              <GaugeIcon className="size-4" aria-hidden />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{audit?.score ?? "—"}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {audit
                ? `${t.lastRun}: ${formatDate(audit.ranAt, locale === "id" ? "id-ID" : "en-US")}`
                : t.never}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4 p-5">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardDescription className="text-[13px]">{t.published}</CardDescription>
            <span className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground">
              <NewspaperIcon className="size-4" aria-hidden />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{published}</p>
          </CardContent>
        </Card>

        <Card className="gap-4 p-5">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardDescription className="text-[13px]">{t.issues}</CardDescription>
            <span className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground">
              <ShieldAlertIcon className="size-4" aria-hidden />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{issues.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {counts.critical} · {counts.warning} · {counts.info}
            </p>
          </CardContent>
        </Card>
      </section>

      {!audit ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <p className="text-sm font-medium">{t.emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
          <div className="mt-5 flex justify-center">
            <RunAuditButton dict={dict} />
          </div>
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          {t.noIssues}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {filters.map((filter) => (
              <Button
                key={filter.key ?? "all"}
                asChild
                size="sm"
                variant={severity === filter.key ? "default" : "ghost"}
              >
                <Link
                  href={
                    filter.key ? adminPath(`/seo?severity=${filter.key}`) : adminPath("/seo")
                  }
                >
                  {filter.label}
                  <span className="ml-1.5 text-[11px] opacity-70">{filter.count}</span>
                </Link>
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.columns.severity}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.columns.rule}</TableHead>
                <TableHead>{t.columns.post}</TableHead>
                <TableHead className="hidden md:table-cell">{t.columns.message}</TableHead>
                <TableHead className="w-28 text-right">
                  <span className="sr-only">{t.ignore}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <Badge variant={severityTone[issue.severity]} className="text-[10px]">
                      {t.severities[issue.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {t.rules[issue.rule as keyof typeof t.rules] ?? issue.rule}
                  </TableCell>
                  <TableCell>
                    {issue.postId ? (
                      <Link
                        href={adminPath(`/posts/${issue.postId}/edit`)}
                        className="block max-w-[18rem] truncate font-medium transition-colors hover:text-primary"
                      >
                        {issue.postTitle ?? "—"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-[22rem] truncate text-muted-foreground md:table-cell">
                    {issue.message}
                  </TableCell>
                  <TableCell className="text-right">
                    <IgnoreIssueButton id={issue.id} dict={dict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
