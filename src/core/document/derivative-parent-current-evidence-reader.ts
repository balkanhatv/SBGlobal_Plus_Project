import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentScopeClass,
  DocumentSensitivityClass,
  DocumentStatus,
  DocumentVirusScanStatus,
} from "./access-candidate.js";

export interface DocumentDerivativeCurrentEvidence {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: DocumentScopeClass;
  readonly parentDocumentId: string;
  readonly derivativeType: string;
  readonly sensitivityClass: DocumentSensitivityClass;
  readonly residencyRegion: string;
  readonly status: DocumentStatus;
  readonly virusScanStatus: DocumentVirusScanStatus;
}

export interface DocumentDerivativeParentEvidence {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: DocumentScopeClass;
  readonly sensitivityClass: DocumentSensitivityClass;
  readonly residencyRegion: string;
  readonly status: DocumentStatus;
  readonly virusScanStatus: DocumentVirusScanStatus;
}

export interface DocumentDerivativeParentRelationshipEvidence {
  readonly derivative: DocumentDerivativeCurrentEvidence;
  readonly parent: DocumentDerivativeParentEvidence;
}

export interface DocumentDerivativeParentCurrentEvidenceReadPort {
  load(input: {
    readonly requestContext: RequestContext;
    readonly derivativeDocumentId: string;
    readonly parentDocumentId: string;
  }): Promise<DocumentDerivativeParentRelationshipEvidence | null>;
}

export interface DocumentDerivativeParentCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly derivativeDocumentId: string;
  readonly parentDocumentId: string;
}

export interface DocumentDerivativeParentCurrentEvidence {
  readonly relationship: DocumentDerivativeParentRelationshipEvidence;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVITY = new Set<DocumentSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

const STATUS = new Set<DocumentStatus>([
  "UPLOADING",
  "SCANNING",
  "ACTIVE",
  "QUARANTINED",
  "REJECTED",
  "DELETED",
  "PURGED",
]);

const VIRUS = new Set<DocumentVirusScanStatus>([
  "PENDING",
  "CLEAN",
  "INFECTED",
  "ERROR",
]);

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validScope(value: unknown): value is DocumentScopeClass {
  return value === "TENANT_CORE" || value === "TENANT_INDUSTRY";
}

function validSide(
  value: DocumentDerivativeCurrentEvidence | DocumentDerivativeParentEvidence,
): boolean {
  return validUuid(value.id)
    && validUuid(value.tenantId)
    && validScope(value.scopeClass)
    && (value.industryContextId === undefined || validUuid(value.industryContextId))
    && SENSITIVITY.has(value.sensitivityClass)
    && validText(value.residencyRegion)
    && STATUS.has(value.status)
    && VIRUS.has(value.virusScanStatus)
    && ((value.scopeClass === "TENANT_CORE" && value.industryContextId === undefined)
      || (value.scopeClass === "TENANT_INDUSTRY" && value.industryContextId !== undefined));
}

/**
 * DD-578…DD-582: read one exact persisted derivative -> parent relationship
 * under one already-resolved RequestContext and prove only relationship
 * identity, parent ACTIVE/CLEAN currentness and Tenant/context/residency
 * continuity.
 *
 * Sensitivity values remain raw evidence. No sensitivity ranking, ACL
 * comparison, final authorization, signing, StoragePort execution or
 * derivative mutation authority is created.
 */
export async function loadDocumentDerivativeParentCurrentEvidence(
  input: DocumentDerivativeParentCurrentEvidenceReadInput,
  reader: DocumentDerivativeParentCurrentEvidenceReadPort,
): Promise<DocumentDerivativeParentCurrentEvidence | null> {
  const context = input.requestContext;
  if (
    (context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !validUuid(context.tenantId)
    || !validUuid(input.derivativeDocumentId)
    || !validUuid(input.parentDocumentId)
  ) {
    return null;
  }

  const relationship = await reader.load(input);
  if (relationship === null) return null;

  const derivative = relationship.derivative;
  const parent = relationship.parent;

  if (
    !validSide(derivative)
    || !validSide(parent)
    || !validUuid(derivative.parentDocumentId)
    || !validText(derivative.derivativeType)
    || derivative.id !== input.derivativeDocumentId
    || derivative.parentDocumentId !== input.parentDocumentId
    || parent.id !== input.parentDocumentId
    || derivative.tenantId !== parent.tenantId
    || derivative.tenantId !== context.tenantId
    || derivative.scopeClass !== parent.scopeClass
    || derivative.industryContextId !== parent.industryContextId
    || derivative.residencyRegion !== parent.residencyRegion
    || parent.status !== "ACTIVE"
    || parent.virusScanStatus !== "CLEAN"
  ) {
    return null;
  }

  if (
    derivative.scopeClass === "TENANT_INDUSTRY"
    && (
      context.scopeClass !== "TENANT_INDUSTRY"
      || derivative.industryContextId !== context.industryContextId
    )
  ) {
    return null;
  }

  return Object.freeze({ relationship });
}
