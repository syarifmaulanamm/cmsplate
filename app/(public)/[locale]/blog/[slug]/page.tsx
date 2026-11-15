import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { getPublishedPost } from "@/lib/posts/public";
import { resolveSchema, stringifySchemaForHtml } from "@/lib/seo/schema";
import { formatDate, absoluteUrl } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const post = await getPublishedPost(locale, slug);
  if (!post) return { title: "404" };

  const languages = Object.fromEntries(
    post.alternates.map((alternate) => [
      alternate.locale === "id" ? "id-ID" : "en-US",
      alternate.href,
    ]),
  );

  const ogTitle = post.seo?.ogTitle || post.title;
  const ogDescription = post.seo?.ogDescription || post.excerpt;
  const ogImage = post.seo?.ogImageUrl ?? post.image?.url;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/${locale}/blog/${post.slug}`,
      languages: {
        ...languages,
        "x-default":
          post.alternates.find((alternate) => alternate.locale === "id")?.href ??
          `/${locale}/blog/${post.slug}`,
      },
    },
    openGraph: {
      type: post.seo?.ogType === "website" ? "website" : "article",
      title: ogTitle,
      description: ogDescription,
      publishedTime: post.publishedAt?.toISOString(),
      locale: locale === "id" ? "id_ID" : "en_US",
      images: ogImage ? [{ url: absoluteUrl(ogImage), alt: ogTitle }] : undefined,
    },
    twitter: {
      card: post.seo?.twitterCard === "summary" ? "summary" : "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [absoluteUrl(ogImage)] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);
  const post = await getPublishedPost(locale, slug);
  if (!post) notFound();

  const postUrl = absoluteUrl(`/${locale}/blog/${post.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    inLanguage: locale === "id" ? "id-ID" : "en-US",
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@type": "Organization", name: dict.meta.siteName },
    mainEntityOfPage: postUrl,
    image: post.image ? absoluteUrl(post.image.url) : undefined,
  };

  const customSchema = post.schemaData
    ? stringifySchemaForHtml(
        resolveSchema(post.schemaData, {
          "post.title": post.title,
          "post.slug": post.slug,
          "post.excerpt": post.excerpt,
          "post.url": postUrl,
          "post.image": post.image ? absoluteUrl(post.image.url) : "",
          "post.author": post.authorName,
          "post.publishedAt": post.publishedAt?.toISOString() ?? "",
          "post.locale": locale === "id" ? "id-ID" : "en-US",
          "site.name": dict.meta.siteName,
          "site.url": absoluteUrl("/"),
        }),
      )
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 pt-14 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {customSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: customSchema }} />
      ) : null}

      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {dict.public.blog.back}
        </Link>
      </nav>

      <header className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted" className="text-[10px]">
            <Link href={`/${locale}/kategori/${post.category.slug}`}>{post.category.name}</Link>
          </Badge>
          <span className="text-xs text-muted-foreground">
            {post.publishedAt
              ? formatMessage(dict.public.blog.publishedOn, {
                  date: formatDate(post.publishedAt, locale === "id" ? "id-ID" : "en-US"),
                })
              : ""}
          </span>
          <span className="text-xs text-muted-foreground">
            · {formatMessage(dict.public.blog.minRead, { count: post.readTime })}
          </span>
        </div>

        <h1 className="mt-4 font-serif text-4xl leading-[1.12] tracking-tight text-balance md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          {dict.public.blog.by} {post.authorName}
        </p>
      </header>

      {post.image ? (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
          <Image
            src={post.image.url}
            alt={post.image.alt}
            fill
            unoptimized
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      <article
        className="article-body prose-readable mt-10"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      <footer className="mt-12 border-t border-border pt-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/blog`}>
            <ArrowLeftIcon className="size-4" aria-hidden />
            {dict.public.blog.back}
          </Link>
        </Button>
      </footer>
    </main>
  );
}
