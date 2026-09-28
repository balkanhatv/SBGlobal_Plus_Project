import type { RequestContext } from "../../core/context/contracts.js";
import type {
  PersistedWorkflowTransition,
  WorkflowTransitionReadPort,
} from "../../core/workflow/transition.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface WorkflowTransitionRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly workflow_instance_id: string;
  readonly from_state: string;
  readonly action_code: string;
  readonly to_state: string;
  readonly actor_principal_id: string;
  readonly reason_code: string | null;
  readonly expected_instance_version: string | number;
  readonly resulting_instance_version: string | number;
  readonly occurred_at: string | Date;
  readonly correlation_id: string;
}

export class WorkflowTransitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowTransitionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new WorkflowTransitionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted WorkflowTransition ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted WorkflowTransition ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted WorkflowTransition ${field} is invalid.`);
  }
  return date.toISOString();
}

function positiveDecimalText(
  value: string | number,
  field: string,
): string {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 1) {
      invalid(`Persisted WorkflowTransition ${field} is invalid.`);
    }
    return String(value);
  }
  if (!/^[1-9][0-9]*$/.test(value)) {
    invalid(`Persisted WorkflowTransition ${field} is invalid.`);
  }
  return value;
}

function decimalGreater(left: string, right: string): boolean {
  if (left.length !== right.length) return left.length > right.length;
  return left > right;
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
    invalid("WorkflowTransition reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: WorkflowTransitionRow): PersistedWorkflowTransition {
  const expected = positiveDecimalText(
    row.expected_instance_version,
    "expected instance version",
  );
  const resulting = positiveDecimalText(
    row.resulting_instance_version,
    "resulting instance version",
  );
  if (!decimalGreater(resulting, expected)) {
    invalid("Persisted WorkflowTransition version ordering is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(row.industry_context_id !== null
      ? {industryContextId: uuid(row.industry_context_id, "Industry Context id")}
      : {}),
    workflowInstanceId: uuid(row.workflow_instance_id, "WorkflowInstance id"),
    fromState: textValue(row.from_state, "from state"),
    actionCode: textValue(row.action_code, "action code"),
    toState: textValue(row.to_state, "to state"),
    actorPrincipalId: uuid(row.actor_principal_id, "actor principal id"),
    ...(row.reason_code !== null
      ? {reasonCode: textValue(row.reason_code, "reason code")}
      : {}),
    expectedInstanceVersion: expected,
    resultingInstanceVersion: resulting,
    occurredAt: timestamp(row.occurred_at, "occurredAt"),
    correlationId: uuid(row.correlation_id, "correlation id"),
  });
}

async function readTransition(
  transaction: SqlTransaction,
  workflowTransitionId: string,
): Promise<PersistedWorkflowTransition | null> {
  const result = await transaction.query<WorkflowTransitionRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            workflow_instance_id,
            from_state,
            action_code,
            to_state,
            actor_principal_id,
            reason_code,
            expected_instance_version,
            resulting_instance_version,
            occurred_at,
            correlation_id
       FROM core_workflow.workflow_transition
      WHERE id=$1::uuid`,
    [workflowTransitionId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted WorkflowTransition is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresWorkflowTransitionStore implements WorkflowTransitionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly workflowTransitionId: string;
  }): Promise<PersistedWorkflowTransition | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.workflowTransitionId)) {
      invalid("WorkflowTransition id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readTransition(transaction, input.workflowTransitionId),
    );
  }
}
