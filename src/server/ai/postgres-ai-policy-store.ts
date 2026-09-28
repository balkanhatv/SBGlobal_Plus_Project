import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AIPolicyEffect,
  AIPolicyOwnerScope,
  AIPolicyReadPort,
  PersistedAIPolicy,
} from "../../core/ai/policy.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIPolicyRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly priority: string | number;
  readonly effect: string;
  readonly condition_ast_json: unknown;
  readonly constraint_json: unknown;
  readonly version: string | number;
  readonly status: string;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class AIPolicyPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIPolicyPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AIPolicyPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIPolicy ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIPolicy ${field} is invalid.`);
  }
  return value;
}

function integer(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    invalid(`Persisted AIPolicy ${field} is invalid.`);
  }
  return parsed;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AIPolicy ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIPolicy ${field} is invalid.`);
  }
  return date.toISOString();
}

function ownerScope(value: string): AIPolicyOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") {
    invalid("Persisted AIPolicy owner scope is invalid.");
  }
  return value;
}

function effect(value: string): AIPolicyEffect {
  if (value !== "ALLOW" && value !== "DENY" && value !== "RESTRICT") {
    invalid("Persisted AIPolicy effect is invalid.");
  }
  return value;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AIPolicy JSON is invalid at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)),
    );
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted AIPolicy JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIPolicy JSON is invalid at ${path}.${key}.`);
      }
      Object.defineProperty(normalized, key, {
        value: normalizeJson(entry, `${path}.${key}`),
        enumerable: true,
        configurable: false,
        writable: false,
      });
    }
    return Object.freeze(normalized);
  }
  invalid(`Persisted AIPolicy JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIPolicy reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIPolicy platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIPolicy reads require a resolved private context.");
  }
}

function parseRow(row: AIPolicyRow): PersistedAIPolicy {
  const parsedOwnerScope = ownerScope(row.owner_scope);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if ((parsedOwnerScope === "PLATFORM" && (tenantId || industryContextId))
    || (parsedOwnerScope === "TENANT" && (!tenantId || industryContextId))
    || (parsedOwnerScope === "INDUSTRY" && (!tenantId || !industryContextId))) {
    invalid("Persisted AIPolicy ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    ownerScope: parsedOwnerScope,
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    code: textValue(row.code, "code"),
    priority: integer(row.priority, "priority"),
    effect: effect(row.effect),
    conditionAst: normalizeJson(row.condition_ast_json),
    constraint: normalizeJson(row.constraint_json),
    version: positiveInteger(row.version, "version"),
    status: textValue(row.status, "status"),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readPolicy(
  transaction: SqlTransaction,
  policyId: string,
): Promise<PersistedAIPolicy | null> {
  const result = await transaction.query<AIPolicyRow>(
    `SELECT id,
            owner_scope::text,
            tenant_id,
            industry_context_id,
            code,
            priority,
            effect::text,
            condition_ast_json,
            constraint_json,
            version,
            status,
            created_at,
            updated_at
       FROM core_ai.ai_policy
      WHERE id=$1::uuid`,
    [policyId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIPolicy is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIPolicyStore implements AIPolicyReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly policyId: string;
  }): Promise<PersistedAIPolicy | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.policyId)) {
      invalid("AIPolicy id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readPolicy(transaction, input.policyId),
    );
  }
}
