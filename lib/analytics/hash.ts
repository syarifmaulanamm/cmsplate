import { createHash } from "node:crypto";

/** Hash pengunjung harian: IP tidak pernah disimpan mentah. */
export function visitorHash(ip: string, userAgent: string, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const salt = process.env.ANALYTICS_SALT ?? "local-salt";
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${day}|${salt}`)
    .digest("hex")
    .slice(0, 32);
}

const BOT_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|headlesschrome|pingdom|uptimerobot|lighthouse|pagespeed|gtmetrix/i;

export function isBot(userAgent: string) {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function deviceFromUserAgent(userAgent: string): "desktop" | "mobile" | "tablet" {
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Normalisasi referrer ke domain agar tabel tidak penuh URL panjang. */
export function normalizeReferrer(referrer: string | null, currentHost: string) {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.host === currentHost) return null;
    return url.host;
  } catch {
    return null;
  }
}
