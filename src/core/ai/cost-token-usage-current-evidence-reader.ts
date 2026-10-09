import type { RequestContext } from "../context/contracts.js";
import { matchesAICostTokenUsageBindingFloors } from "./cost-token-usage-binding-floors.js";
import type { AICostReadPort, PersistedAICost } from "./cost.js";
import type { AITokenUsageReadPort, PersistedAITokenUsage } from "./token-usage.js";

export interface AICostTokenUsageCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly usageId: string;
}

export interface AICostTokenUsageCurrentEvidence {
  readonly cost: PersistedAICost;
  readonly usage: PersistedAITokenUsage;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

/**
 * DD-688…DD-692: reads an exact scoped AICost followed by its persisted
 * TokenUsage under the identical RequestContext; DD-198 direct FK only.
 * No pricing, billing, quota, principal-currentness, provider-selection,
 * authorization or AI-execution authority is inferred from this evidence.
 * Separate read ports do not establish an atomic cross-read snapshot.
 */
export async function loadAICostTokenUsageCurrentEvidence(
  input: AICostTokenUsageCurrentEvidenceReadInput,
  costReader: AICostReadPort,
  usageReader: AITokenUsageReadPort,
): Promise<AICostTokenUsageCurrentEvidence | null> {
  const cost = await costReader.loadForContext({
    requestContext: input.requestContext,
    usageId: input.usageId,
  });
  if (cost === null) return null;
  if (!cost || typeof cost !== "object" || !isUuid(cost.usageId)) return null;

  const usage = await usageReader.loadForContext({
    requestContext: input.requestContext,
    tokenUsageId: cost.usageId,
  });
  if (usage === null) return null;
  if (!matchesAICostTokenUsageBindingFloors(cost, usage)) return null;
  return Object.freeze({ cost, usage });
}
