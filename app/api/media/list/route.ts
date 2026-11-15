import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listMedia } from "@/lib/media/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? undefined;
  const rawType = url.searchParams.get("type");
  const type = rawType === "image" || rawType === "document" ? rawType : "all";
  const page = Number(url.searchParams.get("page") ?? "1") || 1;

  const result = await listMedia({ query, type, page, pageSize: 24 });

  return NextResponse.json({
    ok: true,
    items: result.items.map((item) => ({
      id: item.id,
      filename: item.filename,
      url: item.variants.find((variant) => variant.label === "thumb")?.url ?? item.url,
      fullUrl: item.url,
      mimeType: item.mimeType,
      alt: item.alt,
      width: item.width,
      height: item.height,
    })),
    page: result.page,
    pageCount: result.pageCount,
    total: result.total,
  });
}
