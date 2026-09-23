import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export interface PersistedAIToolSetMember {
  readonly id: string;
  readonly toolSetId: string;
  readonly toolDefinitionId: string;
  readonly enabled: boolean;
  readonly constraint: JsonValue;
  readonly createdAt: string;
}

export interface AIToolSetMemberReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly toolSetMemberId: string;
  }): Promise<PersistedAIToolSetMember | null>;
}
