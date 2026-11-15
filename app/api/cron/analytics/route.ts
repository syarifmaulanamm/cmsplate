import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { aggregateDaily, pruneOldPageviews } from "@/lib/analytics/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  return Boolean(secret) && secret === env.CRON_SECRET;
}

async function run() {
  const aggregated = await aggregateDaily(3);
  const pruned = await pruneOldPageviews(env.ANALYTICS_RETENTION_DAYS);
  return NextResponse.json({ ok: true, aggregated, pruned: pruned.count });
}

export async function POST(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 401 });
  return run();
}

export async function GET(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 401 });
  return run();
}
