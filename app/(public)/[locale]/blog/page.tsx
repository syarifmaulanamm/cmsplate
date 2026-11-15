import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { alternatesFor } from "@/lib/i18n/server";
import { listPublishedCategories, listPublishedPosts } from "@/lib/posts/public";
import { formatDate } from "@/lib/utils";
import { formatMessage } from "@/lib/i18n/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.public.blog.title,
    description: dict.public.blog.description,
    alternates: alternatesFor("/blog"),
  };
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const t = dict.public.blog;

  const { page } = await searchParams;
  const currentPage = Number(page ?? "1") || 1;

  const [posts, categories] = await Promise.all([
    listPublishedPosts({ locale, page: currentPage, pageSize: 9 }),
    listPublishedCategories(locale),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 pt-16 pb-24">
      <header className="max-w-2xl">
        <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          {dict.public.nav.blog}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">{t.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
      </header>

      {categories.length > 0 ? (
        <nav aria-label={dict.public.category.label} className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button key={category.id} asChild variant="soft" size="sm">
              <Link href={`/${locale}/kategori/${category.slug}`}>{category.name}</Link>
            </Button>
          ))}
        </nav>
      ) : null}

      {posts.items.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <p className="text-sm font-medium">{t.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.emptyBody}</p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {posts.items.map((post) => (
            <li key={post.slug}>
              <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-elevated-sm transition-colors duration-200 hover:border-primary/30">
                {post.image ? (
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="relative block aspect-[16/9] overflow-hidden bg-muted"
                  >
                    <Image
                      src={post.image.url}
                      alt={post.image.alt}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 480px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </Link>
                ) : null}

                <div className="flex flex-1 flex-col gap-3 p-5">
                  {post.categoryName ? (
                    <Badge variant="muted" className="w-fit text-[10px]">
                      {post.categoryName}
                    </Badge>
                  ) : null}
                  <h2 className="font-serif text-xl leading-snug tracking-tight">
                    <Link href={`/${locale}/blog/${post.slug}`} className="transition-colors hover:text-primary">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
                    <span>
                      {post.publishedAt
                        ? formatDate(post.publishedAt, locale === "id" ? "id-ID" : "en-US")
                        : "—"}
                    </span>
                    <span>{formatMessage(t.minRead, { count: post.readTime })}</span>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {posts.pageCount > 1 ? (
        <nav className="mt-10 flex items-center justify-between gap-3 text-sm">
          <Button asChild variant="soft" size="sm" disabled={posts.page <= 1}>
            {posts.page <= 1 ? (
              <span>{t.prev}</span>
            ) : (
              <Link href={`/${locale}/blog?page=${posts.page - 1}`}>{t.prev}</Link>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {formatMessage(t.page, { page: posts.page, total: posts.pageCount })}
          </span>
          <Button asChild variant="soft" size="sm" disabled={posts.page >= posts.pageCount}>
            {posts.page >= posts.pageCount ? (
              <span>{t.next}</span>
            ) : (
              <Link href={`/${locale}/blog?page=${posts.page + 1}`}>{t.next}</Link>
            )}
          </Button>
        </nav>
      ) : null}

      <div className="mt-12">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}`}>
            <ArrowRightIcon className="size-4 rotate-180" aria-hidden />
            {dict.public.nav.home}
          </Link>
        </Button>
      </div>
    </main>
  );
}
