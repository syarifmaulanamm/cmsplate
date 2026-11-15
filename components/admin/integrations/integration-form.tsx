"use client";

import { useActionState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Integrations } from "@/lib/integrations/queries";
import { INTEGRATION_KEYS, integrationPlaceholders } from "@/lib/integrations/shared";
import { saveIntegrations, type IntegrationState } from "@/lib/integrations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: IntegrationState = {};

export function IntegrationForm({
  dict,
  integrations,
}: {
  dict: Dictionary;
  integrations: Integrations;
}) {
  const [state, action, pending] = useActionState(saveIntegrations, initialState);
  const t = dict.admin.integrations;

  const labels = { gtm: t.gtm, ga4: t.ga4, ads: t.ads };
  const hints = { gtm: t.gtmHint, ga4: t.ga4Hint, ads: t.adsHint };

  return (
    <form action={action} className="grid gap-4">
      {INTEGRATION_KEYS.map((key) => (
        <div
          key={key}
          className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-elevated-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label htmlFor={key} className="text-sm font-semibold">
              {labels[key]}
            </Label>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
              <input
                type="checkbox"
                name={`${key}_enabled`}
                defaultChecked={integrations[key].enabled}
                className="size-4 cursor-pointer accent-[var(--primary)]"
              />
              {t.enabled}
            </label>
          </div>

          <Input
            id={key}
            name={key}
            defaultValue={integrations[key].id}
            placeholder={integrationPlaceholders[key]}
            className="font-mono"
            aria-invalid={Boolean(state.errors?.[key])}
            aria-describedby={`${key}-hint`}
          />

          <p id={`${key}-hint`} className="text-xs text-muted-foreground">
            {hints[key]}
          </p>

          {state.errors?.[key] ? (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircleIcon className="size-3.5" aria-hidden />
              {t.invalid}
            </p>
          ) : null}
        </div>
      ))}

      <p className="text-xs leading-relaxed text-muted-foreground">{t.modeNote}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{t.consentNote}</p>

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
      </div>
    </form>
  );
}
