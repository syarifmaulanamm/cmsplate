import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/auth/rate-limit";
import { recordPageview } from "@/lib/analytics/collect";
import { visitorHash } from "@/lib/analytics/hash";

export const runtime = "nodejs";

type Payload = { path?: string; referrer?: string };

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const limit = rateLimit(`analytics:${visitorHash(ip, userAgent)}`, 60, 60_000);
  if (!limit.ok) {
    return new NextResponse(null, { status: 429 });
  }

  let payload: Payload = {};
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!payload.path) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    await recordPageview({
      path: payload.path,
      referrer: payload.referrer ?? null,
      ip,
      userAgent,
      country:
        request.headers.get("cf-ipcountry") ?? request.headers.get("x-vercel-ip-country"),
      host: new URL(request.url).host,
    });
  } catch (error) {
    console.error("collect analytics gagal", error);
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
