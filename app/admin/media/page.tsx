import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileTextIcon, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaFilters } from "@/components/admin/media/media-filters";
import { MediaUploadButton } from "@/components/admin/media/media-upload-button";
import { MediaUrlPicker } from "@/components/admin/media/media-url-picker";
import { MediaCardActions } from "@/components/admin/media/media-card-actions";
import { requirePageUser } from "@/lib/rbac";
import { canPublish } from "@/lib/roles";
import { listMedia } from "@/lib/media/queries";
import { getDictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { adminPath } from "@/lib/admin-path";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: getDictionary(locale).admin.media.title,
    robots: { index: false, follow: false },
  };
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const user = await requirePageUser("AUTHOR", adminPath("/media"));
  const locale: Locale = isLocale(user.locale) ? user.locale : "id";
  const dict = getDictionary(locale);
  const t = dict.admin.media;

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const type = params.type === "image" || params.type === "document" ? params.type : "all";
  const page = Number(params.page ?? "1") || 1;

  const { items, total, pageCount, page: currentPage } = await listMedia({ query, type, page });

  const hasFilters = Boolean(query || type !== "all");
  const canDelete = canPublish(user.role);

  function pageHref(target: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (type !== "all") search.set("type", type);
    if (target > 1) search.set("page", String(target));
    const suffix = search.toString();
    return suffix ? adminPath(`/media?${suffix}`) : adminPath("/media");
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="font-serif text-3xl tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MediaUrlPicker dict={dict} />
          <MediaUploadButton dict={dict} />
        </div>
      </header>

      <MediaFilters dict={dict} />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <ImageIcon className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-medium">
            {hasFilters ? t.emptyFilteredTitle : t.emptyTitle}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {hasFilters ? t.emptyFilteredBody : t.emptyBody}
          </p>
          {hasFilters ? (
            <Button asChild variant="soft" className="mt-5" size="sm">
              <Link href={adminPath("/media")}>{dict.common.reset}</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((item) => {
              const thumb =
                item.variants.find((variant) => variant.label === "thumb")?.url ??
                item.variants.find((variant) => variant.label === "medium")?.url ??
                item.url;
              const isImage = item.mimeType.startsWith("image/");

              return (
                <li
                  key={item.id}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-elevated-sm"
                >
                  <div className="relative aspect-square bg-muted">
                    {isImage ? (
                      <Image
                        src={thumb}
                        alt={item.alt || item.filename}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-muted-foreground">
                        <FileTextIcon className="size-8" aria-hidden />
                      </span>
                    )}
                    <div className="absolute top-2 right-2 rounded-lg bg-card/90 shadow-elevated-sm backdrop-blur">
                      <MediaCardActions media={item} dict={dict} canDelete={canDelete} />
                    </div>
                  </div>
                  <div className="grid gap-1 p-3">
                    <p className="truncate text-[13px] font-medium" title={item.filename}>
                      {item.filename}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>{formatSize(item.size)}</span>
                      <Badge variant={item.usage > 0 ? "success" : "muted"} className="text-[10px]">
                        {item.usage > 0
                          ? formatMessage(t.usedIn, { count: item.usage })
                          : t.notUsed}
                      </Badge>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>{total}</p>
            <div className="flex items-center gap-2">
              <Button asChild variant="soft" size="sm" disabled={currentPage <= 1}>
                {currentPage <= 1 ? (
                  <span>{dict.admin.categories.list.prev}</span>
                ) : (
                  <Link href={pageHref(currentPage - 1)}>{dict.admin.categories.list.prev}</Link>
                )}
              </Button>
              <span className="text-xs">
                {formatMessage(dict.admin.categories.list.page, {
                  page: currentPage,
                  total: pageCount,
                })}
              </span>
              <Button asChild variant="soft" size="sm" disabled={currentPage >= pageCount}>
                {currentPage >= pageCount ? (
                  <span>{dict.admin.categories.list.next}</span>
                ) : (
                  <Link href={pageHref(currentPage + 1)}>{dict.admin.categories.list.next}</Link>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
