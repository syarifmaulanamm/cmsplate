import { getObject, mimeForExtension } from "@/lib/media/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const key = segments.join("/");

  if (!key || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await getObject(key);
    const extension = key.split(".").pop() ?? "";
    const mimeType = mimeForExtension(extension);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
