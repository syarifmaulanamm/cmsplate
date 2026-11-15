import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { publicMediaUrl } from "@/lib/media/storage";

export type AdminMedia = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string;
  createdAt: Date;
  usage: number;
  variants: { label: string; url: string; width: number; height: number }[];
};

type MediaRow = {
  id: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
  createdAt: Date;
  variants: { label: string; path: string; width: number; height: number }[];
  _count: { featuredIn: number; ogImageIn: number; whatsappFor: number };
};

export function toAdminMedia(row: MediaRow): AdminMedia {
  const variants = row.variants.map((variant) => ({
    label: variant.label,
    url: publicMediaUrl(variant.path),
    width: variant.width,
    height: variant.height,
  }));

  return {
    id: row.id,
    filename: row.filename,
    url: publicMediaUrl(row.storageKey),
    mimeType: row.mimeType,
    size: row.size,
    width: row.width,
    height: row.height,
    alt: row.alt ?? "",
    caption: row.caption ?? "",
    createdAt: row.createdAt,
    usage: row._count.featuredIn + row._count.ogImageIn + row._count.whatsappFor,
    variants,
  };
}

export async function listMedia({
  query,
  type,
  page = 1,
  pageSize = 24,
}: {
  query?: string;
  type?: "all" | "image" | "document";
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.MediaWhereInput = {
    ...(query
      ? {
          OR: [
            { filename: { contains: query, mode: "insensitive" } },
            { alt: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(type === "image"
      ? { mimeType: { startsWith: "image/" } }
      : type === "document"
        ? { mimeType: "application/pdf" }
        : {}),
  };

  const safePage = Math.max(1, page);
  const [total, rows] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        variants: true,
        _count: { select: { featuredIn: true, ogImageIn: true, whatsappFor: true } },
      },
    }),
  ]);

  return {
    items: rows.map(toAdminMedia),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMediaById(id: string) {
  const row = await db.media.findUnique({
    where: { id },
    include: {
      variants: true,
      _count: { select: { featuredIn: true, ogImageIn: true, whatsappFor: true } },
    },
  });

  return row ? toAdminMedia(row) : null;
}
