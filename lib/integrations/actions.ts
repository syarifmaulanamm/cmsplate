"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import {
  INTEGRATION_KEYS,
  integrationPatterns,
  type IntegrationKey,
} from "@/lib/integrations/shared";
import { adminPath } from "@/lib/admin-path";

export type IntegrationState = {
  ok?: boolean;
  errors?: Partial<Record<IntegrationKey | "form", string>>;
};

export async function saveIntegrations(
  _prev: IntegrationState,
  formData: FormData,
): Promise<IntegrationState> {
  await requireRole("SUPER_ADMIN");

  const errors: Partial<Record<IntegrationKey | "form", string>> = {};

  for (const key of INTEGRATION_KEYS) {
    const id = String(formData.get(key) ?? "").trim();
    const enabled = formData.get(`${key}_enabled`) === "on";

    if (id && !integrationPatterns[key].test(id)) {
      errors[key] = "INVALID";
      continue;
    }

    await db.integration.upsert({
      where: { key },
      update: { value: { id }, isEnabled: enabled && Boolean(id) },
      create: { key, value: { id }, isEnabled: enabled && Boolean(id) },
    });
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  revalidatePath(adminPath("/integrations"));
  revalidatePath("/", "layout");

  return { ok: true };
}
