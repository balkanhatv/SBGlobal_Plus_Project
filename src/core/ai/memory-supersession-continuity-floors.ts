import type {
  AIMemoryClass,
  PersistedAIMemoryRecord,
} from "./memory-record.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MEMORY_CLASSES = new Set<AIMemoryClass>([
  "SESSION",
  "USER_PREFERENCE",
  "TENANT_KNOWLEDGE",
  "INDUSTRY_KNOWLEDGE",
  "WORKING_CONTEXT",
]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isOptionalUuid(value: unknown): value is string | undefined {
  return value === undefined || isUuid(value);
}

function hasValidContinuityShape(memory: PersistedAIMemoryRecord): boolean {
  return isUuid(memory.id)
    && isUuid(memory.tenantId)
    && isOptionalUuid(memory.industryContextId)
    && isOptionalUuid(memory.principalId)
    && MEMORY_CLASSES.has(memory.memoryClass);
}

/**
 * Re-evaluates only migration-0031's direct AIMemoryRecord supersession
 * continuity predicate: non-self exact parent id plus identical
 * Tenant / optional Industry / optional principal / memory class.
 *
 * A true result is not lifecycle-transition validity, current-memory
 * selection, chain resolution, principal authorization, retention/ACL
 * authority or AI execution authority.
 */
export function matchesAIMemorySupersessionContinuityFloors(
  memory: PersistedAIMemoryRecord,
  supersededMemory?: PersistedAIMemoryRecord,
): boolean {
  if (!hasValidContinuityShape(memory)) return false;

  if (memory.supersedesId === undefined) {
    return supersededMemory === undefined;
  }

  if (
    !isUuid(memory.supersedesId)
    || memory.supersedesId === memory.id
    || supersededMemory === undefined
    || !hasValidContinuityShape(supersededMemory)
    || supersededMemory.id !== memory.supersedesId
  ) {
    return false;
  }

  return supersededMemory.tenantId === memory.tenantId
    && supersededMemory.industryContextId === memory.industryContextId
    && supersededMemory.principalId === memory.principalId
    && supersededMemory.memoryClass === memory.memoryClass;
}
