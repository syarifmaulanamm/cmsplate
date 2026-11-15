"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAdminBase } from "@/components/admin-path-context";

/** Mengirim page view sekali per perubahan path, tanpa cookie. */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const adminBase = useAdminBase();

  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith(adminBase) ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login")
    )
      return;

    const body = JSON.stringify({ path: pathname, referrer: document.referrer });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/collect", blob);
      return;
    }

    void fetch("/api/analytics/collect", {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
    });
  }, [pathname, adminBase]);

  return null;
}
