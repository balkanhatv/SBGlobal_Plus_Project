import type {
  AICostReadPort,
  PersistedAICost,
} from "../../core/ai/cost.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AICostRow {
  readonly usage_id: string;
  readonly cost_currency: string;
  readonly estimated_minor_units: string;
  readonly provider_rate_version: string;
  readonly billable_class: string;
  readonly finalized_at: string | Date | null;
}

export class AICostPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AICostPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AICostPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AICost ${field} is invalid.`);
  }
  return value;
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AICost ${field} is invalid.`);
  }
  return value;
}

function optionalTimestamp(value: string | Date | null, field: string): string | undefined {
  if (value === null) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AICost ${field} is invalid.`);
  }
  return date.toISOString();
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AICost reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId
      || context.industryContextId
    ) {
      invalid("AICost platform reads require trusted platform-global context.");
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
    invalid("AICost reads require a resolved private context.");
  }
}

function parseRow(row: AICostRow): PersistedAICost {
  const finalizedAt = optionalTimestamp(row.finalized_at, "finalizedAt");
  return Object.freeze({
    usageId: uuid(row.usage_id, "usage id"),
    costCurrency: rawText(row.cost_currency, "cost currency"),
    estimatedMinorUnits: rawText(row.estimated_minor_units, "estimated minor units"),
    providerRateVersion: rawText(row.provider_rate_version, "provider rate version"),
    billableClass: rawText(row.billable_class, "billable class"),
    ...(finalizedAt === undefined ? {} : { finalizedAt }),
  });
}

async function readCost(
  transaction: SqlTransaction,
  usageId: string,
): Promise<PersistedAICost | null> {
  const result = await transaction.query<AICostRow>(
    `SELECT usage_id,
            cost_currency,
            estimated_minor_units::text AS estimated_minor_units,
            provider_rate_version,
            billable_class,
            finalized_at
       FROM core_ai.ai_cost
      WHERE usage_id=$1::uuid`,
    [usageId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AICost is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAICostStore implements AICostReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly usageId: string;
  }): Promise<PersistedAICost | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.usageId)) {
      invalid("AICost usage id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readCost(transaction, input.usageId),
    );
  }
}
