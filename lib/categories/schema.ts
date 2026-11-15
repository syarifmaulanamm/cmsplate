import { z } from "zod";
import { locales } from "@/lib/i18n/config";

const localeBlock = z.object({
  name: z.string().trim().max(80),
  slug: z.string().trim().max(80),
  description: z.string().trim().max(500),
  metaTitle: z.string().trim().max(60),
  metaDescription: z.string().trim().max(160),
});

export const categoryFormSchema = z
  .object({
    parentId: z.string().nullable(),
    position: z.coerce.number().int().min(0).max(999),
    locales: z.object({ id: localeBlock, en: localeBlock }),
  })
  .superRefine((value, ctx) => {
    const filled = locales.filter((locale) => value.locales[locale].name.trim().length > 0);
    if (filled.length === 0) {
      ctx.addIssue({ code: "custom", message: "AT_LEAST_ONE_LOCALE", path: ["locales"] });
      return;
    }

    for (const locale of filled) {
      const block = value.locales[locale];
      if (block.name.trim().length < 2) {
        ctx.addIssue({ code: "custom", message: "NAME_TOO_SHORT", path: ["locales", locale, "name"] });
      }
    }
  });

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
