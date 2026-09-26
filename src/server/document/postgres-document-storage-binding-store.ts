import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

export interface DocumentStorageBinding {
  readonly storageObjectId: string;
  readonly dataHomeId: string;
  readonly providerRefEncrypted?: string;
  readonly bucketClass: string;
  readonly objectKey: string;
  readonly objectVersion?: string;
  readonly sizeBytes: string;
  readonly checksumSha256: string;
  readonly encryptionKeyRef: string;
  readonly status: "ACTIVE";
}

interface StorageBindingRow {
  readonly id: string;
  readonly data_home_id: string;
  readonly provider_ref_encrypted: string | null;
  readonly bucket_class: string;
  readonly object_key: string;
  readonly object_version: string | null;
  readonly size_bytes: string | number;
  readonly checksum_sha256: string;
  readonly encryption_key_ref: string;
  readonly status: string;
}

export class DocumentStorageBindingPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentStorageBindingPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new DocumentStorageBindingPersistenceError(message);
}

function parseUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted Document storage ${field} is invalid.`);
  }
  return value;
}

function parseText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted Document storage ${field} is invalid.`);
  }
  return value;
}

function parseOptionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return parseText(value, field);
}

function parseSize(value: string | number): string {
  const text = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(text)) {
    invalid("Persisted Document storage size is invalid.");
  }
  return text;
}

function assertContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || !context.dataHomeId
    || !UUID_PATTERN.test(context.tenantId)
    || !UUID_PATTERN.test(context.principalId)
    || !UUID_PATTERN.test(context.dataHomeId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("Document storage binding requires a resolved single-Tenant Data Home context.");
  }
}

function parseRow(row: StorageBindingRow): DocumentStorageBinding {
  if (row.status !== "ACTIVE") {
    invalid("Persisted Document storage object is not active.");
  }

  return Object.freeze({
    storageObjectId: parseUuid(row.id, "object id"),
    dataHomeId: parseUuid(row.data_home_id, "Data Home id"),
    ...(row.provider_ref_encrypted !== null
      ? {providerRefEncrypted: parseText(row.provider_ref_encrypted, "provider reference")}
      : {}),
    bucketClass: parseText(row.bucket_class, "bucket class"),
    objectKey: parseText(row.object_key, "object key"),
    ...(row.object_version !== null
      ? {objectVersion: parseOptionalText(row.object_version, "object version")}
      : {}),
    sizeBytes: parseSize(row.size_bytes),
    checksumSha256: parseText(row.checksum_sha256, "checksum"),
    encryptionKeyRef: parseText(row.encryption_key_ref, "encryption key reference"),
    status: "ACTIVE" as const,
  });
}

async function loadBinding(
  transaction: SqlTransaction,
  input: {
    readonly documentId: string;
    readonly storageObjectId: string;
    readonly dataHomeId: string;
  },
): Promise<DocumentStorageBinding | null> {
  const result = await transaction.query<StorageBindingRow>(
    `SELECT object.id,
            object.data_home_id,
            object.provider_ref_encrypted,
            object.bucket_class,
            object.object_key,
            object.object_version,
            object.size_bytes,
            object.checksum_sha256,
            object.encryption_key_ref,
            object.status::text
       FROM core_document.document_meta document
       JOIN core_document.storage_object object
         ON object.id=document.storage_object_id
      WHERE document.id=$1::uuid
        AND document.storage_object_id=$2::uuid
        AND object.data_home_id=$3::uuid
        AND document.status='ACTIVE'
        AND document.virus_scan_status='CLEAN'
        AND object.status='ACTIVE'`,
    [input.documentId, input.storageObjectId, input.dataHomeId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Document storage binding is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresDocumentStorageBindingStore {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async load(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
    readonly storageObjectId: string;
  }): Promise<DocumentStorageBinding | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.documentId) || !UUID_PATTERN.test(input.storageObjectId)) {
      invalid("Document storage binding identifiers are invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => loadBinding(transaction, {
        documentId: input.documentId,
        storageObjectId: input.storageObjectId,
        dataHomeId: input.requestContext.dataHomeId!,
      }),
    );
  }
}
