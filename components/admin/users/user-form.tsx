"use client";
import { useActionState } from "react";
import Link from "next/link";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import type { Role } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";
import type { UserFormState } from "@/lib/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminBase } from "@/components/admin-path-context";

export type UserFormDefaults = {
  id?: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
};

const initialState: UserFormState = {};

export function UserForm({
  dict,
  mode,
  action,
  defaults,
}: {
  dict: Dictionary;
  mode: "create" | "edit";
  action: (prev: UserFormState, formData: FormData) => Promise<UserFormState>;
  defaults?: UserFormDefaults;
}) {
  const base = useAdminBase();
  const [state, formAction, pending] = useActionState(action, initialState);
  const t = dict.admin.users;
  const roles: Role[] = ["SUPER_ADMIN", "EDITOR", "AUTHOR"];

  const initial: UserFormDefaults = defaults ?? {
    name: "",
    email: "",
    role: "AUTHOR",
    isActive: true,
  };

  const errorText = (() => {
    switch (state.errorCode) {
      case "EMAIL_TAKEN":
        return t.validation.emailTaken;
      case "PASSWORD_SHORT":
        return t.validation.passwordShort;
      case "SELF_DEMOTE":
        return t.validation.selfDemote;
      case "SELF_DISABLE":
        return t.validation.selfDisable;
      case "LAST_SUPER_ADMIN":
        return t.validation.lastSuperAdmin;
      case "VALIDATION":
        return dict.common.unknownError;
      case "UNKNOWN":
        return dict.common.unknownError;
      default:
        return null;
    }
  })();

  return (
    <form action={formAction} className="grid max-w-xl gap-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {errorText ? (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon className="size-4 shrink-0" aria-hidden />
          {errorText}
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="name">{t.form.name}</Label>
        <Input id="name" name="name" defaultValue={initial.name} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">{t.form.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={initial.email}
          disabled={mode === "edit"}
          readOnly={mode === "edit"}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">
          {t.form.password}
          {mode === "edit" ? (
            <span className="text-muted-foreground">({dict.common.optional})</span>
          ) : null}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required={mode === "create"}
        />
        <p className="text-xs text-muted-foreground">{t.form.passwordHint}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="role">{t.form.role}</Label>
        <NativeSelect id="role" name="role" defaultValue={initial.role}>
          {roles.map((role) => (
            <option key={role} value={role}>
              {t.roles[role]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial.isActive}
          className="size-4 cursor-pointer accent-[var(--primary)]"
        />
        {t.form.active}
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
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
          <Link href={`${base}/users`}>{t.form.cancel}</Link>
        </Button>
      </div>
    </form>
  );
}
