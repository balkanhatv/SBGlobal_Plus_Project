import type {
  AITokenUsageReadPort,
  PersistedAITokenUsage,
} from "../../core/ai/token-usage.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AITokenUsageRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly principal_id: string | null;
  readonly capability_code: string;
  readonly provider_id: string;
  readonly model_id: string;
  readonly input_units: string;
  readonly output_units: string;
  readonly media_units: string | null;
  readonly occurred_at: string | Date;
  readonly correlation_id: string;
}

export class AITokenUsagePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AITokenUsagePersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AITokenUsagePersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AITokenUsage ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AITokenUsage ${field} is invalid.`);
  }
  return value;
}

function optionalNumericText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return rawText(value, field);
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AITokenUsage ${field} is invalid.`);
  }
  return date.toISOString();
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AITokenUsage reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId
      || context.industryContextId
    ) {
      invalid("AITokenUsage platform reads require trusted platform-global context.");
    }
    return;
  }

  if (
    (context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (
      context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId))
    )
  ) {
    invalid("AITokenUsage reads require a resolved private context.");
  }
}

function parseRow(row: AITokenUsageRow): PersistedAITokenUsage {
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");
  const principalId = optionalUuid(row.principal_id, "principal id");
  const mediaUnits = optionalNumericText(row.media_units, "media units");

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    ...(principalId ? { principalId } : {}),
    capabilityCode: rawText(row.capability_code, "capability code"),
    providerId: uuid(row.provider_id, "provider id"),
    modelId: uuid(row.model_id, "model id"),
    inputUnits: rawText(row.input_units, "input units"),
    outputUnits: rawText(row.output_units, "output units"),
    ...(mediaUnits === undefined ? {} : { mediaUnits }),
    occurredAt: timestamp(row.occurred_at, "occurredAt"),
    correlationId: uuid(row.correlation_id, "correlation id"),
  });
}

async function readTokenUsage(
  transaction: SqlTransaction,
  tokenUsageId: string,
): Promise<PersistedAITokenUsage | null> {
  const result = await transaction.query<AITokenUsageRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            principal_id,
            capability_code,
            provider_id,
            model_id,
            input_units::text AS input_units,
            output_units::text AS output_units,
            media_units::text AS media_units,
            occurred_at,
            correlation_id
       FROM core_ai.token_usage
      WHERE id=$1::uuid`,
    [tokenUsageId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AITokenUsage is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAITokenUsageStore implements AITokenUsageReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly tokenUsageId: string;
  }): Promise<PersistedAITokenUsage | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.tokenUsageId)) {
      invalid("AITokenUsage id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readTokenUsage(transaction, input.tokenUsageId),
    );
  }
}
