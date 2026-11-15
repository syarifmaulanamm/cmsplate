import "server-only";
import { db } from "@/lib/db";
import {
  INTEGRATION_KEYS,
  integrationPatterns,
  integrationPlaceholders,
  type IntegrationKey,
} from "@/lib/integrations/shared";

export { INTEGRATION_KEYS, integrationPatterns, integrationPlaceholders };
export type { IntegrationKey };

export type IntegrationConfig = { id: string; enabled: boolean };
export type Integrations = Record<IntegrationKey, IntegrationConfig>;

const empty: Integrations = {
  gtm: { id: "", enabled: false },
  ga4: { id: "", enabled: false },
  ads: { id: "", enabled: false },
};

export async function getIntegrations(): Promise<Integrations> {
  const rows = await db.integration.findMany({
    where: { key: { in: [...INTEGRATION_KEYS] } },
  });

  const result: Integrations = { ...empty };

  for (const row of rows) {
    if (!INTEGRATION_KEYS.includes(row.key as IntegrationKey)) continue;
    const key = row.key as IntegrationKey;
    const value = row.value as { id?: string } | null;
    result[key] = { id: value?.id ?? "", enabled: row.isEnabled };
  }

  return result;
}

export function hasActiveIntegrations(integrations: Integrations) {
  return INTEGRATION_KEYS.some((key) => integrations[key].enabled && integrations[key].id);
}
