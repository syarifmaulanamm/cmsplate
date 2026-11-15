import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRowActions } from "@/components/admin/users/row-actions";
import { requirePageUser } from "@/lib/rbac";
import { getUser } from "@/lib/users/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { formatDate } from "@/lib/utils";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.users.detail.title,
    robots: { index: false, follow: false },
  };
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePageUser("SUPER_ADMIN", adminPath("/users"));
  const locale: Locale = isLocale(actor.locale) ? actor.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.users;

  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <Link
          href={adminPath("/users")}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t.detail.backToIndex}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <h1 className="font-serif text-3xl tracking-tight">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Badge variant="muted" className="text-[10px]">
                {t.roles[user.role]}
              </Badge>
              <Badge variant={user.isActive ? "success" : "muted"} className="text-[10px]">
                {user.isActive ? t.status.active : t.status.inactive}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href={adminPath(`/users/${user.id}/edit`)}>
                <PencilIcon className="size-4" aria-hidden />
                {t.detail.editAction}
              </Link>
            </Button>
            <UserRowActions id={user.id} name={user.name} dict={dict} trigger="button" />
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.detail.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t.detail.created}</dt>
                <dd className="font-medium">
                  {formatDate(user.createdAt, locale === "id" ? "id-ID" : "en-US")}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t.detail.lastLogin}</dt>
                <dd className="font-medium">
                  {user.lastLoginAt
                    ? formatDate(user.lastLoginAt, locale === "id" ? "id-ID" : "en-US")
                    : t.detail.never}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t.detail.sessions}</dt>
                <dd className="font-medium tabular-nums">{user.sessionCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.columns.posts}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t.detail.posts}</dt>
                <dd className="font-medium tabular-nums">{user.postCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">{t.detail.media}</dt>
                <dd className="font-medium tabular-nums">{user.mediaCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
