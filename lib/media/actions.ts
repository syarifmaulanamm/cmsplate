"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { deleteObject, publicMediaUrl } from "@/lib/media/storage";
import { adminPath } from "@/lib/admin-path";

export type MediaActionResult = {
  ok: boolean;
  code?: "ALT_REQUIRED" | "NOT_FOUND" | "UNKNOWN";
};

export async function updateMediaMetadata(
  _prev: MediaActionResult,
  formData: FormData,
): Promise<MediaActionResult> {
  await requireRole("AUTHOR");

  const id = String(formData.get("id") ?? "");
  const alt = String(formData.get("alt") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  const media = await db.media.findUnique({
    where: { id },
    select: { id: true, mimeType: true },
  });

  if (!media) return { ok: false, code: "NOT_FOUND" };

  if (media.mimeType.startsWith("image/") && alt.length === 0) {
    return { ok: false, code: "ALT_REQUIRED" };
  }

  try {
    await db.media.update({
      where: { id },
      data: { alt: alt || null, caption: caption || null },
    });
    revalidatePath(adminPath("/media"));
    return { ok: true };
  } catch (error) {
    console.error("updateMediaMetadata gagal", error);
    return { ok: false, code: "UNKNOWN" };
  }
}

export type MediaDeleteResult = {
  ok: boolean;
  code?: "NOT_FOUND" | "UNKNOWN";
  usage?: number;
};

export async function deleteMedia(id: string): Promise<MediaDeleteResult> {
  await requireRole("EDITOR");

  const media = await db.media.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!media) return { ok: false, code: "NOT_FOUND" };

  try {
    await db.$transaction(async (tx) => {
      await tx.post.updateMany({
        where: { featuredImageId: id },
        data: { featuredImageId: null },
      });
      await tx.seoMeta.updateMany({
        where: { ogImageId: id },
        data: { ogImageId: null },
      });
      await tx.whatsappNumber.updateMany({
        where: { avatarMediaId: id },
        data: { avatarMediaId: null },
      });
      await tx.media.delete({ where: { id } });
    });

    await deleteObject(media.storageKey);
    for (const variant of media.variants) {
      await deleteObject(variant.path);
    }

    revalidatePath(adminPath("/media"));
    return { ok: true };
  } catch (error) {
    console.error("deleteMedia gagal", error);
    return { ok: false, code: "UNKNOWN" };
  }
}

export async function mediaPublicUrl(storageKey: string) {
  return publicMediaUrl(storageKey);
}
