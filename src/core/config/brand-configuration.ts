import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type BrandConfigurationOwnerScope = "PLATFORM" | "TENANT" | "INDUSTRY";
export type BrandConfigurationStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "ACTIVE"
  | "RETIRED";
export type BrandAccessibilityValidationStatus = "PENDING" | "PASS" | "FAIL";

export interface PersistedBrandConfiguration {
  readonly id: string;
  readonly ownerScope: BrandConfigurationOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly version: number;
  readonly status: BrandConfigurationStatus;
  readonly tokens: JsonValue;
  readonly typography: JsonValue;
  readonly logoDocumentId?: string;
  readonly faviconDocumentId?: string;
  readonly accessibilityValidationStatus: BrandAccessibilityValidationStatus;
  readonly createdBy: string;
  readonly approvedBy?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BrandConfigurationReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly brandConfigurationId: string;
  }): Promise<PersistedBrandConfiguration | null>;
}
