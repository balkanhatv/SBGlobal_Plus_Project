import type { RequestContext } from "../../core/context/contracts.js";
import type {
  PersistedSyncCursor,
  SyncCursorReadPort,
} from "../../core/integration/sync-cursor.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface SyncCursorRow {
  readonly id: string;
  readonly tenant_integration_id: string;
  readonly capability_code: string;
  readonly industry_context_id: string | null;
  readonly cursor_encrypted_or_opaque: string;
  readonly watermark_time: string | Date | null;
  readonly source_version: string | null;
  readonly updated_at: string | Date;
}

export class SyncCursorPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncCursorPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new SyncCursorPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted SyncCursor ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted SyncCursor ${field} is invalid.`);
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
    invalid(`Persisted SyncCursor ${field} is invalid.`);
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
    invalid("SyncCursor reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: SyncCursorRow): PersistedSyncCursor {
  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantIntegrationId: uuid(row.tenant_integration_id, "TenantIntegration id"),
    capabilityCode: textValue(row.capability_code, "capability code"),
    ...(row.industry_context_id !== null
      ? {industryContextId: optionalUuid(row.industry_context_id, "Industry Context id")}
      : {}),
    cursorEncryptedOrOpaque: textValue(
      row.cursor_encrypted_or_opaque,
      "cursor",
    ),
    ...(row.watermark_time !== null
      ? {watermarkTime: optionalTimestamp(row.watermark_time, "watermarkTime")}
      : {}),
    ...(row.source_version !== null
      ? {sourceVersion: optionalText(row.source_version, "source version")}
      : {}),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readExact(
  transaction: SqlTransaction,
  input: {
    readonly tenantIntegrationId: string;
    readonly capabilityCode: string;
    readonly industryContextId?: string;
  },
): Promise<PersistedSyncCursor | null> {
  const result = await transaction.query<SyncCursorRow>(
    `SELECT id,
            tenant_integration_id,
            capability_code,
            industry_context_id,
            cursor_encrypted_or_opaque,
            watermark_time,
            source_version,
            updated_at
       FROM core_integration.sync_cursor
      WHERE tenant_integration_id=$1::uuid
        AND capability_code=$2
        AND industry_context_id IS NOT DISTINCT FROM $3::uuid`,
    [
      input.tenantIntegrationId,
      input.capabilityCode,
      input.industryContextId ?? null,
    ],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted SyncCursor tuple is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresSyncCursorStore implements SyncCursorReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadExact(input: {
    readonly requestContext: RequestContext;
    readonly tenantIntegrationId: string;
    readonly capabilityCode: string;
    readonly industryContextId?: string;
  }): Promise<PersistedSyncCursor | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.tenantIntegrationId)) {
      invalid("SyncCursor TenantIntegration id is invalid.");
    }
    textValue(input.capabilityCode, "capability code");
    if (input.industryContextId !== undefined
      && !UUID_PATTERN.test(input.industryContextId)) {
      invalid("SyncCursor Industry Context id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readExact(transaction, input),
    );
  }
}
