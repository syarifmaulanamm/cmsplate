import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runSeoAudit } from "@/lib/seo/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret =
    request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  return Boolean(secret) && secret === env.CRON_SECRET;
}

async function run() {
  const result = await runSeoAudit();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 401 });
  return run();
}

export async function GET(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 401 });
  return run();
}
