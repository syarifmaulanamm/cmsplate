import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { parseSchemaJson } from "@/lib/seo/schema";

/** Schema global (Organization/WebSite/LocalBusiness) untuk semua halaman publik. */
export const getGlobalSchema = cache(async (): Promise<{ data: unknown; raw: string } | null> => {
  const row = await db.setting.findUnique({ where: { key: "global_schema" } });
  if (!row) return null;

  const value = row.value as { json?: string } | null;
  const raw = value?.json ?? "";
  const parsed = parseSchemaJson(raw);
  if (!parsed.ok || parsed.data === null) return null;

  return { data: parsed.data, raw };
});
