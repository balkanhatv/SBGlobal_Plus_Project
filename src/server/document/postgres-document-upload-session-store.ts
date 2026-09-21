import type {
  DocumentUploadSession,
  DocumentUploadSessionReadPort,
  DocumentUploadSessionScopeClass,
  DocumentUploadSessionStatus,
} from "../../core/document/upload-session.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface UploadSessionRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly scope_class: string;
  readonly principal_id: string;
  readonly expected_media_types: string[];
  readonly max_size_class: string;
  readonly expires_at: string | Date;
  readonly status: string;
  readonly temp_object_ref: string | null;
  readonly checksum_expected: string | null;
  readonly created_at: string | Date;
}

export class DocumentUploadSessionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentUploadSessionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set<DocumentUploadSessionStatus>([
  "CREATED",
  "UPLOADING",
  "UPLOADED",
  "VALIDATING",
  "SCANNING",
  "ACTIVATED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
]);

function invalid(message: string): never {
  throw new DocumentUploadSessionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted Document upload-session ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted Document upload-session ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted Document upload-session ${field} is invalid.`);
  }
  return date.toISOString();
}

function scope(value: string): DocumentUploadSessionScopeClass {
  if (value !== "TENANT_CORE" && value !== "TENANT_INDUSTRY") {
    invalid("Persisted Document upload-session scope is invalid.");
  }
  return value;
}

function status(value: string): DocumentUploadSessionStatus {
  if (!STATUSES.has(value as DocumentUploadSessionStatus)) {
    invalid("Persisted Document upload-session status is invalid.");
  }
  return value as DocumentUploadSessionStatus;
}

function mediaTypes(values: unknown): readonly string[] {
  if (!Array.isArray(values) || values.length === 0) {
    invalid("Persisted Document upload-session media types are invalid.");
  }
  const parsed = values.map((value) => textValue(value, "media type"));
  return Object.freeze(parsed);
}

function assertContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || !UUID_PATTERN.test(context.tenantId)
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("Document upload-session reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: UploadSessionRow): DocumentUploadSession {
  const parsedScope = scope(row.scope_class);
  const industryContextId = row.industry_context_id === null
    ? undefined
    : uuid(row.industry_context_id, "Industry Context id");

  if ((parsedScope === "TENANT_CORE" && industryContextId)
    || (parsedScope === "TENANT_INDUSTRY" && !industryContextId)) {
    invalid("Persisted Document upload-session ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? {industryContextId} : {}),
    scopeClass: parsedScope,
    principalId: uuid(row.principal_id, "principal id"),
    expectedMediaTypes: mediaTypes(row.expected_media_types),
    maxSizeClass: textValue(row.max_size_class, "max size class"),
    expiresAt: timestamp(row.expires_at, "expiresAt"),
    status: status(row.status),
    ...(row.temp_object_ref !== null
      ? {tempObjectRef: optionalText(row.temp_object_ref, "temporary object reference")}
      : {}),
    ...(row.checksum_expected !== null
      ? {checksumExpected: optionalText(row.checksum_expected, "expected checksum")}
      : {}),
    createdAt: timestamp(row.created_at, "createdAt"),
  });
}

async function readSession(
  transaction: SqlTransaction,
  uploadSessionId: string,
): Promise<DocumentUploadSession | null> {
  const result = await transaction.query<UploadSessionRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            scope_class,
            principal_id,
            expected_media_types,
            max_size_class,
            expires_at,
            status::text,
            temp_object_ref,
            checksum_expected,
            created_at
       FROM core_document.document_upload_session
      WHERE id=$1::uuid`,
    [uploadSessionId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Document upload-session is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresDocumentUploadSessionStore
implements DocumentUploadSessionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly uploadSessionId: string;
  }): Promise<DocumentUploadSession | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.uploadSessionId)) {
      invalid("Document upload-session id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readSession(transaction, input.uploadSessionId),
    );
  }
}
