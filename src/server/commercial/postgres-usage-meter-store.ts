import type { RequestContext } from "../../core/context/contracts.js";
import type {
  PersistedUsageMeter,
  UsageMeterReadPort,
} from "../../core/commercial/usage-meter.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface UsageMeterRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly meter_code: string;
  readonly period_key: string;
  readonly used_value: string;
  readonly reserved_value: string;
  readonly version: string;
  readonly updated_at: string | Date;
}

export class UsageMeterPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageMeterPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NON_NEGATIVE_NUMERIC_TEXT =
  /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
const BIGINT_TEXT = /^-?(?:0|[1-9][0-9]*)$/;

function invalid(message: string): never {
  throw new UsageMeterPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted UsageMeter ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted UsageMeter ${field} is invalid.`);
  }
  return value;
}

function numericText(value: unknown, field: string): string {
  if (typeof value !== "string" || !NON_NEGATIVE_NUMERIC_TEXT.test(value)) {
    invalid(`Persisted UsageMeter ${field} is invalid.`);
  }
  return value;
}

function bigintText(value: unknown, field: string): string {
  if (typeof value !== "string" || !BIGINT_TEXT.test(value)) {
    invalid(`Persisted UsageMeter ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted UsageMeter ${field} is invalid.`);
  }
  return date.toISOString();
}

function assertPrivateContext(context: RequestContext): void {
  if (
    !context.principalId ||
    !UUID_PATTERN.test(context.principalId) ||
    !context.tenantId ||
    !UUID_PATTERN.test(context.tenantId) ||
    (context.scopeClass !== "TENANT_CORE" &&
      context.scopeClass !== "TENANT_INDUSTRY") ||
    (context.scopeClass === "TENANT_CORE" && context.industryContextId) ||
    (
      context.scopeClass === "TENANT_INDUSTRY" &&
      (!context.industryContextId ||
        !UUID_PATTERN.test(context.industryContextId))
    )
  ) {
    invalid("UsageMeter reads require a resolved Tenant private context.");
  }
}

function parseRow(row: UsageMeterRow): PersistedUsageMeter {
  const industryContextId = optionalUuid(
    row.industry_context_id,
    "Industry Context id",
  );

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? {industryContextId} : {}),
    meterCode: rawText(row.meter_code, "meterCode"),
    periodKey: rawText(row.period_key, "periodKey"),
    usedValue: numericText(row.used_value, "usedValue"),
    reservedValue: numericText(row.reserved_value, "reservedValue"),
    version: bigintText(row.version, "version"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readUsageMeter(
  transaction: SqlTransaction,
  usageMeterId: string,
): Promise<PersistedUsageMeter | null> {
  const result = await transaction.query<UsageMeterRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            meter_code,
            period_key,
            used_value::text,
            reserved_value::text,
            version::text,
            updated_at
       FROM core_commercial.usage_meter
      WHERE id=$1::uuid`,
    [usageMeterId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted UsageMeter is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresUsageMeterStore implements UsageMeterReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly usageMeterId: string;
  }): Promise<PersistedUsageMeter | null> {
    assertPrivateContext(input.requestContext);
    if (!UUID_PATTERN.test(input.usageMeterId)) {
      invalid("UsageMeter id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readUsageMeter(transaction, input.usageMeterId),
    );
  }
}
