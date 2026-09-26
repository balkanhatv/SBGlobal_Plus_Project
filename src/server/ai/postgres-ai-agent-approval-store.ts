import type {
  AIAgentApprovalReadPort,
  AIAgentApprovalStatus,
  PersistedAIAgentApproval,
} from "../../core/ai/agent-approval.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIAgentApprovalRow {
  readonly id: string;
  readonly run_id: string;
  readonly step_id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly requested_by_agent: boolean;
  readonly approval_type: string;
  readonly required_permission: string;
  readonly approver_principal_id: string | null;
  readonly status: string;
  readonly request_summary_safe: string;
  readonly approved_at: string | Date | null;
  readonly reason: string | null;
  readonly correlation_id: string;
  readonly created_at: string | Date;
}

export class AIAgentApprovalPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIAgentApprovalPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set<AIAgentApprovalStatus>([
  "PENDING","APPROVED","REJECTED","EXPIRED",
]);

function invalid(message: string): never {
  throw new AIAgentApprovalPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIAgentApproval ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIAgentApproval ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    invalid(`Persisted AIAgentApproval ${field} is invalid.`);
  }
  return value;
}

function status(value: unknown): AIAgentApprovalStatus {
  if (typeof value !== "string" || !STATUSES.has(value as AIAgentApprovalStatus)) {
    invalid("Persisted AIAgentApproval status is invalid.");
  }
  return value as AIAgentApprovalStatus;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIAgentApproval ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(
  value: string | Date | null,
  field: string,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  return timestamp(value, field);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIAgentApproval reads require a resolved principal context.");
  }
  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIAgentApproval platform reads require trusted platform-global context.");
    }
    return;
  }
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIAgentApproval reads require a resolved private context.");
  }
}

function parseRow(row: AIAgentApprovalRow): PersistedAIAgentApproval {
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");
  const approverPrincipalId = optionalUuid(row.approver_principal_id, "approver principal id");
  const parsedStatus = status(row.status);
  const approvedAt = optionalTimestamp(row.approved_at, "approvedAt");
  const reason = optionalText(row.reason, "reason");

  if (parsedStatus === "APPROVED" && (!approverPrincipalId || !approvedAt)) {
    invalid("Persisted APPROVED AIAgentApproval is missing required approval evidence.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    runId: uuid(row.run_id, "run id"),
    stepId: uuid(row.step_id, "step id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    requestedByAgent: booleanValue(row.requested_by_agent, "requestedByAgent"),
    approvalType: textValue(row.approval_type, "approvalType"),
    requiredPermission: textValue(row.required_permission, "requiredPermission"),
    ...(approverPrincipalId ? { approverPrincipalId } : {}),
    status: parsedStatus,
    requestSummarySafe: textValue(row.request_summary_safe, "requestSummarySafe"),
    ...(approvedAt ? { approvedAt } : {}),
    ...(reason === undefined ? {} : { reason }),
    correlationId: uuid(row.correlation_id, "correlation id"),
    createdAt: timestamp(row.created_at, "createdAt"),
  });
}

async function readApproval(
  transaction: SqlTransaction,
  agentApprovalId: string,
): Promise<PersistedAIAgentApproval | null> {
  const result = await transaction.query<AIAgentApprovalRow>(
    `SELECT id,
            run_id,
            step_id,
            tenant_id,
            industry_context_id,
            requested_by_agent,
            approval_type,
            required_permission,
            approver_principal_id,
            status::text AS status,
            request_summary_safe,
            approved_at,
            reason,
            correlation_id,
            created_at
       FROM core_ai.agent_approval
      WHERE id=$1::uuid`,
    [agentApprovalId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIAgentApproval is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIAgentApprovalStore implements AIAgentApprovalReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly agentApprovalId: string;
  }): Promise<PersistedAIAgentApproval | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.agentApprovalId)) {
      invalid("AIAgentApproval id is invalid.");
    }
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readApproval(transaction, input.agentApprovalId),
    );
  }
}
