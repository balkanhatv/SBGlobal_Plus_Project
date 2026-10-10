import type { RequestContext } from "../context/contracts.js";
import type {
  AICapabilityCatalogMetadata,
  AICapabilityCatalogMetadataByCodeReadPort,
} from "./capability-catalog-metadata.js";
import {
  matchesAITokenUsageCapabilityBindingFloors,
} from "./token-usage-capability-binding-floors.js";
import type { AITokenUsageReadPort, PersistedAITokenUsage } from "./token-usage.js";

export interface AITokenUsageCapabilityCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly tokenUsageId: string;
}

export interface AITokenUsageCapabilityCurrentEvidence {
  readonly usage: PersistedAITokenUsage;
  readonly capability: AICapabilityCatalogMetadata;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

/**
 * DD-713…DD-717: compose one existing Tenant/Industry-scoped persisted
 * TokenUsage read with the single exact global AICapability(code) metadata read.
 * Only DD-197 direct code-FK binding floors are established.
 *
 * This is read-only relationship evidence: no status/currentness, entitlement,
 * principal authorization, policy, pricing/billing, routing or AI execution
 * authority. The separate reads are not an atomic cross-record snapshot.
 */
export async function loadAITokenUsageCapabilityCurrentEvidence(
  input: AITokenUsageCapabilityCurrentEvidenceReadInput,
  usageReader: AITokenUsageReadPort,
  capabilityReader: AICapabilityCatalogMetadataByCodeReadPort,
): Promise<AITokenUsageCapabilityCurrentEvidence | null> {
  const usage = await usageReader.loadForContext({
    requestContext: input.requestContext,
    tokenUsageId: input.tokenUsageId,
  });
  if (usage === null) return null;
  // Validate DD-197's necessary persisted child identity BEFORE global access.
  // Exactly undefined is an absent Industry; raw capabilityCode is never normalized.
  if (!usage || typeof usage !== "object"
    || !isUuid(usage.id) || !isUuid(usage.tenantId)
    || (usage.industryContextId !== undefined && !isUuid(usage.industryContextId))
    || typeof usage.capabilityCode !== "string") return null;

  const capability = await capabilityReader.loadByCode(usage.capabilityCode);
  if (capability === null) return null;
  if (!matchesAITokenUsageCapabilityBindingFloors(usage, capability)) return null;

  return Object.freeze({ usage, capability });
}
