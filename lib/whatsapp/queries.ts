import "server-only";
import { db } from "@/lib/db";
import {
  defaultWhatsappSettings,
  whatsappSettingsSchema,
  type WhatsappSettings,
} from "@/lib/whatsapp/schema";
import {
  isScheduleOnline,
  normalizePhone,
  pickWeighted,
  whatsappLink,
  type WhatsappSchedule,
} from "@/lib/whatsapp/schedule";

export async function getWhatsappSettings(): Promise<WhatsappSettings> {
  const row = await db.setting.findUnique({ where: { key: "whatsapp_settings" } });
  const parsed = whatsappSettingsSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : defaultWhatsappSettings;
}

export async function listWhatsappNumbers() {
  const rows = await db.whatsappNumber.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { avatar: { include: { variants: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    phone: row.phone,
    agentName: row.agentName,
    defaultMessage: row.defaultMessage,
    isActive: row.isActive,
    weight: row.weight,
    position: row.position,
    schedule: row.schedule as WhatsappSchedule | null,
    avatarId: row.avatarMediaId,
    avatarUrl: row.avatar
      ? `/api/media/${row.avatar.variants.find((v) => v.label === "thumb")?.path ?? row.avatar.storageKey}`
      : null,
    online: isScheduleOnline(row.schedule as WhatsappSchedule | null),
  }));
}

export async function getWhatsappNumber(id: string) {
  const row = await db.whatsappNumber.findUnique({
    where: { id },
    include: { avatar: { include: { variants: true } } },
  });
  if (!row) return null;

  return {
    id: row.id,
    label: row.label,
    phone: row.phone,
    agentName: row.agentName,
    defaultMessage: row.defaultMessage,
    isActive: row.isActive,
    weight: row.weight,
    position: row.position,
    schedule: row.schedule as WhatsappSchedule | null,
    online: isScheduleOnline(row.schedule as WhatsappSchedule | null),
    avatarId: row.avatarMediaId,
    avatarUrl: row.avatar
      ? `/api/media/${row.avatar.variants.find((v) => v.label === "thumb")?.path ?? row.avatar.storageKey}`
      : null,
  };
}

export type PublicWhatsappNumber = {
  id: string;
  label: string;
  agentName: string;
  phone: string;
  avatarUrl: string | null;
  href: string;
};

export type PublicWhatsappConfig = {
  settings: WhatsappSettings;
  numbers: PublicWhatsappNumber[];
};

/** Konfigurasi untuk tombol mengambang di halaman publik. */
export async function getPublicWhatsapp(): Promise<PublicWhatsappConfig> {
  const [settings, rows] = await Promise.all([getWhatsappSettings(), listWhatsappNumbers()]);

  const online = rows
    .filter((row) => row.isActive && row.online)
    .map((row) => ({
      id: row.id,
      label: row.label,
      agentName: row.agentName,
      phone: row.phone,
      weight: row.weight,
      avatarUrl: row.avatarUrl,
      href: whatsappLink(row.phone, row.defaultMessage || undefined),
    }));

  if (!settings.enabled || (settings.hideWhenOffline && online.length === 0)) {
    return { settings, numbers: [] };
  }

  if (settings.mode === "single") {
    const chosen = pickWeighted(online);
    return { settings, numbers: chosen ? [chosen] : [] };
  }

  return {
    settings,
    numbers: online.map(({ weight: _weight, ...rest }) => rest),
  };
}

export { normalizePhone };
