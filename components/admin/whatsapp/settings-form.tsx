"use client";

import { useActionState } from "react";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { WhatsappSettings } from "@/lib/whatsapp/schema";
import { saveWhatsappSettings } from "@/lib/whatsapp/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

export function WhatsappSettingsForm({
  dict,
  settings,
}: {
  dict: Dictionary;
  settings: WhatsappSettings;
}) {
  const [state, action, pending] = useActionState(saveWhatsappSettings, {});
  const t = dict.admin.whatsapp.settings;

  return (
    <form action={action} className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated-sm">
      <div className="grid gap-1">
        <h2 className="text-sm font-semibold">{t.title}</h2>
        <p className="text-xs text-muted-foreground">{t.description}</p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={settings.enabled}
          className="size-4 cursor-pointer accent-[var(--primary)]"
        />
        {t.enabled}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="whatsapp-mode">{t.mode}</Label>
          <NativeSelect id="whatsapp-mode" name="mode" defaultValue={settings.mode}>
            <option value="list">{t.modeList}</option>
            <option value="single">{t.modeSingle}</option>
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="whatsapp-position">{t.position}</Label>
          <NativeSelect id="whatsapp-position" name="position" defaultValue={settings.position}>
            <option value="right">{t.positionRight}</option>
            <option value="left">{t.positionLeft}</option>
          </NativeSelect>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          name="hideWhenOffline"
          defaultChecked={settings.hideWhenOffline}
          className="size-4 cursor-pointer accent-[var(--primary)]"
        />
        {t.hideWhenOffline}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {dict.admin.whatsapp.form.saving}
            </>
          ) : (
            t.save
          )}
        </Button>
        {state.ok ? (
          <span className="flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2Icon className="size-3.5" aria-hidden />
            {t.saved}
          </span>
        ) : null}
      </div>
    </form>
  );
}
