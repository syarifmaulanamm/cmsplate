import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/lib/db";

export const siteSettingsSchema = z.object({
  siteName: z.string().trim().max(80).default("CMSPlate"),
  tagline: z.string().trim().max(120).default(""),
  description: z.string().trim().max(200).default(""),
  contactEmail: z.string().trim().max(120).default(""),
  timezone: z.string().trim().max(60).default("Asia/Jakarta"),
  postsPerPage: z.number().int().min(3).max(50).default(9),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const defaultSiteSettings: SiteSettings = {
  siteName: "CMSPlate",
  tagline: "",
  description: "",
  contactEmail: "",
  timezone: "Asia/Jakarta",
  postsPerPage: 9,
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const row = await db.setting.findUnique({ where: { key: "site_settings" } });
  const parsed = siteSettingsSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : defaultSiteSettings;
});
