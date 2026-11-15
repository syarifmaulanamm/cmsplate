"use client";

import { useActionState, useState } from "react";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { globalSchemaTemplates } from "@/lib/seo/schema";
import { saveGlobalSchema, type GlobalSchemaState } from "@/lib/seo/global-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: GlobalSchemaState = {};

export function GlobalSchemaForm({
  dict,
  initialJson,
}: {
  dict: Dictionary;
  initialJson: string;
}) {
  const [state, action, pending] = useActionState(saveGlobalSchema, initialState);
  const t = dict.admin.schema;
  const [value, setValue] = useState(initialJson);
  const [localError, setLocalError] = useState<string | null>(null);

  function update(next: string) {
    setValue(next);
    if (!next.trim()) {
      setLocalError(null);
      return;
    }
    try {
      JSON.parse(next);
      setLocalError(null);
    } catch {
      setLocalError(t.invalid);
    }
  }

  const templates: Array<{ key: keyof typeof globalSchemaTemplates; label: string }> = [
    { key: "organization", label: t.templates.organization },
    { key: "website", label: t.templates.website },
    { key: "localBusiness", label: t.templates.localBusiness },
  ];

  return (
    <form action={action} className="grid max-w-3xl gap-4">
      <input type="hidden" name="schemaJson" value={value} />

      <div className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-elevated-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-sm font-semibold">{t.editorTitle}</h2>
            <p className="text-xs text-muted-foreground">{t.editorDescription}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t.template}:</span>
            {templates.map((template) => (
              <Button
                key={template.key}
                type="button"
                variant="soft"
                size="sm"
                onClick={() => update(JSON.stringify(globalSchemaTemplates[template.key], null, 2))}
              >
                {template.label}
              </Button>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => update("")}>
              {t.clear}
            </Button>
          </div>
        </div>

        <Textarea
          value={value}
          onChange={(event) => update(event.target.value)}
          aria-label={t.editorTitle}
          aria-invalid={Boolean(localError) || state.errorCode === "INVALID"}
          rows={10}
          spellCheck={false}
          className="font-mono text-[12px]"
          placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Organization"\n}'}
        />

        {localError || state.errorCode === "INVALID" ? (
          <p className="text-xs text-destructive">{t.invalid}</p>
        ) : null}
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t.variables}</p>
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
      </div>
    </form>
  );
}
