import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  deleteObject,
  hashBuffer,
  putObject,
  storageKeyFor,
} from "@/lib/media/storage";
import { createImageVariants, inspectImage } from "@/lib/media/variants";

export const runtime = "nodejs";

const MAX_FILES = 10;

function looksLikeUnsafeSvg(buffer: Buffer) {
  const text = buffer.toString("utf8").slice(0, 200_000);
  return /<script[\s>]|javascript:|on\w+\s*=/i.test(text);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const limit = rateLimit(`upload:${session.id}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, code: "RATE_LIMITED" }, { status: 429 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ ok: false, code: "NO_FILES" }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ ok: false, code: "TOO_MANY_FILES" }, { status: 400 });
  }

  const uploaded: Array<{ id: string; url: string; filename: string }> = [];
  const errors: Array<{ filename: string; code: string }> = [];

  for (const file of files) {
    const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
    const isDocument = ALLOWED_DOCUMENT_TYPES.has(file.type);

    if (!isImage && !isDocument) {
      errors.push({ filename: file.name, code: "WRONG_TYPE" });
      continue;
    }

    const limitMb = isImage ? env.MAX_IMAGE_MB : env.MAX_DOCUMENT_MB;
    if (file.size > limitMb * 1024 * 1024) {
      errors.push({ filename: file.name, code: "TOO_LARGE" });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "image/svg+xml" && looksLikeUnsafeSvg(buffer)) {
      errors.push({ filename: file.name, code: "UNSAFE_SVG" });
      continue;
    }

    const hash = hashBuffer(buffer);
    const existing = await db.media.findUnique({ where: { hash } });

    if (existing) {
      uploaded.push({
        id: existing.id,
        filename: existing.filename,
        url: `/api/media/${existing.storageKey}`,
      });
      continue;
    }

    const storageKey = storageKeyFor(hash, file.type);
    await putObject(storageKey, buffer);

    let metadata: { width: number | null; height: number | null } | null = null;
    let variants: Awaited<ReturnType<typeof createImageVariants>> = [];

    try {
      metadata = isImage && file.type !== "image/svg+xml" ? await inspectImage(buffer) : null;
      variants = await createImageVariants(buffer, hash, file.type);
    } catch (error) {
      console.error("Gagal memproses gambar", error);
      await deleteObject(storageKey);
      errors.push({ filename: file.name, code: "INVALID_IMAGE" });
      continue;
    }

    const media = await db.media.create({
      data: {
        filename: file.name.slice(0, 200),
        storageKey,
        mimeType: file.type,
        size: file.size,
        width: metadata?.width ?? null,
        height: metadata?.height ?? null,
        hash,
        alt: null,
        uploadedById: session.id,
        variants: {
          create: variants.map((variant) => ({
            label: variant.label,
            path: variant.path,
            width: variant.width,
            height: variant.height,
            format: variant.format,
          })),
        },
      },
    });

    uploaded.push({
      id: media.id,
      filename: media.filename,
      url: `/api/media/${media.storageKey}`,
    });
  }

  return NextResponse.json({ ok: uploaded.length > 0, uploaded, errors });
}
