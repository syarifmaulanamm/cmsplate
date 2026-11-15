"use client";

import { useSyncExternalStore } from "react";
import { CookieIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cmsplate:consent";
const EVENT = "cmsplate:consent-change";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function ConsentBanner({ dict }: { dict: Dictionary }) {
  const consent = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(STORAGE_KEY),
    () => "ssr",
  );

  if (consent !== null) return null;

  function decide(value: "granted" | "denied") {
    window.localStorage.setItem(STORAGE_KEY, value);
    window.gtag?.("consent", "update", {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
      analytics_storage: value,
    });
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <div
      role="dialog"
      aria-label={dict.public.consent.title}
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl rounded-xl border border-border bg-card p-4 shadow-elevated-lg md:left-4 md:right-auto md:mx-0"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
          <CookieIcon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{dict.public.consent.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {dict.public.consent.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decide("granted")}>
              {dict.public.consent.accept}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => decide("denied")}>
              {dict.public.consent.reject}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
