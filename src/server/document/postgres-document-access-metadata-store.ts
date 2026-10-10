import type {
  DocumentAccessMetadata,
  DocumentAccessMetadataPort,
  DocumentScopeClass,
  DocumentSensitivityClass,
  DocumentStatus,
  DocumentVirusScanStatus,
} from "../../core/document/access-candidate.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface DocumentMetadataRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly scope_class: string;
  readonly source_module: string;
  readonly source_resource_type: string;
  readonly source_resource_id: string;
  readonly filename_display: string;
  readonly media_type: string;
  readonly storage_object_id: string;
  readonly owner_principal_id: string | null;
  readonly sensitivity_class: string;
  readonly residency_region: string;
  readonly status: string;
  readonly virus_scan_status: string;
  readonly version_no: string | number;
}

export class DocumentMetadataPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentMetadataPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DOCUMENT_STATUSES = new Set<DocumentStatus>([
  "UPLOADING",
  "SCANNING",
  "ACTIVE",
  "QUARANTINED",
  "REJECTED",
  "DELETED",
  "PURGED",
]);
const VIRUS_STATUSES = new Set<DocumentVirusScanStatus>([
  "PENDING",
  "CLEAN",
  "INFECTED",
  "ERROR",
]);
const SENSITIVITY_CLASSES = new Set<DocumentSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new DocumentMetadataPersistenceError(message);
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted Document ${field} is invalid.`);
  }
  return value;
}

function uuid(value: unknown, field: string): string {
  const parsed = requiredText(value, field);
  if (!UUID_PATTERN.test(parsed)) {
    invalid(`Persisted Document ${field} is invalid.`);
  }
  return parsed;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function version(value: string | number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid("Persisted Document version is invalid.");
  }
  return parsed;
}

function scopeClass(value: string): DocumentScopeClass {
  if (value !== "TENANT_CORE" && value !== "TENANT_INDUSTRY") {
    invalid("Persisted Document scope class is invalid.");
  }
  return value;
}

function status(value: string): DocumentStatus {
  if (!DOCUMENT_STATUSES.has(value as DocumentStatus)) {
    invalid("Persisted Document status is invalid.");
  }
  return value as DocumentStatus;
}

function virusStatus(value: string): DocumentVirusScanStatus {
  if (!VIRUS_STATUSES.has(value as DocumentVirusScanStatus)) {
    invalid("Persisted Document virus-scan status is invalid.");
  }
  return value as DocumentVirusScanStatus;
}

function sensitivity(value: string): DocumentSensitivityClass {
  if (!SENSITIVITY_CLASSES.has(value as DocumentSensitivityClass)) {
    invalid("Persisted Document sensitivity is invalid.");
  }
  return value as DocumentSensitivityClass;
}

function assertTenantContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY" && !context.industryContextId)) {
    invalid("Document metadata PostgreSQL reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: DocumentMetadataRow): DocumentAccessMetadata {
  const parsedScope = scopeClass(row.scope_class);
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context");

  if ((parsedScope === "TENANT_CORE" && industryContextId)
    || (parsedScope === "TENANT_INDUSTRY" && !industryContextId)) {
    invalid("Persisted Document ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? {industryContextId} : {}),
    scopeClass: parsedScope,
    sourceModule: requiredText(row.source_module, "source module"),
    sourceResourceType: requiredText(row.source_resource_type, "source resource type"),
    sourceResourceId: requiredText(row.source_resource_id, "source resource id"),
    filenameDisplay: requiredText(row.filename_display, "display filename"),
    mediaType: requiredText(row.media_type, "media type"),
    storageObjectId: uuid(row.storage_object_id, "storage object id"),
    ...(row.owner_principal_id
      ? {ownerPrincipalId: uuid(row.owner_principal_id, "owner principal id")}
      : {}),
    sensitivityClass: sensitivity(row.sensitivity_class),
    residencyRegion: requiredText(row.residency_region, "residency region"),
    status: status(row.status),
    virusScanStatus: virusStatus(row.virus_scan_status),
    versionNo: version(row.version_no),
  });
}

async function readDocument(
  transaction: SqlTransaction,
  documentId: string,
): Promise<DocumentAccessMetadata | null> {
  const result = await transaction.query<DocumentMetadataRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            scope_class,
            source_module,
            source_resource_type,
            source_resource_id,
            filename_display,
            media_type,
            storage_object_id,
            owner_principal_id,
            sensitivity_class,
            residency_region,
            status::text,
            virus_scan_status::text,
            version_no
       FROM core_document.document_meta
      WHERE id=$1::uuid`,
    [documentId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Document metadata is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresDocumentAccessMetadataStore implements DocumentAccessMetadataPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
  }): Promise<DocumentAccessMetadata | null> {
    assertTenantContext(input.requestContext);
    if (!UUID_PATTERN.test(input.documentId)) {
      invalid("Document metadata id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readDocument(transaction, input.documentId),
    );
  }
}
