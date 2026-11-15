"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { siteSettingsSchema } from "@/lib/settings/queries";
import { adminPath } from "@/lib/admin-path";

export type SettingsState = { ok?: boolean; errorCode?: "VALIDATION" | "UNKNOWN" };

export async function saveSiteSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  await requireRole("SUPER_ADMIN");

  const parsed = siteSettingsSchema.safeParse({
    siteName: String(formData.get("siteName") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    description: String(formData.get("description") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    timezone: String(formData.get("timezone") ?? "Asia/Jakarta"),
    postsPerPage: Number(formData.get("postsPerPage") ?? 9),
  });

  if (!parsed.success) return { errorCode: "VALIDATION" };

  try {
    await db.setting.upsert({
      where: { key: "site_settings" },
      update: { value: parsed.data },
      create: { key: "site_settings", value: parsed.data },
    });
  } catch (error) {
    console.error("saveSiteSettings gagal", error);
    return { errorCode: "UNKNOWN" };
  }

  revalidatePath(adminPath("/settings"));
  revalidatePath("/", "layout");

  return { ok: true };
}
