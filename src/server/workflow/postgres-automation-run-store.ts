import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AutomationRunReadPort,
  AutomationRunStatus,
  PersistedAutomationRun,
} from "../../core/workflow/automation-run.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AutomationRunRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly automation_definition_id: string;
  readonly trigger_ref: string;
  readonly idempotency_key_hash: string;
  readonly status: string;
  readonly started_at: string | Date;
  readonly completed_at: string | Date | null;
  readonly correlation_id: string;
  readonly last_error_code: string | null;
}

export class AutomationRunPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AutomationRunPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set<AutomationRunStatus>([
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);

function invalid(message: string): never {
  throw new AutomationRunPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AutomationRun ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AutomationRun ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AutomationRun ${field} is invalid.`);
  }
  return date.toISOString();
}

function status(value: string): AutomationRunStatus {
  if (!STATUSES.has(value as AutomationRunStatus)) {
    invalid("Persisted AutomationRun status is invalid.");
  }
  return value as AutomationRunStatus;
}

function assertContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || !context.principalId
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AutomationRun reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: AutomationRunRow): PersistedAutomationRun {
  const startedAt = timestamp(row.started_at, "startedAt");
  const completedAt = row.completed_at === null
    ? undefined
    : timestamp(row.completed_at, "completedAt");

  if (completedAt !== undefined
    && Date.parse(completedAt) < Date.parse(startedAt)) {
    invalid("Persisted AutomationRun completion time is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(row.industry_context_id !== null
      ? {industryContextId: uuid(row.industry_context_id, "Industry Context id")}
      : {}),
    automationDefinitionId: uuid(row.automation_definition_id, "AutomationDefinition id"),
    triggerRef: textValue(row.trigger_ref, "trigger ref"),
    idempotencyKeyHash: textValue(row.idempotency_key_hash, "idempotency key hash"),
    status: status(row.status),
    startedAt,
    ...(completedAt !== undefined ? {completedAt} : {}),
    correlationId: uuid(row.correlation_id, "correlation id"),
    ...(row.last_error_code !== null
      ? {lastErrorCode: textValue(row.last_error_code, "last error code")}
      : {}),
  });
}

async function readRun(
  transaction: SqlTransaction,
  automationRunId: string,
): Promise<PersistedAutomationRun | null> {
  const result = await transaction.query<AutomationRunRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            automation_definition_id,
            trigger_ref,
            idempotency_key_hash,
            status::text,
            started_at,
            completed_at,
            correlation_id,
            last_error_code
       FROM core_workflow.automation_run
      WHERE id=$1::uuid`,
    [automationRunId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AutomationRun is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAutomationRunStore implements AutomationRunReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly automationRunId: string;
  }): Promise<PersistedAutomationRun | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.automationRunId)) {
      invalid("AutomationRun id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readRun(transaction, input.automationRunId),
    );
  }
}
