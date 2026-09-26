export type AIToolDefinitionScopeClass =
  | "PLATFORM_GLOBAL"
  | "TENANT_CORE"
  | "TENANT_INDUSTRY"
  | "EXPLICIT_CROSS_CONTEXT";

export type AIToolSideEffectClass = "NONE" | "LOW" | "CONTROLLED" | "HIGH";

export interface AIToolDefinitionCatalogMetadata {
  readonly id: string;
  readonly toolId: string;
  readonly capabilityCode: string;
  readonly operationContractId: string;
  readonly scopeClass: AIToolDefinitionScopeClass;
  readonly requiredPermission: string;
  readonly requiredEntitlement: string | null;
  readonly inputSchemaVersion: number;
  readonly outputSchemaVersion: number;
  readonly sideEffectClass: AIToolSideEffectClass;
  readonly approvalPolicyId: string | null;
  readonly idempotencyRequired: boolean;
  readonly auditClass: string;
  readonly status: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIToolDefinitionCatalogMetadataReadPort {
  loadById(id: string): Promise<AIToolDefinitionCatalogMetadata | null>;
}
