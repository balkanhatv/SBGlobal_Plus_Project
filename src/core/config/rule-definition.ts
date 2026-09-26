import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type RuleDefinitionOwnerScope = "PLATFORM" | "TENANT" | "INDUSTRY";
export type RuleDefinitionStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ACTIVE" | "RETIRED";
export type RuleSafetyClass = "BUSINESS" | "CONFIGURATION" | "VALIDATION";

export interface PersistedRuleDefinition {
  readonly id: string;
  readonly ownerScope: RuleDefinitionOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly version: number;
  readonly status: RuleDefinitionStatus;
  readonly schemaVersion: number;
  readonly inputSchema: JsonValue;
  readonly conditionAst: JsonValue;
  readonly decision: JsonValue;
  readonly priority: number;
  readonly safetyClass: RuleSafetyClass;
  readonly requiredPermission?: string;
  readonly createdBy: string;
  readonly approvedBy?: string;
  readonly effectiveFrom?: string;
  readonly effectiveTo?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RuleDefinitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly ruleDefinitionId: string;
  }): Promise<PersistedRuleDefinition | null>;
}
