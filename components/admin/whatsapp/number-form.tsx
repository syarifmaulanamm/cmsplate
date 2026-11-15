"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { WhatsappFormState } from "@/lib/whatsapp/actions";
import { saveWhatsappNumber } from "@/lib/whatsapp/actions";
import type { WhatsappSchedule } from "@/lib/whatsapp/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";
import { useAdminBase } from "@/components/admin-path-context";

export type WhatsappDefaults = {
  id?: string;
  label: string;
  phone: string;
  agentName: string;
  defaultMessage: string;
  avatarId: string | null;
  avatarUrl: string | null;
  weight: number;
  position: number;
  isActive: boolean;
  schedule: WhatsappSchedule | null;
};

const initialState: WhatsappFormState = {};

const timezones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Singapore", "UTC"];

export function WhatsappNumberForm({
  dict,
  mode,
  defaults,
}: {
  dict: Dictionary;
  mode: "create" | "edit";
  defaults?: WhatsappDefaults;
}) {
  const base = useAdminBase();
  const t = dict.admin.whatsapp.form;
  const [state, action, pending] = useActionState(saveWhatsappNumber, initialState);

  const initial: WhatsappDefaults = defaults ?? {
    label: "",
    phone: "",
    agentName: "",
    defaultMessage: "",
    avatarId: null,
    avatarUrl: null,
    weight: 1,
    position: 0,
    isActive: true,
    schedule: null,
  };

  const [avatar, setAvatar] = useState<{ id: string; url: string } | null>(
    initial.avatarId && initial.avatarUrl ? { id: initial.avatarId, url: initial.avatarUrl } : null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(Boolean(initial.schedule));

  const errorText =
    state.errorCode === "PHONE"
      ? dict.admin.whatsapp.validation.phone
      : state.errorCode === "VALIDATION"
        ? dict.admin.whatsapp.validation.required
        : state.errorCode === "UNKNOWN"
          ? dict.common.unknownError
          : null;

  const schedule = initial.schedule;

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="avatarMediaId" value={avatar?.id ?? ""} />

      <div className="grid gap-6">
        {errorText ? (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircleIcon className="size-4 shrink-0" aria-hidden />
            {errorText}
          </div>
        ) : null}

        <div className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-elevated-sm md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="label">{t.label}</Label>
              <Input id="label" name="label" defaultValue={initial.label} placeholder={t.labelPlaceholder} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agentName">{t.agent}</Label>
              <Input
                id="agentName"
                name="agentName"
                defaultValue={initial.agentName}
                placeholder={t.agentPlaceholder}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">{t.phone}</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initial.phone}
              inputMode="tel"
              placeholder="0812xxxxxxx"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">{t.phoneHint}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="defaultMessage">
              {t.message}
              <span className="text-muted-foreground">({dict.common.optional})</span>
            </Label>
            <Textarea
              id="defaultMessage"
              name="defaultMessage"
              defaultValue={initial.defaultMessage}
              rows={2}
              placeholder={t.messagePlaceholder}
            />
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated-sm md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="grid gap-1">
              <h2 className="text-sm font-semibold">{t.schedule}</h2>
              <p className="text-xs text-muted-foreground">{t.scheduleHint}</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
              <input
                type="checkbox"
                name="scheduleEnabled"
                defaultChecked={scheduleEnabled}
                onChange={(event) => setScheduleEnabled(event.target.checked)}
                className="size-4 cursor-pointer accent-[var(--primary)]"
              />
              {t.schedule}
            </label>
          </div>

          {scheduleEnabled ? (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="timezone">{t.timezone}</Label>
                  <NativeSelect id="timezone" name="timezone" defaultValue={schedule?.timezone ?? "Asia/Jakarta"}>
                    {timezones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="start">{t.start}</Label>
                    <Input id="start" name="start" type="time" defaultValue={schedule?.start ?? "09:00"} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end">{t.end}</Label>
                    <Input id="end" name="end" type="time" defaultValue={schedule?.end ?? "17:00"} />
                  </div>
                </div>
              </div>

              <fieldset className="grid gap-2">
                <legend className="text-[13px] font-medium">{t.days}</legend>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <label
                      key={day}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px]"
                    >
                      <input
                        type="checkbox"
                        name={`day_${day}`}
                        defaultChecked={(schedule?.days ?? [1, 2, 3, 4, 5]).includes(day)}
                        className="size-3.5 cursor-pointer accent-[var(--primary)]"
                      />
                      {dict.admin.whatsapp.days[day as 0 | 1 | 2 | 3 | 4 | 5 | 6]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <div className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-elevated-sm">
          <h2 className="text-sm font-semibold">{t.avatar}</h2>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar.url}
              alt={t.avatar}
              className="size-20 rounded-full border border-border object-cover"
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
              {initial.agentName.slice(0, 1).toUpperCase() || "?"}
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="soft" size="sm" onClick={() => setPickerOpen(true)}>
              {t.chooseImage}
            </Button>
            {avatar ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar(null)}>
                {t.removeImage}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated-sm">
          <div className="grid gap-2">
            <Label htmlFor="weight">{t.weight}</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              min={1}
              max={10}
              defaultValue={initial.weight}
            />
            <p className="text-xs text-muted-foreground">{t.weightHint}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="position">{t.position}</Label>
            <Input
              id="position"
              name="position"
              type="number"
              min={0}
              max={999}
              defaultValue={initial.position}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initial.isActive}
              className="size-4 cursor-pointer accent-[var(--primary)]"
            />
            {t.active}
          </label>
        </div>

        <div className="grid gap-2">
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
            <Link href={`${base}/whatsapp`}>{t.cancel}</Link>
          </Button>
        </div>
      </aside>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        dict={dict}
        accept="image"
        onSelect={(item) => setAvatar({ id: item.id, url: item.fullUrl })}
      />
    </form>
  );
}
