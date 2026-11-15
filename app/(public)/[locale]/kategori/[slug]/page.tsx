import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { getPublishedCategory, listPublishedPosts } from "@/lib/posts/public";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const category = await getPublishedCategory(locale, slug);
  if (!category) return { title: "404" };

  return {
    title: category.name,
    description: category.description || undefined,
    alternates: {
      canonical: `/${locale}/kategori/${category.slug}`,
      languages: Object.fromEntries(
        category.alternates.map((alternate) => [
          alternate.locale === "id" ? "id-ID" : "en-US",
          alternate.href,
        ]),
      ),
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const category = await getPublishedCategory(locale, slug);
  if (!category) notFound();

  const { page } = await searchParams;
  const currentPage = Number(page ?? "1") || 1;
  const posts = await listPublishedPosts({ locale, categorySlug: slug, page: currentPage, pageSize: 9 });

  return (
    <main className="mx-auto max-w-5xl px-6 pt-14 pb-24">
      <Link
        href={`/${locale}/blog`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {dict.public.category.all}
      </Link>

      <header className="mt-6 max-w-2xl">
        <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          {dict.public.category.label}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        ) : null}
      </header>

      {posts.items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <p className="text-sm font-medium">{dict.public.category.empty}</p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {posts.items.map((post) => (
            <li key={post.slug}>
              <article className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-elevated-sm transition-colors hover:border-primary/30">
                <Badge variant="muted" className="w-fit text-[10px]">
                  {post.categoryName}
                </Badge>
                <h2 className="mt-3 font-serif text-xl leading-snug tracking-tight">
                  <Link href={`/${locale}/blog/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
                  <span>
                    {post.publishedAt
                      ? formatDate(post.publishedAt, locale === "id" ? "id-ID" : "en-US")
                      : ""}
                  </span>
                  <span>· {formatMessage(dict.public.blog.minRead, { count: post.readTime })}</span>
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
              <span>{dict.public.blog.prev}</span>
            ) : (
              <Link href={`/${locale}/kategori/${slug}?page=${posts.page - 1}`}>
                {dict.public.blog.prev}
              </Link>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {formatMessage(dict.public.blog.page, { page: posts.page, total: posts.pageCount })}
          </span>
          <Button asChild variant="soft" size="sm" disabled={posts.page >= posts.pageCount}>
            {posts.page >= posts.pageCount ? (
              <span>{dict.public.blog.next}</span>
            ) : (
              <Link href={`/${locale}/kategori/${slug}?page=${posts.page + 1}`}>
                {dict.public.blog.next}
              </Link>
            )}
          </Button>
        </nav>
      ) : null}
    </main>
  );
}
