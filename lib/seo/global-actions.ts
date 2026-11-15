"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { parseSchemaJson } from "@/lib/seo/schema";
import { adminPath } from "@/lib/admin-path";

export type GlobalSchemaState = { ok?: boolean; errorCode?: "INVALID" | "UNKNOWN" };

export async function saveGlobalSchema(
  _prev: GlobalSchemaState,
  formData: FormData,
): Promise<GlobalSchemaState> {
  await requireRole("EDITOR");

  const raw = String(formData.get("schemaJson") ?? "").trim();
  const parsed = parseSchemaJson(raw);

  if (!parsed.ok) return { errorCode: "INVALID" };

  try {
    if (parsed.data === null) {
      await db.setting.deleteMany({ where: { key: "global_schema" } });
    } else {
      await db.setting.upsert({
        where: { key: "global_schema" },
        update: { value: { json: raw } },
        create: { key: "global_schema", value: { json: raw } },
      });
    }
  } catch (error) {
    console.error("saveGlobalSchema gagal", error);
    return { errorCode: "UNKNOWN" };
  }

  revalidatePath(adminPath("/schema"));
  revalidatePath("/", "layout");

  return { ok: true };
}
