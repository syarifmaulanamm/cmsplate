"use client";

import { useActionState } from "react";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/settings/queries";
import { saveSiteSettings } from "@/lib/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";

const timezones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Singapore", "UTC"];

export function SettingsForm({ dict, settings }: { dict: Dictionary; settings: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSiteSettings, {});
  const t = dict.admin.settings;

  return (
    <form action={action} className="grid max-w-2xl gap-6">
      <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated-sm">
        <h2 className="text-sm font-semibold">{t.identity}</h2>

        <div className="grid gap-2">
          <Label htmlFor="siteName">{t.fields.siteName}</Label>
          <Input id="siteName" name="siteName" defaultValue={settings.siteName} required />
          <p className="text-xs text-muted-foreground">{t.hints.siteName}</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tagline">
            {t.fields.tagline}
            <span className="text-muted-foreground">({dict.common.optional})</span>
          </Label>
          <Input id="tagline" name="tagline" defaultValue={settings.tagline} maxLength={120} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contactEmail">
            {t.fields.contactEmail}
            <span className="text-muted-foreground">({dict.common.optional})</span>
          </Label>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={settings.contactEmail} />
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated-sm">
        <h2 className="text-sm font-semibold">{t.seo}</h2>

        <div className="grid gap-2">
          <Label htmlFor="description">{t.fields.description}</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={settings.description}
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">{t.hints.description}</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated-sm sm:grid-cols-2">
        <h2 className="text-sm font-semibold sm:col-span-2">{t.delivery}</h2>

        <div className="grid gap-2">
          <Label htmlFor="timezone">{t.fields.timezone}</Label>
          <NativeSelect id="timezone" name="timezone" defaultValue={settings.timezone}>
            {timezones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="postsPerPage">{t.fields.postsPerPage}</Label>
          <Input
            id="postsPerPage"
            name="postsPerPage"
            type="number"
            min={3}
            max={50}
            defaultValue={settings.postsPerPage}
          />
          <p className="text-xs text-muted-foreground">{t.hints.postsPerPage}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {t.saving}
            </>
          ) : (
            t.save
          )}
        </Button>
        {state.ok ? (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2Icon className="size-4" aria-hidden />
            {t.saved}
          </span>
        ) : null}
        {state.errorCode ? <span className="text-sm text-destructive">{t.validation}</span> : null}
      </div>
    </form>
  );
}
