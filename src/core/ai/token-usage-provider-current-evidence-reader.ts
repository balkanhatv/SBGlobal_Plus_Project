import type { RequestContext } from "../context/contracts.js";
import type {
  AIProviderCatalogMetadata,
  AIProviderCatalogMetadataReadPort,
} from "./provider-catalog-metadata.js";
import { matchesAITokenUsageProviderBindingFloors } from "./token-usage-provider-binding-floors.js";
import type { AITokenUsageReadPort, PersistedAITokenUsage } from "./token-usage.js";

export interface AITokenUsageProviderCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly tokenUsageId: string;
}

export interface AITokenUsageProviderCurrentEvidence {
  readonly usage: PersistedAITokenUsage;
  readonly provider: AIProviderCatalogMetadata;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

/**
 * DD-708…DD-712: read one scoped TokenUsage and its exact global AIProvider
 * to re-evaluate only DD-201's persisted direct provider FK continuity.
 * Scope isolation belongs to the existing TokenUsage port/FORCE-RLS.
 * Provider metadata is raw, not eligibility, secret access, billing, routing
 * or AI execution authority. These are not atomic cross-record reads.
 */
export async function loadAITokenUsageProviderCurrentEvidence(
  input: AITokenUsageProviderCurrentEvidenceReadInput,
  usageReader: AITokenUsageReadPort,
  providerReader: AIProviderCatalogMetadataReadPort,
): Promise<AITokenUsageProviderCurrentEvidence | null> {
  const usage = await usageReader.loadForContext({
    requestContext: input.requestContext,
    tokenUsageId: input.tokenUsageId,
  });
  if (usage === null) return null;
  if (!usage || typeof usage !== "object"
    || !isUuid(usage.id) || !isUuid(usage.tenantId)
    || (usage.industryContextId !== undefined && !isUuid(usage.industryContextId))
    || !isUuid(usage.providerId)) return null;

  const provider = await providerReader.loadById(usage.providerId);
  if (provider === null) return null;
  if (!matchesAITokenUsageProviderBindingFloors(usage, provider)) return null;
  return Object.freeze({ usage, provider });
}
