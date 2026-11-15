"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { CategoryOption } from "@/lib/categories/queries";
import type { CategoryFormState } from "@/lib/categories/actions";
import { saveCategory } from "@/lib/categories/actions";
import { slugify } from "@/lib/content/slug";
import { localeMeta, locales, type Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminBase } from "@/components/admin-path-context";

export type CategoryFormDefaults = {
  id?: string;
  parentId: string | null;
  position: number;
  locales: Record<
    Locale,
    {
      name: string;
      slug: string;
      description: string;
      metaTitle: string;
      metaDescription: string;
    }
  >;
};

const emptyDefaults: CategoryFormDefaults = {
  parentId: null,
  position: 0,
  locales: {
    id: { name: "", slug: "", description: "", metaTitle: "", metaDescription: "" },
    en: { name: "", slug: "", description: "", metaTitle: "", metaDescription: "" },
  },
};

const initialState: CategoryFormState = {};

export function CategoryForm({
  dict,
  mode,
  defaults = emptyDefaults,
  parents,
}: {
  dict: Dictionary;
  mode: "create" | "edit";
  defaults?: CategoryFormDefaults;
  parents: CategoryOption[];
}) {
  const base = useAdminBase();
  const [state, formAction, pending] = useActionState(saveCategory, initialState);
  const t = dict.admin.categories;
  const v = t.validation;

  const [slugId, setSlugId] = useState(defaults.locales.id.slug);
  const [slugEn, setSlugEn] = useState(defaults.locales.en.slug);
  const [slugIdTouched, setSlugIdTouched] = useState(Boolean(defaults.locales.id.slug));
  const [slugEnTouched, setSlugEnTouched] = useState(Boolean(defaults.locales.en.slug));

  const errorText = (() => {
    switch (state.errorCode) {
      case "AT_LEAST_ONE_LOCALE":
      case "VALIDATION":
        return v.atLeastOneLocale;
      case "NAME_TOO_SHORT":
        return v.nameTooShort;
      case "SLUG_TAKEN":
        return `${v.slugTaken} (${state.errorLocale ? localeMeta[state.errorLocale].short : ""})`;
      case "PARENT_CYCLE":
        return v.parentCycle;
      case "PARENT_DEPTH":
        return v.parentDepth;
      case "UNKNOWN":
        return dict.common.unknownError;
      default:
        return null;
    }
  })();

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

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

        <div className="rounded-xl border border-border bg-card p-6 shadow-elevated-sm">
          <Tabs defaultValue="id">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1">
                <h2 className="text-sm font-semibold">{t.form.sectionContent}</h2>
                <p className="text-xs text-muted-foreground">{t.form.translations}</p>
              </div>
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
                  <Label htmlFor={`name_${locale}`}>
                    {t.form.name}
                    {locale === "id" ? <span className="text-muted-foreground">({dict.common.required})</span> : null}
                  </Label>
                  <Input
                    id={`name_${locale}`}
                    name={`name_${locale}`}
                    defaultValue={defaults.locales[locale].name}
                    placeholder={t.form.namePlaceholder}
                    onChange={(event) => {
                      const isTouched = locale === "id" ? slugIdTouched : slugEnTouched;
                      if (isTouched) return;
                      const next = slugify(event.target.value);
                      if (locale === "id") setSlugId(next);
                      else setSlugEn(next);
                    }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`slug_${locale}`}>{t.form.slug}</Label>
                  <Input
                    id={`slug_${locale}`}
                    name={`slug_${locale}`}
                    value={locale === "id" ? slugId : slugEn}
                    onChange={(event) => {
                      if (locale === "id") {
                        setSlugIdTouched(true);
                        setSlugId(event.target.value);
                      } else {
                        setSlugEnTouched(true);
                        setSlugEn(event.target.value);
                      }
                    }}
                    placeholder={t.form.slugPlaceholder}
                    className="font-mono text-[13px]"
                  />
                  <p className="text-xs text-muted-foreground">{t.form.slugHint}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`description_${locale}`}>
                    {t.form.description}
                    <span className="text-muted-foreground">({dict.common.optional})</span>
                  </Label>
                  <Textarea
                    id={`description_${locale}`}
                    name={`description_${locale}`}
                    defaultValue={defaults.locales[locale].description}
                    placeholder={t.form.descriptionPlaceholder}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`metaTitle_${locale}`}>
                      {t.form.metaTitle}
                      <span className="text-muted-foreground">({dict.common.optional})</span>
                    </Label>
                    <Input
                      id={`metaTitle_${locale}`}
                      name={`metaTitle_${locale}`}
                      defaultValue={defaults.locales[locale].metaTitle}
                      maxLength={60}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`metaDescription_${locale}`}>
                      {t.form.metaDescription}
                      <span className="text-muted-foreground">({dict.common.optional})</span>
                    </Label>
                    <Input
                      id={`metaDescription_${locale}`}
                      name={`metaDescription_${locale}`}
                      defaultValue={defaults.locales[locale].metaDescription}
                      maxLength={160}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t.form.metaHint}</p>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <div className="grid gap-5 rounded-xl border border-border bg-card p-6 shadow-elevated-sm">
          <h2 className="text-sm font-semibold">{t.form.sectionPlacement}</h2>

          <div className="grid gap-2">
            <Label htmlFor="parentId">{t.form.parent}</Label>
            <NativeSelect id="parentId" name="parentId" defaultValue={defaults.parentId ?? ""}>
              <option value="">{t.form.parentNone}</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {`${"— ".repeat(parent.depth)}${parent.name}`}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position">{t.form.position}</Label>
            <Input
              id="position"
              name="position"
              type="number"
              min={0}
              max={999}
              defaultValue={defaults.position}
            />
            <p className="text-xs text-muted-foreground">{t.form.positionHint}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                {t.form.saving}
              </>
            ) : mode === "create" ? (
              t.form.createSubmit
            ) : (
              t.form.save
            )}
          </Button>
          <Button asChild variant="ghost">
            <Link href={`${base}/categories`}>{t.form.cancel}</Link>
          </Button>
        </div>
      </aside>
    </form>
  );
}
