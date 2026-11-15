import { z } from "zod";
import { locales } from "@/lib/i18n/config";

export const postStatuses = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
export type PostStatusValue = (typeof postStatuses)[number];

const localeBlock = z.object({
  title: z.string().trim().max(120),
  slug: z.string().trim().max(80),
  excerpt: z.string().trim().max(300),
  metaTitle: z.string().trim().max(60),
  metaDescription: z.string().trim().max(160),
  focusKeyword: z.string().trim().max(60),
  contentHtml: z.string().max(200_000),
  contentJson: z.string().max(500_000),
  status: z.enum(postStatuses),
  publishedAt: z.string().trim().max(40),
});

export const postFormSchema = z
  .object({
    categoryId: z.string().min(1),
    featuredImageId: z.string().optional(),
    locales: z.object({ id: localeBlock, en: localeBlock }),
  })
  .superRefine((value, ctx) => {
    const filled = locales.filter((locale) => value.locales[locale].title.trim().length > 0);
    if (filled.length === 0) {
      ctx.addIssue({ code: "custom", message: "AT_LEAST_ONE_LOCALE", path: ["locales"] });
    }
  });

export type PostFormInput = z.infer<typeof postFormSchema>;
