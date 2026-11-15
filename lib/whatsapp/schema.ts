import { z } from "zod";

export const whatsappScheduleSchema = z.object({
  timezone: z.string().min(1).max(60),
  days: z.array(z.number().int().min(0).max(6)).max(7),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const whatsappSettingsSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(["single", "list"]),
  position: z.enum(["right", "left"]),
  hideWhenOffline: z.boolean(),
});

export type WhatsappSettings = z.infer<typeof whatsappSettingsSchema>;

export const defaultWhatsappSettings: WhatsappSettings = {
  enabled: true,
  mode: "list",
  position: "right",
  hideWhenOffline: true,
};
