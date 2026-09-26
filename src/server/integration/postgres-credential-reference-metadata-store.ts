import type {
  CredentialReferenceMetadata,
  CredentialReferenceMetadataReadPort,
} from "../../core/integration/credential-reference-metadata.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface CredentialReferenceMetadataRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly secret_store_provider: string;
  readonly credential_type: string;
  readonly key_version: string | number;
  readonly status: string;
  readonly rotated_at: string | Date | null;
  readonly expires_at: string | Date | null;
  readonly created_at: string | Date;
}

export class CredentialReferenceMetadataPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CredentialReferenceMetadataPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new CredentialReferenceMetadataPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted CredentialReference metadata ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted CredentialReference metadata ${field} is invalid.`);
  }
  return value;
}

function version(value: string | number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid("Persisted CredentialReference key version is invalid.");
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted CredentialReference metadata ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(
  value: string | Date | null,
  field: string,
): string | undefined {
  if (value === null) return undefined;
  return timestamp(value, field);
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
    invalid("CredentialReference metadata reads require a resolved single-Tenant context.");
  }
}

function parseRow(
  row: CredentialReferenceMetadataRow,
): CredentialReferenceMetadata {
  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(row.industry_context_id !== null
      ? {industryContextId: optionalUuid(row.industry_context_id, "Industry Context id")}
      : {}),
    secretStoreProvider: textValue(row.secret_store_provider, "secret-store provider"),
    credentialType: textValue(row.credential_type, "credential type"),
    keyVersion: version(row.key_version),
    status: textValue(row.status, "status"),
    ...(row.rotated_at !== null
      ? {rotatedAt: optionalTimestamp(row.rotated_at, "rotatedAt")}
      : {}),
    ...(row.expires_at !== null
      ? {expiresAt: optionalTimestamp(row.expires_at, "expiresAt")}
      : {}),
    createdAt: timestamp(row.created_at, "createdAt"),
  });
}

async function readMetadata(
  transaction: SqlTransaction,
  credentialReferenceId: string,
): Promise<CredentialReferenceMetadata | null> {
  const result = await transaction.query<CredentialReferenceMetadataRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            secret_store_provider,
            credential_type,
            key_version,
            status,
            rotated_at,
            expires_at,
            created_at
       FROM core_integration.credential_reference
      WHERE id=$1::uuid`,
    [credentialReferenceId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted CredentialReference metadata is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresCredentialReferenceMetadataStore
implements CredentialReferenceMetadataReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly credentialReferenceId: string;
  }): Promise<CredentialReferenceMetadata | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.credentialReferenceId)) {
      invalid("CredentialReference id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readMetadata(transaction, input.credentialReferenceId),
    );
  }
}
