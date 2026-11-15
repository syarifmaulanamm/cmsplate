import type { Metadata } from "next";
import Link from "next/link";
import { EyeIcon, FileTextIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/rbac";
import { ViewsChart } from "@/components/admin/analytics/views-chart";
import { getAnalyticsOverview, type AnalyticsRange } from "@/lib/analytics/queries";
import { env } from "@/lib/env";
import { getDictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.analytics.title,
    robots: { index: false, follow: false },
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requirePageUser("EDITOR", adminPath("/analytics"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.analytics;

  const params = await searchParams;
  const days: AnalyticsRange = params.range === "30" ? 30 : params.range === "90" ? 90 : 7;
  const data = await getAnalyticsOverview(days);

  const perDay = data.views === 0 ? 0 : Math.round(data.views / days);
  const topPage = data.topPages[0]?.path ?? "—";

  const kpis = [
    { label: t.kpis.views, value: data.views.toLocaleString(locale === "id" ? "id-ID" : "en-US"), icon: EyeIcon },
    { label: t.kpis.visitors, value: data.visitors.toLocaleString(locale === "id" ? "id-ID" : "en-US"), icon: UsersIcon },
    { label: t.kpis.perDay, value: perDay.toLocaleString(locale === "id" ? "id-ID" : "en-US"), icon: TrendingUpIcon },
    { label: t.kpis.topPage, value: topPage, icon: FileTextIcon },
  ];

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="font-serif text-3xl tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {([7, 30, 90] as AnalyticsRange[]).map((range) => (
            <Button
              key={range}
              asChild
              size="sm"
              variant={days === range ? "default" : "ghost"}
              className="h-8"
            >
              <Link href={adminPath(`/analytics?range=${range}`)}>
                {range === 7 ? t.ranges.d7 : range === 30 ? t.ranges.d30 : t.ranges.d90}
              </Link>
            </Button>
          ))}
        </div>
      </header>

      <section aria-label={t.title} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="gap-4 p-5">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardDescription className="text-[13px]">{kpi.label}</CardDescription>
              <span className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground">
                <kpi.icon className="size-4" aria-hidden />
              </span>
            </CardHeader>
            <CardContent>
              <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {data.views === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <EyeIcon className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-medium">{t.emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t.chartTitle}</CardTitle>
            <CardDescription>
              {days === 7 ? t.ranges.d7 : days === 30 ? t.ranges.d30 : t.ranges.d90}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ViewsChart data={data.daily} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t.topPages}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noData}</p>
            ) : (
              <ul className="grid gap-2.5">
                {data.topPages.map((page) => (
                  <li key={page.path} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-[12px]">{page.path}</span>
                    <span className="tabular-nums text-muted-foreground">{page.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.referrers}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.referrers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noData}</p>
            ) : (
              <ul className="grid gap-2.5">
                {data.referrers.map((referrer) => (
                  <li
                    key={referrer.source}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate">
                      {referrer.source === "direct" ? t.direct : referrer.source}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{referrer.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.devices}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.devices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noData}</p>
            ) : (
              <ul className="grid gap-2.5">
                {data.devices.map((device) => (
                  <li key={device.device} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      {device.device === "desktop"
                        ? t.device.desktop
                        : device.device === "tablet"
                          ? t.device.tablet
                          : t.device.mobile}
                    </span>
                    <Badge variant="muted" className="tabular-nums text-[11px]">
                      {device.views}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        {formatMessage(t.note, { days: env.ANALYTICS_RETENTION_DAYS })}
      </p>
    </div>
  );
}
