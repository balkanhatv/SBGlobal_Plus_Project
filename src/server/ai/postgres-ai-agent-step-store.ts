import type {
  AIAgentStepReadPort,
  AIAgentStepStatus,
  AIAgentStepType,
  PersistedAIAgentStep,
} from "../../core/ai/agent-step.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIAgentStepRow {
  readonly id: string;
  readonly run_id: string;
  readonly ordinal: string | number;
  readonly step_type: string;
  readonly input_ref: string | null;
  readonly output_ref: string | null;
  readonly tool_binding_id: string | null;
  readonly approval_id: string | null;
  readonly status: string;
  readonly started_at: string | Date;
  readonly completed_at: string | Date | null;
  readonly audit_ref: string | null;
}

export class AIAgentStepPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIAgentStepPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STEP_TYPES = new Set<AIAgentStepType>([
  "PLAN","RAG","TOOL","APPROVAL","INFERENCE",
]);

const STATUSES = new Set<AIAgentStepStatus>([
  "PENDING","RUNNING","SUCCEEDED","FAILED","SKIPPED","CANCELLED",
]);

function invalid(message: string): never {
  throw new AIAgentStepPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIAgentStep ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function nonNegativeInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    invalid(`Persisted AIAgentStep ${field} is invalid.`);
  }
  return parsed;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") {
    invalid(`Persisted AIAgentStep ${field} is invalid.`);
  }
  return value;
}

function stepType(value: unknown): AIAgentStepType {
  if (typeof value !== "string" || !STEP_TYPES.has(value as AIAgentStepType)) {
    invalid("Persisted AIAgentStep step type is invalid.");
  }
  return value as AIAgentStepType;
}

function status(value: unknown): AIAgentStepStatus {
  if (typeof value !== "string" || !STATUSES.has(value as AIAgentStepStatus)) {
    invalid("Persisted AIAgentStep status is invalid.");
  }
  return value as AIAgentStepStatus;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIAgentStep ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: string | Date | null, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return timestamp(value, field);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIAgentStep reads require a resolved principal context.");
  }
  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIAgentStep platform reads require trusted platform-global context.");
    }
    return;
  }
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIAgentStep reads require a resolved private context.");
  }
}

function parseRow(row: AIAgentStepRow): PersistedAIAgentStep {
  const inputRef = optionalText(row.input_ref, "input ref");
  const outputRef = optionalText(row.output_ref, "output ref");
  const toolBindingId = optionalUuid(row.tool_binding_id, "tool binding id");
  const approvalId = optionalUuid(row.approval_id, "approval id");
  const auditRef = optionalUuid(row.audit_ref, "audit ref");
  const startedAt = timestamp(row.started_at, "startedAt");
  const completedAt = optionalTimestamp(row.completed_at, "completedAt");

  if (completedAt && Date.parse(completedAt) < Date.parse(startedAt)) {
    invalid("Persisted AIAgentStep completion ordering is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    runId: uuid(row.run_id, "run id"),
    ordinal: nonNegativeInteger(row.ordinal, "ordinal"),
    stepType: stepType(row.step_type),
    ...(inputRef === undefined ? {} : { inputRef }),
    ...(outputRef === undefined ? {} : { outputRef }),
    ...(toolBindingId === undefined ? {} : { toolBindingId }),
    ...(approvalId === undefined ? {} : { approvalId }),
    status: status(row.status),
    startedAt,
    ...(completedAt === undefined ? {} : { completedAt }),
    ...(auditRef === undefined ? {} : { auditRef }),
  });
}

async function readAgentStep(
  transaction: SqlTransaction,
  agentStepId: string,
): Promise<PersistedAIAgentStep | null> {
  const result = await transaction.query<AIAgentStepRow>(
    `SELECT id,
            run_id,
            ordinal,
            step_type::text AS step_type,
            input_ref,
            output_ref,
            tool_binding_id,
            approval_id,
            status::text AS status,
            started_at,
            completed_at,
            audit_ref
       FROM core_ai.agent_step
      WHERE id=$1::uuid`,
    [agentStepId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIAgentStep is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIAgentStepStore implements AIAgentStepReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly agentStepId: string;
  }): Promise<PersistedAIAgentStep | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.agentStepId)) {
      invalid("AIAgentStep id is invalid.");
    }
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readAgentStep(transaction, input.agentStepId),
    );
  }
}
