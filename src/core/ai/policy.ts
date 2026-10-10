import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type AIPolicyOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export type AIPolicyEffect =
  | "ALLOW"
  | "DENY"
  | "RESTRICT";

export interface PersistedAIPolicy {
  readonly id: string;
  readonly ownerScope: AIPolicyOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly priority: number;
  readonly effect: AIPolicyEffect;
  readonly conditionAst: JsonValue;
  readonly constraint: JsonValue;
  readonly version: number;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIPolicyReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly policyId: string;
  }): Promise<PersistedAIPolicy | null>;
}
