import type { RequestContext } from "../context/contracts.js";

export type DataExportRequestScopeClass = "TENANT_CORE" | "TENANT_INDUSTRY";
export type DataExportType = "DATA_ACCESS" | "PORTABILITY" | "TENANT_EXPORT" | "ADMIN_EXPORT";
export type DataExportSensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";
export type DataExportRequestStatus =
  | "REQUESTED"
  | "VALIDATING"
  | "APPROVAL_REQUIRED"
  | "APPROVED"
  | "GENERATING"
  | "READY"
  | "DOWNLOADED"
  | "EXPIRED"
  | "REJECTED"
  | "CANCELLED";

export interface PersistedDataExportRequest {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly requesterPrincipalId: string;
  readonly subjectPrincipalId?: string;
  readonly scopeClass: DataExportRequestScopeClass;
  readonly exportType: DataExportType;
  readonly requestedResourceClasses: readonly (string | null)[];
  readonly residencyPolicyVersion: string;
  readonly sensitivityCeiling: DataExportSensitivityClass;
  readonly status: DataExportRequestStatus;
  readonly approvalRef?: string;
  readonly documentId?: string;
  readonly expiresAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DataExportRequestReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly exportRequestId: string;
  }): Promise<PersistedDataExportRequest | null>;
}
