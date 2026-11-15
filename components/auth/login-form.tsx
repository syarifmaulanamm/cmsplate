"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import type { Dictionary } from "@/lib/i18n";
import { formatMessage } from "@/lib/i18n/format";
import { useActionState } from "react";

const initialState: LoginState = {};

export function LoginForm({ next, dict }: { next?: string; dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const t = dict.auth;

  const errorMessage =
    state.errorCode === "rateLimited"
      ? formatMessage(t.rateLimited, { seconds: state.retryAfterSeconds ?? 60 })
      : state.errorCode === "invalid"
        ? t.invalid
        : null;

  const emailError = state.fieldErrors?.email ? t.emailInvalid : null;
  const passwordError = state.fieldErrors?.password ? t.passwordRequired : null;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="email">{t.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          required
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError ? (
          <p id="email-error" className="text-xs text-destructive">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t.password}</Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={t.passwordPlaceholder}
          required
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "password-error" : undefined}
        />
        {passwordError ? (
          <p id="password-error" className="text-xs text-destructive">
            {passwordError}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            {t.submitting}
          </>
        ) : (
          t.submit
        )}
      </Button>
    </form>
  );
}

export function LoginLocaleToggle({
  label,
  targetLabel,
  localeValue,
}: {
  label: string;
  targetLabel: string;
  localeValue: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    document.cookie = `NEXT_LOCALE=${localeValue}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} disabled={pending} aria-label={targetLabel}>
      {label}
    </Button>
  );
}
