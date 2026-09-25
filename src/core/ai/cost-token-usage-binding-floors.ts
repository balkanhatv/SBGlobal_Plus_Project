import type { PersistedAICost } from "./cost.js";
import type { PersistedAITokenUsage } from "./token-usage.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0012's AICost ->
 * TokenUsage(id) primary-key/foreign-key relationship.
 *
 * A true result is not pricing, billability, finalization, authorization,
 * current catalog eligibility or AI execution authority.
 */
export function matchesAICostTokenUsageBindingFloors(
  cost: PersistedAICost,
  usage?: PersistedAITokenUsage,
): boolean {
  if (!cost || typeof cost !== "object" || !validUuid(cost.usageId)) {
    return false;
  }
  if (!usage || typeof usage !== "object" || !validUuid(usage.id)) {
    return false;
  }
  return usage.id === cost.usageId;
}
