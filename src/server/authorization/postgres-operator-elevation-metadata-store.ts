import type {
  OperatorElevationMetadata,
  OperatorElevationMetadataReadPort,
  OperatorElevationStatus,
} from "../../core/authorization/operator-elevation-metadata.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface OperatorElevationMetadataRow {
  readonly id: string;
  readonly operator_principal_id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly purpose_code: string;
  readonly ticket_reference: string | null;
  readonly approved_by: string | null;
  readonly starts_at: string | Date;
  readonly expires_at: string | Date;
  readonly status: string;
  readonly permission_profile_id: string;
  readonly created_at: string | Date;
  readonly revoked_at: string | Date | null;
}

export class OperatorElevationMetadataPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperatorElevationMetadataPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUS = new Set<OperatorElevationStatus>([
  "PENDING",
  "ACTIVE",
  "REVOKED",
  "EXPIRED",
]);

function invalid(message: string): never {
  throw new OperatorElevationMetadataPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted OperatorElevation metadata ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted OperatorElevation metadata ${field} is invalid.`);
  }
  return value;
}

function optionalRawText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return rawText(value, field);
}

function status(value: unknown): OperatorElevationStatus {
  if (typeof value !== "string" || !STATUS.has(value as OperatorElevationStatus)) {
    invalid("Persisted OperatorElevation metadata status is invalid.");
  }
  return value as OperatorElevationStatus;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted OperatorElevation metadata ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: string | Date | null, field: string): string | undefined {
  if (value === null) return undefined;
  return timestamp(value, field);
}

function exactOneOrNull<Row>(rows: readonly Row[]): Row | null {
  if (rows.length === 0) return null;
  if (rows.length !== 1) {
    invalid("Persisted OperatorElevation exact-id read is ambiguous.");
  }
  return rows[0] ?? null;
}

function parseRow(row: OperatorElevationMetadataRow): OperatorElevationMetadata {
  return Object.freeze({
    id: uuid(row.id, "id"),
    operatorPrincipalId: uuid(row.operator_principal_id, "operator principal id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(row.industry_context_id !== null
      ? {industryContextId: optionalUuid(row.industry_context_id, "Industry Context id")}
      : {}),
    purposeCode: rawText(row.purpose_code, "purpose code"),
    ...(row.ticket_reference !== null
      ? {ticketReference: optionalRawText(row.ticket_reference, "ticket reference")}
      : {}),
    ...(row.approved_by !== null
      ? {approvedBy: optionalUuid(row.approved_by, "approved-by principal id")}
      : {}),
    startsAt: timestamp(row.starts_at, "startsAt"),
    expiresAt: timestamp(row.expires_at, "expiresAt"),
    status: status(row.status),
    permissionProfileId: uuid(row.permission_profile_id, "permission profile id"),
    createdAt: timestamp(row.created_at, "createdAt"),
    ...(row.revoked_at !== null
      ? {revokedAt: optionalTimestamp(row.revoked_at, "revokedAt")}
      : {}),
  });
}

async function readById(
  transaction: SqlTransaction,
  operatorElevationId: string,
): Promise<OperatorElevationMetadata | null> {
  const result = await transaction.query<OperatorElevationMetadataRow>(
    `SELECT id::text,
            operator_principal_id::text,
            tenant_id::text,
            industry_context_id::text,
            purpose_code,
            ticket_reference,
            approved_by::text,
            starts_at,
            expires_at,
            status,
            permission_profile_id::text,
            created_at,
            revoked_at
       FROM core_authz.operator_elevation
      WHERE id=$1::uuid`,
    [operatorElevationId],
  );

  const row = exactOneOrNull(result.rows);
  return row ? parseRow(row) : null;
}

export class PostgresOperatorElevationMetadataStore
implements OperatorElevationMetadataReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadById(input: {
    readonly operatorElevationId: string;
  }): Promise<OperatorElevationMetadata | null> {
    if (!UUID_PATTERN.test(input.operatorElevationId)) {
      invalid("OperatorElevation id is invalid.");
    }
    return this.database.transaction(
      (transaction) => readById(transaction, input.operatorElevationId),
    );
  }
}
