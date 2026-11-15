import Link from "next/link";
import {
  ArrowUpRightIcon,
  EyeIcon,
  FileTextIcon,
  GaugeIcon,
  ImageIcon,
  PlusIcon,
  SettingsIcon,
  ShieldAlertIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/rbac";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getDictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/utils";
import { adminPath } from "@/lib/admin-path";

const statusTone = {
  DRAFT: "muted",
  IN_REVIEW: "warning",
  SCHEDULED: "default",
  PUBLISHED: "success",
  ARCHIVED: "secondary",
} as const;

const statusKey = {
  DRAFT: "draft",
  IN_REVIEW: "in_review",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export default async function DashboardPage() {
  const user = await requirePageUser("AUTHOR", adminPath(""));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.dashboard;

  const data = await getDashboardData({ locale, role: user.role, userId: user.id });

  const firstName = user.name.split(" ")[0] ?? user.name;
  const hour = new Date().getHours();
  const greeting = hour < 11 ? t.morning : hour < 18 ? t.afternoon : t.evening;
  const numberFormat = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US");

  const kpis = [
    {
      label: t.kpis.published,
      icon: FileTextIcon,
      value: numberFormat.format(data.published),
      hint: t.kpis.hints.published,
    },
    {
      label: t.kpis.views,
      icon: EyeIcon,
      value: numberFormat.format(data.views7d),
      hint: t.kpis.hints.views,
    },
    {
      label: t.kpis.seoScore,
      icon: GaugeIcon,
      value: data.averageScore === null ? "—" : String(Math.round(data.averageScore)),
      hint: t.kpis.hints.seo,
    },
    {
      label: t.kpis.review,
      icon: SparklesIcon,
      value: numberFormat.format(data.review),
      hint: t.kpis.hints.review,
    },
  ];

  return (
    <div className="grid gap-8">
      <header className="grid gap-1.5">
        <p className="text-[13px] text-muted-foreground">
          {formatDate(new Date(), locale === "id" ? "id-ID" : "en-US")}
        </p>
        <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
          {formatMessage(t.greeting, { greeting, name: firstName })}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{t.intro}</p>
      </header>

      <section aria-label={dict.admin.nav.dashboard} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="gap-4 p-5">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardDescription className="text-[13px]">{kpi.label}</CardDescription>
              <span className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground">
                <kpi.icon className="size-4" aria-hidden />
              </span>
            </CardHeader>
            <CardContent className="grid gap-1">
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="grid gap-1">
              <CardTitle>{t.recent.title}</CardTitle>
              <CardDescription>{t.recent.description}</CardDescription>
            </div>
            <Button asChild variant="soft" size="sm">
              <Link href={adminPath("/posts")}>
                {t.recent.all}
                <ArrowUpRightIcon className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/60 px-6 py-12 text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-xl bg-secondary text-muted-foreground">
                  <FileTextIcon className="size-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-medium">{t.recent.emptyTitle}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  {t.recent.emptyBody}
                </p>
                <Button asChild className="mt-5" size="sm">
                  <Link href={adminPath("/posts/new")}>
                    <PlusIcon className="size-4" aria-hidden />
                    {t.recent.write}
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="grid gap-1">
                {data.recent.map((post) => (
                  <li key={post.postId}>
                    <Link
                      href={adminPath(`/posts/${post.postId}/edit`)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{post.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(post.updatedAt, locale === "id" ? "id-ID" : "en-US")}
                        </span>
                      </span>
                      <Badge variant={statusTone[post.status]} className="text-[10px]">
                        {dict.admin.status[statusKey[post.status]]}
                      </Badge>
                      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                        {post.seoScore}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.seoCard.title}</CardTitle>
              <CardDescription>{t.seoCard.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.seo ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums">{data.seo.score}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={data.seo.critical > 0 ? "destructive" : "muted"}>
                      <ShieldAlertIcon className="size-3" aria-hidden />
                      {formatMessage(t.seoCard.critical, { count: data.seo.critical })}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatMessage(t.seoCard.issues, { count: data.seo.openIssues })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.seo.openIssues === 0 ? t.seoCard.empty : t.seoCard.hint}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t.seoCard.never}</p>
              )}
              <Button asChild variant="soft" size="sm" className="w-fit">
                <Link href={adminPath("/seo")}>{t.seoCard.action}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.quick.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="soft" size="sm" className="justify-start">
                <Link href={adminPath("/posts/new")}>
                  <PlusIcon className="size-4" aria-hidden />
                  {t.quick.write}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="justify-start">
                <Link href={adminPath("/media")}>
                  <ImageIcon className="size-4" aria-hidden />
                  {t.quick.media}
                </Link>
              </Button>
              {user.role === "SUPER_ADMIN" ? (
                <Button asChild variant="ghost" size="sm" className="justify-start">
                  <Link href={adminPath("/settings")}>
                    <SettingsIcon className="size-4" aria-hidden />
                    {t.quick.settings}
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
