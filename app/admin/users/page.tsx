import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, UsersIcon } from "lucide-react";
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
import { UserRowActions } from "@/components/admin/users/row-actions";
import { requirePageUser } from "@/lib/rbac";
import { listUsers } from "@/lib/users/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/utils";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.users.title,
    robots: { index: false, follow: false },
  };
}

export default async function UsersPage() {
  const user = await requirePageUser("SUPER_ADMIN", adminPath("/users"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.users;

  const users = await listUsers();

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="font-serif text-3xl tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <Button asChild>
          <Link href={adminPath("/users/new")}>
            <PlusIcon className="size-4" aria-hidden />
            {t.create}
          </Link>
        </Button>
      </header>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <UsersIcon className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-medium">{t.emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.columns.name}</TableHead>
              <TableHead className="hidden md:table-cell">{t.columns.role}</TableHead>
              <TableHead>{t.columns.status}</TableHead>
              <TableHead className="hidden lg:table-cell">{t.columns.lastLogin}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.columns.posts}</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">{dict.common.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    href={adminPath(`/users/${item.id}`)}
                    className="block font-medium transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{item.email}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={item.role === "SUPER_ADMIN" ? "default" : "muted"} className="text-[10px]">
                    {t.roles[item.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? "success" : "muted"} className="text-[10px]">
                    {item.isActive ? t.status.active : t.status.inactive}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {item.lastLoginAt
                    ? formatDate(item.lastLoginAt, locale === "id" ? "id-ID" : "en-US")
                    : t.detail.never}
                </TableCell>
                <TableCell className="hidden tabular-nums sm:table-cell">
                  {item.postCount}
                </TableCell>
                <TableCell className="text-right">
                  <UserRowActions id={item.id} name={item.name} dict={dict} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
