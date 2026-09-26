import type { RequestContext } from "../../core/context/contracts.js";
import type {
  PersistedWorkflowTask,
  WorkflowTaskReadPort,
  WorkflowTaskState,
  WorkflowTaskSubjectType,
  WorkflowTaskType,
} from "../../core/workflow/task.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface WorkflowTaskRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly workflow_instance_id: string;
  readonly task_type: string;
  readonly assigned_subject_type: string;
  readonly assigned_subject_id: string;
  readonly permission_code: string;
  readonly state: string;
  readonly due_at: string | Date | null;
  readonly claimed_by: string | null;
  readonly completed_by: string | null;
  readonly completed_at: string | Date | null;
  readonly row_version: string | number;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class WorkflowTaskPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowTaskPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TASK_TYPES = new Set<WorkflowTaskType>(["APPROVAL", "REVIEW", "ACTION"]);
const SUBJECT_TYPES = new Set<WorkflowTaskSubjectType>([
  "PRINCIPAL",
  "ROLE",
  "ORG_UNIT",
]);
const STATES = new Set<WorkflowTaskState>([
  "PENDING",
  "CLAIMED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
]);

function invalid(message: string): never {
  throw new WorkflowTaskPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted WorkflowTask ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted WorkflowTask ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted WorkflowTask ${field} is invalid.`);
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

function decimalText(value: string | number, field: string): string {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      invalid(`Persisted WorkflowTask ${field} is invalid.`);
    }
    return String(value);
  }
  if (!/^-?(0|[1-9][0-9]*)$/.test(value)) {
    invalid(`Persisted WorkflowTask ${field} is invalid.`);
  }
  return value;
}

function taskType(value: string): WorkflowTaskType {
  if (!TASK_TYPES.has(value as WorkflowTaskType)) {
    invalid("Persisted WorkflowTask task type is invalid.");
  }
  return value as WorkflowTaskType;
}

function subjectType(value: string): WorkflowTaskSubjectType {
  if (!SUBJECT_TYPES.has(value as WorkflowTaskSubjectType)) {
    invalid("Persisted WorkflowTask subject type is invalid.");
  }
  return value as WorkflowTaskSubjectType;
}

function state(value: string): WorkflowTaskState {
  if (!STATES.has(value as WorkflowTaskState)) {
    invalid("Persisted WorkflowTask state is invalid.");
  }
  return value as WorkflowTaskState;
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
    invalid("WorkflowTask reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: WorkflowTaskRow): PersistedWorkflowTask {
  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(row.industry_context_id !== null
      ? {industryContextId: uuid(row.industry_context_id, "Industry Context id")}
      : {}),
    workflowInstanceId: uuid(row.workflow_instance_id, "WorkflowInstance id"),
    taskType: taskType(row.task_type),
    assignedSubjectType: subjectType(row.assigned_subject_type),
    assignedSubjectId: uuid(row.assigned_subject_id, "assigned subject id"),
    permissionCode: textValue(row.permission_code, "permission code"),
    state: state(row.state),
    ...(row.due_at !== null ? {dueAt: optionalTimestamp(row.due_at, "dueAt")} : {}),
    ...(row.claimed_by !== null
      ? {claimedBy: optionalUuid(row.claimed_by, "claimedBy")}
      : {}),
    ...(row.completed_by !== null
      ? {completedBy: optionalUuid(row.completed_by, "completedBy")}
      : {}),
    ...(row.completed_at !== null
      ? {completedAt: optionalTimestamp(row.completed_at, "completedAt")}
      : {}),
    rowVersion: decimalText(row.row_version, "row version"),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readTask(
  transaction: SqlTransaction,
  workflowTaskId: string,
): Promise<PersistedWorkflowTask | null> {
  const result = await transaction.query<WorkflowTaskRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            workflow_instance_id,
            task_type::text,
            assigned_subject_type::text,
            assigned_subject_id,
            permission_code,
            state::text,
            due_at,
            claimed_by,
            completed_by,
            completed_at,
            row_version,
            created_at,
            updated_at
       FROM core_workflow.workflow_task
      WHERE id=$1::uuid`,
    [workflowTaskId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted WorkflowTask is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresWorkflowTaskStore implements WorkflowTaskReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly workflowTaskId: string;
  }): Promise<PersistedWorkflowTask | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.workflowTaskId)) {
      invalid("WorkflowTask id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readTask(transaction, input.workflowTaskId),
    );
  }
}
