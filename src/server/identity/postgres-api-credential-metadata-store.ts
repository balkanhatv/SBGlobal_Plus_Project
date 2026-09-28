import type {
  ApiCredentialMetadata,
  ApiCredentialMetadataReadPort,
  ApiCredentialMetadataStatus,
} from "../../core/identity/api-credential-metadata.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface ApiCredentialMetadataRow {
  readonly id: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly principal_id: string;
  readonly key_prefix: string;
  readonly status: string;
  readonly permission_profile_id: string | null;
  readonly expires_at: string | Date | null;
  readonly last_used_at: string | Date | null;
  readonly allowed_cidrs: readonly string[] | null;
  readonly credential_version: string;
  readonly created_at: string | Date;
  readonly revoked_at: string | Date | null;
  readonly allowed_industry_context_ids: readonly string[];
}

export class ApiCredentialMetadataPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiCredentialMetadataPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BIGINT_TEXT_PATTERN = /^-?\d+$/;
const STATUS = new Set<ApiCredentialMetadataStatus>([
  "ACTIVE",
  "SUSPENDED",
  "REVOKED",
  "EXPIRED",
]);

function invalid(message: string): never {
  throw new ApiCredentialMetadataPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted API Credential metadata ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted API Credential metadata ${field} is invalid.`);
  }
  return value;
}

function status(value: unknown): ApiCredentialMetadataStatus {
  if (typeof value !== "string" || !STATUS.has(value as ApiCredentialMetadataStatus)) {
    invalid("Persisted API Credential metadata status is invalid.");
  }
  return value as ApiCredentialMetadataStatus;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted API Credential metadata ${field} is invalid.`);
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

function stringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    invalid(`Persisted API Credential metadata ${field} is invalid.`);
  }
  return Object.freeze([...(value as string[])]);
}

function uuidArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted API Credential metadata ${field} is invalid.`);
  }
  const parsed = value.map((item) => uuid(item, field));
  return Object.freeze(parsed);
}

function bigintText(value: unknown): string {
  if (typeof value !== "string" || !BIGINT_TEXT_PATTERN.test(value)) {
    invalid("Persisted API Credential credential version is invalid.");
  }
  return value;
}

function exactOneOrNull<Row>(
  rows: readonly Row[],
  name: string,
): Row | null {
  if (rows.length === 0) return null;
  if (rows.length !== 1) {
    invalid(`Persisted API Credential metadata ${name} is ambiguous.`);
  }
  return rows[0] ?? null;
}

function parseRow(row: ApiCredentialMetadataRow): ApiCredentialMetadata {
  return Object.freeze({
    id: uuid(row.id, "id"),
    ...(row.tenant_id !== null
      ? {tenantId: optionalUuid(row.tenant_id, "Tenant id")}
      : {}),
    ...(row.industry_context_id !== null
      ? {industryContextId: optionalUuid(row.industry_context_id, "Industry Context id")}
      : {}),
    principalId: uuid(row.principal_id, "principal id"),
    keyPrefix: rawText(row.key_prefix, "key prefix"),
    status: status(row.status),
    ...(row.permission_profile_id !== null
      ? {permissionProfileId: optionalUuid(row.permission_profile_id, "permission profile id")}
      : {}),
    ...(row.expires_at !== null
      ? {expiresAt: optionalTimestamp(row.expires_at, "expiresAt")}
      : {}),
    ...(row.last_used_at !== null
      ? {lastUsedAt: optionalTimestamp(row.last_used_at, "lastUsedAt")}
      : {}),
    ...(row.allowed_cidrs !== null
      ? {allowedCidrs: stringArray(row.allowed_cidrs, "allowed CIDRs")}
      : {}),
    credentialVersion: bigintText(row.credential_version),
    createdAt: timestamp(row.created_at, "createdAt"),
    ...(row.revoked_at !== null
      ? {revokedAt: optionalTimestamp(row.revoked_at, "revokedAt")}
      : {}),
    allowedIndustryContextIds: uuidArray(
      row.allowed_industry_context_ids,
      "allowed Industry Context ids",
    ),
  });
}

async function readById(
  transaction: SqlTransaction,
  apiCredentialId: string,
): Promise<ApiCredentialMetadata | null> {
  const result = await transaction.query<ApiCredentialMetadataRow>(
    `SELECT id::text,
            tenant_id::text,
            industry_context_id::text,
            principal_id::text,
            key_prefix,
            status::text,
            permission_profile_id::text,
            expires_at,
            last_used_at,
            allowed_cidrs::text[] AS allowed_cidrs,
            credential_version::text AS credential_version,
            created_at,
            revoked_at,
            allowed_industry_context_ids::text[] AS allowed_industry_context_ids
       FROM core_identity.api_credential
      WHERE id=$1::uuid`,
    [apiCredentialId],
  );

  const row = exactOneOrNull(result.rows, "exact-id read");
  return row ? parseRow(row) : null;
}

export class PostgresApiCredentialMetadataStore
implements ApiCredentialMetadataReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadById(input: {
    readonly apiCredentialId: string;
  }): Promise<ApiCredentialMetadata | null> {
    if (!UUID_PATTERN.test(input.apiCredentialId)) {
      invalid("API Credential id is invalid.");
    }

    return this.database.transaction(
      (transaction) => readById(transaction, input.apiCredentialId),
    );
  }
}
