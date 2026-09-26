import type { RequestContext } from "../../core/context/contracts.js";
import type {
  PersistedWorkflowInstance,
  WorkflowInstanceReadPort,
  WorkflowInstanceScopeClass,
  WorkflowLifecycleState,
} from "../../core/workflow/instance.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface WorkflowInstanceRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly scope_class: string;
  readonly workflow_definition_id: string;
  readonly workflow_definition_version: string | number;
  readonly resource_type: string;
  readonly resource_id: string;
  readonly current_state: string;
  readonly lifecycle_state: string;
  readonly row_version: string | number;
  readonly started_at: string | Date;
  readonly completed_at: string | Date | null;
  readonly created_by: string;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class WorkflowInstancePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowInstancePersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LIFECYCLE_STATES = new Set<WorkflowLifecycleState>([
  "OPEN",
  "WAITING",
  "COMPLETED",
  "CANCELLED",
]);

function invalid(message: string): never {
  throw new WorkflowInstancePersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted WorkflowInstance ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted WorkflowInstance ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted WorkflowInstance ${field} is invalid.`);
  }
  return parsed;
}

function decimalText(value: string | number, field: string): string {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      invalid(`Persisted WorkflowInstance ${field} is invalid.`);
    }
    return String(value);
  }
  if (!/^-?(0|[1-9][0-9]*)$/.test(value)) {
    invalid(`Persisted WorkflowInstance ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted WorkflowInstance ${field} is invalid.`);
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

function scopeClass(value: string): WorkflowInstanceScopeClass {
  if (value !== "TENANT_CORE" && value !== "TENANT_INDUSTRY") {
    invalid("Persisted WorkflowInstance scope class is invalid.");
  }
  return value;
}

function lifecycleState(value: string): WorkflowLifecycleState {
  if (!LIFECYCLE_STATES.has(value as WorkflowLifecycleState)) {
    invalid("Persisted WorkflowInstance lifecycle state is invalid.");
  }
  return value as WorkflowLifecycleState;
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
    invalid("WorkflowInstance reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: WorkflowInstanceRow): PersistedWorkflowInstance {
  const parsedScope = scopeClass(row.scope_class);
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if ((parsedScope === "TENANT_CORE" && industryContextId)
    || (parsedScope === "TENANT_INDUSTRY" && !industryContextId)) {
    invalid("Persisted WorkflowInstance ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? {industryContextId} : {}),
    scopeClass: parsedScope,
    workflowDefinitionId: uuid(row.workflow_definition_id, "WorkflowDefinition id"),
    workflowDefinitionVersion: positiveInteger(
      row.workflow_definition_version,
      "WorkflowDefinition version",
    ),
    resourceType: textValue(row.resource_type, "resource type"),
    resourceId: textValue(row.resource_id, "resource id"),
    currentState: textValue(row.current_state, "current state"),
    lifecycleState: lifecycleState(row.lifecycle_state),
    rowVersion: decimalText(row.row_version, "row version"),
    startedAt: timestamp(row.started_at, "startedAt"),
    ...(row.completed_at !== null
      ? {completedAt: optionalTimestamp(row.completed_at, "completedAt")}
      : {}),
    createdBy: uuid(row.created_by, "createdBy"),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readInstance(
  transaction: SqlTransaction,
  workflowInstanceId: string,
): Promise<PersistedWorkflowInstance | null> {
  const result = await transaction.query<WorkflowInstanceRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            scope_class,
            workflow_definition_id,
            workflow_definition_version,
            resource_type,
            resource_id,
            current_state,
            lifecycle_state::text,
            row_version,
            started_at,
            completed_at,
            created_by,
            created_at,
            updated_at
       FROM core_workflow.workflow_instance
      WHERE id=$1::uuid`,
    [workflowInstanceId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted WorkflowInstance is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresWorkflowInstanceStore implements WorkflowInstanceReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly workflowInstanceId: string;
  }): Promise<PersistedWorkflowInstance | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.workflowInstanceId)) {
      invalid("WorkflowInstance id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readInstance(transaction, input.workflowInstanceId),
    );
  }
}
