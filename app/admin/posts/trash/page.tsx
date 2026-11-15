import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrashRowActions } from "@/components/admin/posts/trash-row-actions";
import { requirePageUser } from "@/lib/rbac";
import { listDeletedPosts } from "@/lib/posts/queries";
import { getDictionary } from "@/lib/i18n";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/utils";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.posts.trash.title,
    robots: { index: false, follow: false },
  };
}

export default async function TrashPage() {
  const user = await requirePageUser("EDITOR", adminPath("/posts/trash"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.posts.trash;

  const { items, total } = await listDeletedPosts({ locale });

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Link
          href={adminPath("/posts")}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {t.back}
        </Link>
        <h1 className="font-serif text-3xl tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <Trash2Icon className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-medium">{t.emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyBody}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.columns.title}</TableHead>
              <TableHead className="hidden md:table-cell">{t.columns.category}</TableHead>
              <TableHead className="hidden lg:table-cell">{t.columns.author}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.columns.deletedAt}</TableHead>
              <TableHead className="w-48 text-right">
                <span className="sr-only">{dict.common.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <span className="block max-w-[22rem] truncate font-medium">{post.title}</span>
                  <span className="font-mono text-xs text-muted-foreground">/{post.slug}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {post.categoryName}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {post.authorName}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {formatDate(post.deletedAt, locale === "id" ? "id-ID" : "en-US")}
                </TableCell>
                <TableCell>
                  <TrashRowActions
                    id={post.id}
                    name={post.title}
                    dict={dict}
                    canDeleteForever={user.role === "SUPER_ADMIN"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <p className="text-xs text-muted-foreground">{total}</p>
    </div>
  );
}
