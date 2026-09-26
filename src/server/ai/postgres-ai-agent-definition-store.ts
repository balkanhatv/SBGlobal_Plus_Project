import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AIAgentDefinitionOwnerScope,
  AIAgentDefinitionReadPort,
  PersistedAIAgentDefinition,
} from "../../core/ai/agent-definition.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIAgentDefinitionRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly objective_class: string;
  readonly allowed_tool_set_id: string;
  readonly max_risk_class: string;
  readonly approval_policy_id: string;
  readonly budget_policy_id: string;
  readonly version: string | number;
  readonly status: string;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class AIAgentDefinitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIAgentDefinitionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AIAgentDefinitionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIAgentDefinition ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIAgentDefinition ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AIAgentDefinition ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIAgentDefinition ${field} is invalid.`);
  }
  return date.toISOString();
}

function ownerScope(value: string): AIAgentDefinitionOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") {
    invalid("Persisted AIAgentDefinition owner scope is invalid.");
  }
  return value;
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIAgentDefinition reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIAgentDefinition platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIAgentDefinition reads require a resolved private context.");
  }
}

function parseRow(row: AIAgentDefinitionRow): PersistedAIAgentDefinition {
  const parsedOwnerScope = ownerScope(row.owner_scope);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if ((parsedOwnerScope === "PLATFORM" && (tenantId || industryContextId))
    || (parsedOwnerScope === "TENANT" && (!tenantId || industryContextId))
    || (parsedOwnerScope === "INDUSTRY" && (!tenantId || !industryContextId))) {
    invalid("Persisted AIAgentDefinition ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    ownerScope: parsedOwnerScope,
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    code: textValue(row.code, "code"),
    objectiveClass: textValue(row.objective_class, "objectiveClass"),
    allowedToolSetId: uuid(row.allowed_tool_set_id, "allowed ToolSet id"),
    maxRiskClass: textValue(row.max_risk_class, "maxRiskClass"),
    approvalPolicyId: uuid(row.approval_policy_id, "approval policy id"),
    budgetPolicyId: uuid(row.budget_policy_id, "budget policy id"),
    version: positiveInteger(row.version, "version"),
    status: textValue(row.status, "status"),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readAgentDefinition(
  transaction: SqlTransaction,
  agentDefinitionId: string,
): Promise<PersistedAIAgentDefinition | null> {
  const result = await transaction.query<AIAgentDefinitionRow>(
    `SELECT id,
            owner_scope::text,
            tenant_id,
            industry_context_id,
            code,
            objective_class,
            allowed_tool_set_id,
            max_risk_class,
            approval_policy_id,
            budget_policy_id,
            version,
            status,
            created_at,
            updated_at
       FROM core_ai.agent_definition
      WHERE id=$1::uuid`,
    [agentDefinitionId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIAgentDefinition is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIAgentDefinitionStore implements AIAgentDefinitionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly agentDefinitionId: string;
  }): Promise<PersistedAIAgentDefinition | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.agentDefinitionId)) {
      invalid("AIAgentDefinition id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readAgentDefinition(transaction, input.agentDefinitionId),
    );
  }
}
