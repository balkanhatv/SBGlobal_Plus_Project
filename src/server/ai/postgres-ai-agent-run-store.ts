import type { JsonValue } from "../../core/api/schema-registry.js";
import type {
  AIAgentRunReadPort,
  AIAgentRunStatus,
  PersistedAIAgentRun,
} from "../../core/ai/agent-run.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIAgentRunRow {
  readonly id: string;
  readonly agent_definition_id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly acting_principal_id: string;
  readonly membership_id: string | null;
  readonly entitlement_snapshot_version: string;
  readonly permission_version: string;
  readonly requested_resource_scope_json: unknown;
  readonly status: string;
  readonly step_budget_class: string;
  readonly token_budget_class: string;
  readonly started_at: string | Date;
  readonly completed_at: string | Date | null;
  readonly correlation_id: string;
}

export class AIAgentRunPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIAgentRunPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTEGER_TEXT = /^-?\d+$/;

const STATUSES = new Set<AIAgentRunStatus>([
  "PENDING",
  "RUNNING",
  "WAITING_APPROVAL",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);

function invalid(message: string): never {
  throw new AIAgentRunPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIAgentRun ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function integerText(value: unknown, field: string): string {
  if (typeof value !== "string" || !INTEGER_TEXT.test(value)) {
    invalid(`Persisted AIAgentRun ${field} is invalid.`);
  }
  return value;
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIAgentRun ${field} is invalid.`);
  }
  return value;
}

function status(value: unknown): AIAgentRunStatus {
  if (typeof value !== "string" || !STATUSES.has(value as AIAgentRunStatus)) {
    invalid("Persisted AIAgentRun status is invalid.");
  }
  return value as AIAgentRunStatus;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIAgentRun ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: string | Date | null, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return timestamp(value, field);
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AIAgentRun resource-scope JSON is invalid at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)));
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted AIAgentRun resource-scope JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIAgentRun resource-scope JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AIAgentRun resource-scope JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIAgentRun reads require a resolved principal context.");
  }
  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId
      || context.industryContextId
    ) {
      invalid("AIAgentRun platform reads require trusted platform-global context.");
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
    invalid("AIAgentRun reads require a resolved private context.");
  }
}

function parseRow(row: AIAgentRunRow): PersistedAIAgentRun {
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");
  const membershipId = optionalUuid(row.membership_id, "membership id");
  const startedAt = timestamp(row.started_at, "startedAt");
  const completedAt = optionalTimestamp(row.completed_at, "completedAt");

  if (completedAt && Date.parse(completedAt) < Date.parse(startedAt)) {
    invalid("Persisted AIAgentRun completion ordering is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    agentDefinitionId: uuid(row.agent_definition_id, "AgentDefinition id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    actingPrincipalId: uuid(row.acting_principal_id, "acting principal id"),
    ...(membershipId ? { membershipId } : {}),
    entitlementSnapshotVersion: integerText(
      row.entitlement_snapshot_version,
      "EntitlementSnapshot version",
    ),
    permissionVersion: integerText(row.permission_version, "permission version"),
    requestedResourceScope: normalizeJson(row.requested_resource_scope_json),
    status: status(row.status),
    stepBudgetClass: rawText(row.step_budget_class, "step budget class"),
    tokenBudgetClass: rawText(row.token_budget_class, "token budget class"),
    startedAt,
    ...(completedAt ? { completedAt } : {}),
    correlationId: uuid(row.correlation_id, "correlation id"),
  });
}

async function readAgentRun(
  transaction: SqlTransaction,
  agentRunId: string,
): Promise<PersistedAIAgentRun | null> {
  const result = await transaction.query<AIAgentRunRow>(
    `SELECT id,
            agent_definition_id,
            tenant_id,
            industry_context_id,
            acting_principal_id,
            membership_id,
            entitlement_snapshot_version::text AS entitlement_snapshot_version,
            permission_version::text AS permission_version,
            requested_resource_scope_json,
            status::text AS status,
            step_budget_class,
            token_budget_class,
            started_at,
            completed_at,
            correlation_id
       FROM core_ai.agent_run
      WHERE id=$1::uuid`,
    [agentRunId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIAgentRun is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIAgentRunStore implements AIAgentRunReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly agentRunId: string;
  }): Promise<PersistedAIAgentRun | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.agentRunId)) {
      invalid("AIAgentRun id is invalid.");
    }
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readAgentRun(transaction, input.agentRunId),
    );
  }
}
