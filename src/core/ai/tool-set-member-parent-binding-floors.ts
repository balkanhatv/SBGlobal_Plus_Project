import type { PersistedAIToolSetMember } from "./tool-set-member.js";
import type { PersistedAIToolSet } from "./tool-set.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's AIToolSetMember ->
 * parent AIToolSet exact foreign-key continuity.
 *
 * A true result is not ToolSet currentness/applicability, authorization,
 * effective membership, ToolDefinition validity or tool execution authority.
 */
export function matchesAIToolSetMemberParentBindingFloors(
  member: PersistedAIToolSetMember,
  toolSet?: PersistedAIToolSet,
): boolean {
  if (
    !member
    || typeof member !== "object"
    || !isUuid(member.id)
    || !isUuid(member.toolSetId)
    || !toolSet
    || typeof toolSet !== "object"
    || !isUuid(toolSet.id)
  ) {
    return false;
  }

  return toolSet.id === member.toolSetId;
}
