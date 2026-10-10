import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type FormDefinitionOwnerScope = "PLATFORM" | "TENANT" | "INDUSTRY";
export type FormDefinitionStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ACTIVE" | "RETIRED";

export interface PersistedFormDefinition {
  readonly id: string;
  readonly ownerScope: FormDefinitionOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly version: number;
  readonly status: FormDefinitionStatus;
  readonly schemaVersion: number;
  readonly purposeCode: string;
  readonly submitOperationId?: string;
  readonly layoutSchema: JsonValue;
  readonly validationRuleRefs: readonly (string | null)[];
  readonly localizationKeyPrefix?: string;
  readonly allowedSurfaceClasses: readonly (string | null)[];
  readonly createdBy: string;
  readonly approvedBy?: string;
  readonly effectiveFrom?: string;
  readonly effectiveTo?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface FormDefinitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly formDefinitionId: string;
  }): Promise<PersistedFormDefinition | null>;
}
