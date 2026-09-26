import type { PersistedAIIndustryConfig } from "./industry-config.js";
import type { PersistedAIPromptSet } from "./prompt-set.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function hasValidPromptSetOwnerShape(promptSet: PersistedAIPromptSet): boolean {
  if (promptSet.ownerScope === "PLATFORM") {
    return promptSet.tenantId === undefined
      && promptSet.industryContextId === undefined;
  }

  if (promptSet.ownerScope === "TENANT") {
    return isUuid(promptSet.tenantId)
      && promptSet.industryContextId === undefined;
  }

  if (promptSet.ownerScope === "INDUSTRY") {
    return isUuid(promptSet.tenantId)
      && isUuid(promptSet.industryContextId);
  }

  return false;
}

/**
 * Re-evaluates only migration-0031's IndustryAIConfig -> optional
 * domain PromptSet exact-id / ACTIVE / scope-applicability relationship.
 *
 * A true result is not effective Tenant+Industry configuration, PromptSet
 * membership/rendering, prompt selection or AI execution authority.
 */
export function matchesAIIndustryConfigDomainPromptSetBindingFloors(
  config: PersistedAIIndustryConfig,
  promptSet?: PersistedAIPromptSet,
): boolean {
  if (
    !config
    || typeof config !== "object"
    || !isUuid(config.id)
    || !isUuid(config.tenantId)
    || !isUuid(config.industryContextId)
  ) {
    return false;
  }

  if (config.domainPromptSetId === undefined) {
    return promptSet === undefined;
  }

  if (
    !isUuid(config.domainPromptSetId)
    || promptSet === undefined
    || !promptSet
    || typeof promptSet !== "object"
    || !isUuid(promptSet.id)
    || !hasValidPromptSetOwnerShape(promptSet)
    || promptSet.id !== config.domainPromptSetId
    || promptSet.status !== "ACTIVE"
  ) {
    return false;
  }

  if (promptSet.ownerScope === "PLATFORM") return true;

  if (promptSet.ownerScope === "TENANT") {
    return promptSet.tenantId === config.tenantId;
  }

  return promptSet.ownerScope === "INDUSTRY"
    && promptSet.tenantId === config.tenantId
    && promptSet.industryContextId === config.industryContextId;
}
