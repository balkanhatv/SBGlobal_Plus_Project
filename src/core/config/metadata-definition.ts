import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type MetadataDefinitionOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export type MetadataDefinitionStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "ACTIVE"
  | "RETIRED";

export interface PersistedMetadataDefinition {
  readonly id: string;
  readonly ownerScope: MetadataDefinitionOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly kind: string;
  readonly version: number;
  readonly status: MetadataDefinitionStatus;
  readonly schema: JsonValue;
  readonly schemaVersion: number;
  readonly createdBy: string;
  readonly approvedBy?: string;
  readonly effectiveFrom?: string;
  readonly effectiveTo?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MetadataDefinitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly metadataDefinitionId: string;
  }): Promise<PersistedMetadataDefinition | null>;
}
