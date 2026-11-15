"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { normalizePhone } from "@/lib/whatsapp/schedule";
import { whatsappScheduleSchema } from "@/lib/whatsapp/schema";
import { adminPath } from "@/lib/admin-path";

export type WhatsappFormState = {
  errorCode?: "VALIDATION" | "PHONE" | "UNKNOWN";
};

function buildSchedule(formData: FormData) {
  if (formData.get("scheduleEnabled") !== "on") return null;

  const days = [0, 1, 2, 3, 4, 5, 6].filter((day) => formData.get(`day_${day}`) === "on");
  const parsed = whatsappScheduleSchema.safeParse({
    timezone: String(formData.get("timezone") ?? "Asia/Jakarta"),
    days,
    start: String(formData.get("start") ?? "09:00"),
    end: String(formData.get("end") ?? "17:00"),
  });

  return parsed.success ? parsed.data : null;
}

export async function saveWhatsappNumber(
  _prev: WhatsappFormState,
  formData: FormData,
): Promise<WhatsappFormState> {
  await requireRole("EDITOR");

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const label = String(formData.get("label") ?? "").trim();
  const agentName = String(formData.get("agentName") ?? "").trim();
  const defaultMessage = String(formData.get("defaultMessage") ?? "").trim();
  const avatarMediaId = String(formData.get("avatarMediaId") ?? "").trim() || null;
  const weight = Math.min(10, Math.max(1, Number(formData.get("weight") ?? 1) || 1));
  const position = Math.min(999, Math.max(0, Number(formData.get("position") ?? 0) || 0));
  const isActive = formData.get("isActive") === "on";
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!label || !agentName) return { errorCode: "VALIDATION" };
  if (!phone) return { errorCode: "PHONE" };

  const schedule = buildSchedule(formData);

  try {
    if (id) {
      await db.whatsappNumber.update({
        where: { id },
        data: {
          label,
          phone,
          agentName,
          defaultMessage,
          avatarMediaId,
          weight,
          position,
          isActive,
          schedule: schedule ?? Prisma.JsonNull,
        },
      });
    } else {
      await db.whatsappNumber.create({
        data: {
          label,
          phone,
          agentName,
          defaultMessage,
          avatarMediaId,
          weight,
          position,
          isActive,
          schedule: schedule ?? undefined,
        },
      });
    }
  } catch (error) {
    console.error("saveWhatsappNumber gagal", error);
    return { errorCode: "UNKNOWN" };
  }

  revalidatePath(adminPath("/whatsapp"));
  revalidatePath("/", "layout");

  redirect(adminPath("/whatsapp"));
}

export async function deleteWhatsappNumber(id: string): Promise<{ ok: boolean }> {
  await requireRole("EDITOR");

  try {
    await db.whatsappNumber.delete({ where: { id } });
    revalidatePath(adminPath("/whatsapp"));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("deleteWhatsappNumber gagal", error);
    return { ok: false };
  }
}

export async function saveWhatsappSettings(
  _prev: { ok?: boolean },
  formData: FormData,
): Promise<{ ok?: boolean }> {
  await requireRole("EDITOR");

  const value = {
    enabled: formData.get("enabled") === "on",
    mode: formData.get("mode") === "single" ? "single" : "list",
    position: formData.get("position") === "left" ? "left" : "right",
    hideWhenOffline: formData.get("hideWhenOffline") === "on",
  };

  await db.setting.upsert({
    where: { key: "whatsapp_settings" },
    update: { value },
    create: { key: "whatsapp_settings", value },
  });

  revalidatePath(adminPath("/whatsapp"));
  revalidatePath("/", "layout");

  return { ok: true };
}
