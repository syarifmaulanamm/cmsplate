import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  deviceFromUserAgent,
  isBot,
  normalizeReferrer,
  visitorHash,
} from "@/lib/analytics/hash";

export type CollectInput = {
  path: string;
  referrer?: string | null;
  ip: string;
  userAgent: string;
  country?: string | null;
  host: string;
};

export async function recordPageview(input: CollectInput) {
  if (isBot(input.userAgent)) return { ok: false as const, reason: "BOT" };

  const path = input.path.startsWith("/") ? input.path.slice(0, 300) : "/";
  const adminBase = `/${env.ADMIN_PATH}`;
  if (
    path.startsWith(adminBase) ||
    path.startsWith("/login") ||
    path.startsWith("/admin") ||
    path.startsWith("/api")
  ) {
    return { ok: false as const, reason: "IGNORED" };
  }

  await db.analyticsPageview.create({
    data: {
      path,
      referrer: normalizeReferrer(input.referrer ?? null, input.host),
      deviceType: deviceFromUserAgent(input.userAgent),
      country: input.country?.slice(0, 2).toUpperCase() ?? null,
      visitorHash: visitorHash(input.ip, input.userAgent),
    },
  });

  return { ok: true as const };
}
