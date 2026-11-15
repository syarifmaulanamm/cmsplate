"use client";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircleIcon,
  ImageIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { CategoryOption } from "@/lib/categories/queries";
import type { PostFormState } from "@/lib/posts/actions";
import { autosavePost, savePost } from "@/lib/posts/actions";
import type { PostStatusValue } from "@/lib/posts/schema";
import { slugify } from "@/lib/content/slug";
import { stripHtml } from "@/lib/content/text";
import { scorePost } from "@/lib/seo/score";
import { schemaTemplates, type SchemaTemplateKey } from "@/lib/seo/schema";
import { formatMessage } from "@/lib/i18n/format";
import { localeMeta, locales, type Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";
import { RichTextEditor } from "@/components/admin/posts/rich-text-editor";
import { SeoMeter } from "@/components/admin/posts/seo-meter";
import { useAdminBase } from "@/components/admin-path-context";

export type PostFormDefaults = {
  id?: string;
  categoryId: string;
  featuredImageId: string | null;
  featuredImageUrl: string | null;
  seo: {
    ogTitle: string;
    ogDescription: string;
    ogImageId: string | null;
    ogImageUrl: string | null;
    ogType: "article" | "website";
    twitterCard: "summary" | "summary_large_image";
  };
  schemaJson: string;
  locales: Record<
    Locale,
    {
      title: string;
      slug: string;
      excerpt: string;
      metaTitle: string;
      metaDescription: string;
      focusKeyword: string;
      contentHtml: string;
      status: PostStatusValue;
      publishedAt: string;
    }
  >;
};

const emptyBlock = {
  title: "",
  slug: "",
  excerpt: "",
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",
  contentHtml: "",
  status: "DRAFT" as PostStatusValue,
  publishedAt: "",
};

const statusKey: Record<PostStatusValue, "draft" | "in_review" | "scheduled" | "published" | "archived"> = {
  DRAFT: "draft",
  IN_REVIEW: "in_review",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

function toDateTimeInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const initialState: PostFormState = {};

export function PostForm({
  dict,
  mode,
  defaults,
  categories,
}: {
  dict: Dictionary;
  mode: "create" | "edit";
  defaults?: PostFormDefaults;
  categories: CategoryOption[];
}) {
  const base = useAdminBase();
  const t = dict.admin.posts.form;
  const extra = dict.admin.seo.extra;
  const [state, formAction, pending] = useActionState(savePost, initialState);
  const [auto, setAuto] = useState<{ status: "idle" | "saving" | "saved" | "error"; time?: string }>({
    status: "idle",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const dirtyRef = useRef(false);

  const initial: PostFormDefaults = defaults ?? {
    categoryId: "",
    featuredImageId: null,
    featuredImageUrl: null,
    seo: {
      ogTitle: "",
      ogDescription: "",
      ogImageId: null,
      ogImageUrl: null,
      ogType: "article",
      twitterCard: "summary_large_image",
    },
    schemaJson: "",
    locales: { id: emptyBlock, en: emptyBlock },
  };

  const [featured, setFeatured] = useState<{ id: string; url: string; alt: string } | null>(
    initial.featuredImageId && initial.featuredImageUrl
      ? { id: initial.featuredImageId, url: initial.featuredImageUrl, alt: "" }
      : null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const [ogImage, setOgImage] = useState<{ id: string; url: string } | null>(
    initial.seo.ogImageId && initial.seo.ogImageUrl
      ? { id: initial.seo.ogImageId, url: initial.seo.ogImageUrl }
      : null,
  );
  const [ogPickerOpen, setOgPickerOpen] = useState(false);
  const [ogTitle, setOgTitle] = useState(initial.seo.ogTitle);
  const [ogDescription, setOgDescription] = useState(initial.seo.ogDescription);
  const [schemaJson, setSchemaJson] = useState(initial.schemaJson);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [blocks, setBlocks] = useState(() => {
    const result = {} as Record<
      Locale,
      { title: string; slug: string; excerpt: string; metaTitle: string; metaDescription: string; focusKeyword: string; contentHtml: string; contentText: string }
    >;
    for (const locale of locales) {
      const block = initial.locales[locale];
      result[locale] = {
        title: block.title,
        slug: block.slug,
        excerpt: block.excerpt,
        metaTitle: block.metaTitle,
        metaDescription: block.metaDescription,
        focusKeyword: block.focusKeyword,
        contentHtml: block.contentHtml,
        contentText: stripHtml(block.contentHtml),
      };
    }
    return result;
  });

  const [slugTouched, setSlugTouched] = useState<Record<Locale, boolean>>({
    id: Boolean(initial.locales.id.slug),
    en: Boolean(initial.locales.en.slug),
  });

  function update(locale: Locale, patch: Partial<(typeof blocks)["id"]>) {
    dirtyRef.current = true;
    setBlocks((current) => ({ ...current, [locale]: { ...current[locale], ...patch } }));
  }

  function updateSchema(value: string) {
    setSchemaJson(value);
    if (!value.trim()) {
      setSchemaError(null);
      return;
    }
    try {
      JSON.parse(value);
      setSchemaError(null);
    } catch {
      setSchemaError(extra.invalid);
    }
  }

  useEffect(() => {
    const postId = initial.id;
    if (!postId) return;

    const timer = setInterval(() => {
      if (!dirtyRef.current || !formRef.current) return;
      dirtyRef.current = false;
      setAuto({ status: "saving" });

      const data = new FormData(formRef.current);
      void autosavePost(data).then((result) => {
        if (result.ok && result.savedAt) {
          setAuto({
            status: "saved",
            time: new Date(result.savedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        } else {
          setAuto({ status: "error" });
        }
      });
    }, 20_000);

    return () => clearInterval(timer);
  }, [initial.id]);

  const scores = useMemo(() => {
    const result = {} as Record<Locale, ReturnType<typeof scorePost>>;
    for (const locale of locales) {
      const block = blocks[locale];
      result[locale] = scorePost({
        title: block.title,
        slug: block.slug,
        excerpt: block.excerpt,
        metaTitle: block.metaTitle,
        metaDescription: block.metaDescription,
        focusKeyword: block.focusKeyword,
        contentHtml: block.contentHtml,
        contentText: block.contentText,
      });
    }
    return result;
  }, [blocks]);

  const errorText = (() => {
    switch (state.errorCode) {
      case "AT_LEAST_ONE_LOCALE":
      case "VALIDATION":
        return dict.admin.categories.validation.atLeastOneLocale;
      case "SLUG_TAKEN":
        return `${dict.admin.categories.validation.slugTaken} (${
          state.errorLocale ? localeMeta[state.errorLocale].short : ""
        })`;
      case "INVALID_DATE":
        return dict.admin.posts.form.publishedAtHint;
      case "INVALID_SCHEMA":
        return dict.admin.seo.extra.invalid;
      case "FORBIDDEN":
        return dict.common.unknownError;
      case "UNKNOWN":
        return dict.common.unknownError;
      default:
        return null;
    }
  })();

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={() => {
        dirtyRef.current = true;
      }}
      className="grid gap-6 lg:grid-cols-[1fr_340px]"
    >
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="featuredImageId" value={featured?.id ?? ""} />
      <input type="hidden" name="ogImageId" value={ogImage?.id ?? ""} />
      <input type="hidden" name="schemaJson" value={schemaJson} />

      <div className="grid gap-6">
        {errorText ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>{errorText}</p>
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-card p-5 shadow-elevated-sm md:p-6">
          <Tabs defaultValue="id">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">{t.sectionContent}</h2>
              <TabsList>
                {locales.map((locale) => (
                  <TabsTrigger key={locale} value={locale}>
                    {localeMeta[locale].name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {locales.map((locale) => (
              <TabsContent
                key={locale}
                value={locale}
                forceMount
                className="grid gap-5 data-[state=inactive]:hidden"
              >
                <div className="grid gap-2">
                  <Label htmlFor={`title_${locale}`}>{t.title}</Label>
                  <Input
                    id={`title_${locale}`}
                    name={`title_${locale}`}
                    value={blocks[locale].title}
                    placeholder={t.titlePlaceholder}
                    onChange={(event) => {
                      const title = event.target.value;
                      const patch: Partial<(typeof blocks)["id"]> = { title };
                      if (!slugTouched[locale]) patch.slug = slugify(title);
                      update(locale, patch);
                    }}
                    className="h-11 text-base"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`slug_${locale}`}>{t.slug}</Label>
                  <Input
                    id={`slug_${locale}`}
                    name={`slug_${locale}`}
                    value={blocks[locale].slug}
                    onChange={(event) => {
                      setSlugTouched((current) => ({ ...current, [locale]: true }));
                      update(locale, { slug: event.target.value });
                    }}
                    className="font-mono text-[13px]"
                  />
                  <p className="text-xs text-muted-foreground">{t.slugHint}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`excerpt_${locale}`}>
                    {t.excerpt}
                    <span className="text-muted-foreground">({dict.common.optional})</span>
                  </Label>
                  <Textarea
                    id={`excerpt_${locale}`}
                    name={`excerpt_${locale}`}
                    value={blocks[locale].excerpt}
                    onChange={(event) => update(locale, { excerpt: event.target.value })}
                    placeholder={t.excerptPlaceholder}
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{t.content}</Label>
                  <RichTextEditor
                    locale={locale}
                    initialHtml={blocks[locale].contentHtml}
                    dict={dict}
                    onChange={(html, text) => update(locale, { contentHtml: html, contentText: text })}
                  />
                </div>

                <div className="grid gap-4 rounded-lg border border-border bg-background/40 p-4">
                  <h3 className="text-[13px] font-semibold">{t.sectionSeo}</h3>
                  <div className="grid gap-2">
                    <Label htmlFor={`focusKeyword_${locale}`}>{t.focusKeyword}</Label>
                    <Input
                      id={`focusKeyword_${locale}`}
                      name={`focusKeyword_${locale}`}
                      value={blocks[locale].focusKeyword}
                      onChange={(event) => update(locale, { focusKeyword: event.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`metaTitle_${locale}`}>{t.metaTitle}</Label>
                      <Input
                        id={`metaTitle_${locale}`}
                        name={`metaTitle_${locale}`}
                        value={blocks[locale].metaTitle}
                        onChange={(event) => update(locale, { metaTitle: event.target.value })}
                        maxLength={60}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`metaDescription_${locale}`}>{t.metaDescription}</Label>
                      <Input
                        id={`metaDescription_${locale}`}
                        name={`metaDescription_${locale}`}
                        value={blocks[locale].metaDescription}
                        onChange={(event) => update(locale, { metaDescription: event.target.value })}
                        maxLength={160}
                      />
                    </div>
                  </div>
                  <SeoMeter dict={dict} score={scores[locale].score} checks={scores[locale].checks} />
                </div>

                <div className="grid gap-4 rounded-lg border border-border bg-background/40 p-4 sm:grid-cols-2">
                  <h3 className="text-[13px] font-semibold sm:col-span-2">{t.sectionPublish}</h3>
                  <div className="grid gap-2">
                    <Label htmlFor={`status_${locale}`}>{t.status}</Label>
                    <NativeSelect id={`status_${locale}`} name={`status_${locale}`} defaultValue={initial.locales[locale].status}>
                      {(Object.keys(statusKey) as PostStatusValue[]).map((status) => (
                        <option key={status} value={status}>
                          {dict.admin.status[statusKey[status]]}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`publishedAt_${locale}`}>{t.publishedAt}</Label>
                    <Input
                      id={`publishedAt_${locale}`}
                      name={`publishedAt_${locale}`}
                      type="datetime-local"
                      defaultValue={toDateTimeInput(initial.locales[locale].publishedAt)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2">{t.publishedAtHint}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="grid gap-6 rounded-xl border border-border bg-card p-5 shadow-elevated-sm md:p-6">
          <div className="grid gap-1">
            <h2 className="text-sm font-semibold">{extra.title}</h2>
            <p className="text-xs text-muted-foreground">{extra.description}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ogTitle">{extra.ogTitle}</Label>
                <Input
                  id="ogTitle"
                  name="ogTitle"
                  value={ogTitle}
                  maxLength={70}
                  onChange={(event) => {
                    dirtyRef.current = true;
                    setOgTitle(event.target.value);
                  }}
                  placeholder={blocks.id.title || blocks.en.title}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ogDescription">{extra.ogDescription}</Label>
                <Textarea
                  id="ogDescription"
                  name="ogDescription"
                  value={ogDescription}
                  maxLength={200}
                  rows={2}
                  onChange={(event) => {
                    dirtyRef.current = true;
                    setOgDescription(event.target.value);
                  }}
                  placeholder={blocks.id.excerpt || blocks.en.excerpt}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="ogType">{extra.ogType}</Label>
                  <NativeSelect id="ogType" name="ogType" defaultValue={initial.seo.ogType}>
                    <option value="article">{extra.ogTypeArticle}</option>
                    <option value="website">{extra.ogTypeWebsite}</option>
                  </NativeSelect>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="twitterCard">{extra.twitterCard}</Label>
                  <NativeSelect
                    id="twitterCard"
                    name="twitterCard"
                    defaultValue={initial.seo.twitterCard}
                  >
                    <option value="summary_large_image">{extra.twitterLarge}</option>
                    <option value="summary">{extra.twitterSummary}</option>
                  </NativeSelect>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>{extra.ogImage}</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {ogImage ? (
                    <span className="relative block h-16 w-28 overflow-hidden rounded-md border border-border">
                      <Image
                        src={ogImage.url}
                        alt={extra.ogImage}
                        fill
                        unoptimized
                        sizes="112px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span className="grid h-16 w-28 place-items-center rounded-md border border-dashed border-border text-muted-foreground">
                      <ImageIcon className="size-4" aria-hidden />
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="soft"
                      size="sm"
                      onClick={() => setOgPickerOpen(true)}
                    >
                      {extra.chooseImage}
                    </Button>
                    {ogImage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          dirtyRef.current = true;
                          setOgImage(null);
                        }}
                      >
                        {extra.removeImage}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{extra.ogImageHint}</p>
              </div>
            </div>

            <div className="grid content-start gap-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase">
                {extra.preview}
              </p>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {ogImage?.url ?? featured?.url ? (
                  <div className="relative aspect-[1.91/1] bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ogImage?.url ?? featured?.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="grid gap-1 p-3">
                  <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                    {extra.previewHost}
                  </p>
                  <p className="line-clamp-2 text-sm font-medium">
                    {ogTitle || blocks.id.title || blocks.en.title || "—"}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {ogDescription || blocks.id.excerpt || blocks.en.excerpt || ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-border pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1">
                <h3 className="text-[13px] font-semibold">{extra.schemaTitle}</h3>
                <p className="text-xs text-muted-foreground">{extra.schemaDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{extra.template}:</span>
                {(["article", "faq", "breadcrumb"] as SchemaTemplateKey[]).map((key) => (
                  <Button
                    key={key}
                    type="button"
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      updateSchema(JSON.stringify(schemaTemplates[key], null, 2));
                      dirtyRef.current = true;
                    }}
                  >
                    {
                      {
                        article: extra.templateArticle,
                        faq: extra.templateFaq,
                        breadcrumb: extra.templateBreadcrumb,
                      }[key]
                    }
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateSchema("");
                    dirtyRef.current = true;
                  }}
                >
                  {extra.clear}
                </Button>
              </div>
            </div>

            <Textarea
              value={schemaJson}
              onChange={(event) => {
                dirtyRef.current = true;
                updateSchema(event.target.value);
              }}
              aria-label={extra.schemaTitle}
              aria-invalid={Boolean(schemaError)}
              rows={8}
              spellCheck={false}
              className="font-mono text-[12px]"
              placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "FAQPage"\n}'}
            />
            {schemaError ? <p className="text-xs text-destructive">{schemaError}</p> : null}
            <p className="text-[11px] leading-relaxed text-muted-foreground">{extra.variables}</p>
          </div>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated-sm">
          <h2 className="text-sm font-semibold">{t.category}</h2>
          <NativeSelect name="categoryId" defaultValue={initial.categoryId} aria-label={t.category}>
            <option value="">{dict.admin.categories.allParents}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {`${"— ".repeat(category.depth)}${category.name}`}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-elevated-sm">
          <h2 className="text-sm font-semibold">{t.featuredImage}</h2>
          {featured ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="relative aspect-video bg-muted">
                <Image
                  src={featured.url}
                  alt={featured.alt || t.featuredImage}
                  fill
                  unoptimized
                  sizes="320px"
                  className="object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="grid place-items-center rounded-lg border border-dashed border-border bg-background/50 py-8 text-muted-foreground">
              <ImageIcon className="size-5" aria-hidden />
              <p className="mt-2 text-xs">{t.noImage}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="soft" size="sm" onClick={() => setPickerOpen(true)}>
              {featured ? <PlusIcon className="size-3.5" /> : null}
              {featured ? t.changeImage : t.chooseImage}
            </Button>
            {featured ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFeatured(null)}
              >
                <Trash2Icon className="size-3.5" />
                {t.removeImage}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated-sm">
          <h2 className="text-sm font-semibold">{dict.admin.seo.score}</h2>
          {locales.map((locale) => (
            <div key={locale} className="grid gap-2">
              <p className="text-xs font-medium text-muted-foreground">{localeMeta[locale].name}</p>
              <SeoMeter
                dict={dict}
                score={scores[locale].score}
                checks={scores[locale].checks}
                compact
              />
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">{dict.admin.seo.hint}</p>
        </div>

        <div className="grid gap-2">
          <p aria-live="polite" className="min-h-4 text-[11px] text-muted-foreground">
            {auto.status === "saving"
              ? t.autosaving
              : auto.status === "saved" && auto.time
                ? formatMessage(t.savedAt, { time: auto.time })
                : auto.status === "error"
                  ? t.autoSaveError
                  : ""}
          </p>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                {t.saving}
              </>
            ) : mode === "create" ? (
              t.createSubmit
            ) : (
              t.save
            )}
          </Button>
          <Button asChild variant="ghost">
            <Link href={`${base}/posts`}>{t.cancel}</Link>
          </Button>
        </div>
      </aside>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        dict={dict}
        accept="image"
        onSelect={(item) => {
          dirtyRef.current = true;
          setFeatured({ id: item.id, url: item.fullUrl, alt: item.alt });
        }}
      />

      <MediaPickerDialog
        open={ogPickerOpen}
        onOpenChange={setOgPickerOpen}
        dict={dict}
        accept="image"
        onSelect={(item) => {
          dirtyRef.current = true;
          setOgImage({ id: item.id, url: item.fullUrl });
        }}
      />
    </form>
  );
}
