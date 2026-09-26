import type { RequestContext } from "../context/contracts.js";

export type DocumentScopeClass = "TENANT_CORE" | "TENANT_INDUSTRY";
export type DocumentStatus =
  | "UPLOADING"
  | "SCANNING"
  | "ACTIVE"
  | "QUARANTINED"
  | "REJECTED"
  | "DELETED"
  | "PURGED";
export type DocumentVirusScanStatus = "PENDING" | "CLEAN" | "INFECTED" | "ERROR";
export type DocumentSensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface DocumentAccessMetadata {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: DocumentScopeClass;
  readonly sourceModule: string;
  readonly sourceResourceType: string;
  readonly sourceResourceId: string;
  readonly filenameDisplay: string;
  readonly mediaType: string;
  readonly storageObjectId: string;
  readonly ownerPrincipalId?: string;
  readonly sensitivityClass: DocumentSensitivityClass;
  readonly residencyRegion: string;
  readonly status: DocumentStatus;
  readonly virusScanStatus: DocumentVirusScanStatus;
  readonly versionNo: number;
}

export interface DocumentAccessMetadataPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
  }): Promise<DocumentAccessMetadata | null>;
}

export interface DocumentAccessCandidate {
  readonly documentId: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: DocumentScopeClass;
  readonly storageObjectId: string;
  readonly sourceModule: string;
  readonly sourceResourceType: string;
  readonly sourceResourceId: string;
  readonly ownerPrincipalId?: string;
  readonly sensitivityClass: DocumentSensitivityClass;
  readonly residencyRegion: string;
  readonly mediaType: string;
  readonly filenameDisplay: string;
  readonly versionNo: number;
  readonly correlationId: string;
}

export type DocumentAccessCandidateErrorCode =
  | "RESOURCE_NOT_FOUND"
  | "RESOURCE_STATE_INVALID"
  | "DEPENDENCY_UNAVAILABLE";

export class DocumentAccessCandidateError extends Error {
  readonly code: DocumentAccessCandidateErrorCode;
  readonly retryable: boolean;

  constructor(
    code: DocumentAccessCandidateErrorCode,
    messageSafe: string,
    retryable = false,
  ) {
    super(messageSafe);
    this.name = "DocumentAccessCandidateError";
    this.code = code;
    this.retryable = retryable;
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function notFound(): never {
  throw new DocumentAccessCandidateError(
    "RESOURCE_NOT_FOUND",
    "The document is not available in the current context.",
  );
}

function unavailable(): never {
  throw new DocumentAccessCandidateError(
    "DEPENDENCY_UNAVAILABLE",
    "Document metadata is unavailable.",
    true,
  );
}

function stateInvalid(): never {
  throw new DocumentAccessCandidateError(
    "RESOURCE_STATE_INVALID",
    "The document is not available for access.",
  );
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateMetadata(record: DocumentAccessMetadata): void {
  if (!record || typeof record !== "object"
    || !validUuid(record.id)
    || !validUuid(record.tenantId)
    || !validUuid(record.storageObjectId)
    || (record.industryContextId !== undefined && !validUuid(record.industryContextId))
    || (record.ownerPrincipalId !== undefined && !validUuid(record.ownerPrincipalId))
    || (record.scopeClass !== "TENANT_CORE" && record.scopeClass !== "TENANT_INDUSTRY")
    || !validNonEmpty(record.sourceModule)
    || !validNonEmpty(record.sourceResourceType)
    || !validNonEmpty(record.sourceResourceId)
    || !validNonEmpty(record.filenameDisplay)
    || !validNonEmpty(record.mediaType)
    || !validNonEmpty(record.residencyRegion)
    || !["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE_PERSONAL", "REGULATED"]
      .includes(record.sensitivityClass)
    || !["UPLOADING", "SCANNING", "ACTIVE", "QUARANTINED", "REJECTED", "DELETED", "PURGED"]
      .includes(record.status)
    || !["PENDING", "CLEAN", "INFECTED", "ERROR"].includes(record.virusScanStatus)
    || !Number.isSafeInteger(record.versionNo)
    || record.versionNo < 1
    || (record.scopeClass === "TENANT_CORE" && record.industryContextId !== undefined)
    || (record.scopeClass === "TENANT_INDUSTRY" && record.industryContextId === undefined)) {
    unavailable();
  }
}

function validateResolvedTenantContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !validUuid(context.tenantId)
    || !validUuid(context.principalId)
    || !validUuid(context.correlationId)
    || (context.scopeClass === "TENANT_INDUSTRY" && !validUuid(context.industryContextId))) {
    notFound();
  }
}

export class DocumentAccessCandidateService {
  constructor(private readonly metadata: DocumentAccessMetadataPort) {}

  async prepare(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
  }): Promise<DocumentAccessCandidate> {
    validateResolvedTenantContext(input.requestContext);
    if (!validUuid(input.documentId)) notFound();

    let record: DocumentAccessMetadata | null;
    try {
      record = await this.metadata.loadForContext({
        requestContext: input.requestContext,
        documentId: input.documentId,
      });
    } catch {
      unavailable();
    }

    if (!record) notFound();
    validateMetadata(record);

    if (record.id !== input.documentId || record.tenantId !== input.requestContext.tenantId) {
      notFound();
    }

    if (record.scopeClass === "TENANT_INDUSTRY") {
      if (input.requestContext.scopeClass !== "TENANT_INDUSTRY"
        || record.industryContextId !== input.requestContext.industryContextId) {
        notFound();
      }
    }

    if (record.status !== "ACTIVE" || record.virusScanStatus !== "CLEAN") {
      stateInvalid();
    }

    return Object.freeze({
      documentId: record.id,
      tenantId: record.tenantId,
      ...(record.industryContextId ? {industryContextId: record.industryContextId} : {}),
      scopeClass: record.scopeClass,
      storageObjectId: record.storageObjectId,
      sourceModule: record.sourceModule,
      sourceResourceType: record.sourceResourceType,
      sourceResourceId: record.sourceResourceId,
      ...(record.ownerPrincipalId ? {ownerPrincipalId: record.ownerPrincipalId} : {}),
      sensitivityClass: record.sensitivityClass,
      residencyRegion: record.residencyRegion,
      mediaType: record.mediaType,
      filenameDisplay: record.filenameDisplay,
      versionNo: record.versionNo,
      correlationId: input.requestContext.correlationId,
    });
  }
}
