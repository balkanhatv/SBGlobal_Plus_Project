import type { RequestContext } from "../context/contracts.js";
import type {
  AIModelCatalogMetadata,
  AIModelCatalogMetadataReadPort,
} from "./model-catalog-metadata.js";
import { matchesAITokenUsageModelProviderBindingFloors } from "./token-usage-model-provider-binding-floors.js";
import type { AITokenUsageReadPort, PersistedAITokenUsage } from "./token-usage.js";

export interface AITokenUsageModelPairCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly tokenUsageId: string;
}

export interface AITokenUsageModelPairCurrentEvidence {
  readonly usage: PersistedAITokenUsage;
  readonly model: AIModelCatalogMetadata;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

/**
 * DD-703…DD-707: scoped TokenUsage followed by its exact global AIModel,
 * applying only DD-196's persisted model/provider pair relationship.
 * Catalog status and usage attribution remain raw, not current eligibility,
 * routing, billing, principal authorization or AI execution authority.
 * Separate port reads do not establish an atomic cross-record snapshot.
 */
export async function loadAITokenUsageModelPairCurrentEvidence(
  input: AITokenUsageModelPairCurrentEvidenceReadInput,
  usageReader: AITokenUsageReadPort,
  modelReader: AIModelCatalogMetadataReadPort,
): Promise<AITokenUsageModelPairCurrentEvidence | null> {
  const usage = await usageReader.loadForContext({
    requestContext: input.requestContext,
    tokenUsageId: input.tokenUsageId,
  });
  if (usage === null) return null;
  if (!usage || typeof usage !== "object"
    || !isUuid(usage.id) || !isUuid(usage.tenantId)
    || (usage.industryContextId !== undefined && !isUuid(usage.industryContextId))
    || !isUuid(usage.modelId) || !isUuid(usage.providerId)) return null;

  const model = await modelReader.loadById(usage.modelId);
  if (model === null) return null;
  if (!matchesAITokenUsageModelProviderBindingFloors(usage, model)) return null;
  return Object.freeze({ usage, model });
}
