import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type AIAssistantDefinitionOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export interface PersistedAIAssistantDefinition {
  readonly id: string;
  readonly ownerScope: AIAssistantDefinitionOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly allowedCapabilities: readonly string[];
  readonly ragScopeRules: JsonValue;
  readonly promptTemplateId: string;
  readonly toolSetId?: string;
  readonly modelPolicyId?: string;
  readonly retentionPolicyId: string;
  readonly version: number;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIAssistantDefinitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly assistantDefinitionId: string;
  }): Promise<PersistedAIAssistantDefinition | null>;
}
