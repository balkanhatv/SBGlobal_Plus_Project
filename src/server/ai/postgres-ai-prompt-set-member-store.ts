import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AIPromptSetMemberReadPort,
  PersistedAIPromptSetMember,
} from "../../core/ai/prompt-set-member.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIPromptSetMemberRow {
  readonly id: string;
  readonly prompt_set_id: string;
  readonly prompt_template_id: string;
  readonly priority: string | number;
  readonly enabled: boolean;
  readonly created_at: string | Date;
}

export class AIPromptSetMemberPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIPromptSetMemberPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AIPromptSetMemberPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIPromptSetMember ${field} is invalid.`);
  }
  return value;
}

function integer(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    invalid(`Persisted AIPromptSetMember ${field} is invalid.`);
  }
  return parsed;
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    invalid(`Persisted AIPromptSetMember ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIPromptSetMember ${field} is invalid.`);
  }
  return date.toISOString();
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIPromptSetMember reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIPromptSetMember platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIPromptSetMember reads require a resolved private context.");
  }
}

function parseRow(row: AIPromptSetMemberRow): PersistedAIPromptSetMember {
  return Object.freeze({
    id: uuid(row.id, "id"),
    promptSetId: uuid(row.prompt_set_id, "PromptSet id"),
    promptTemplateId: uuid(row.prompt_template_id, "PromptTemplate id"),
    priority: integer(row.priority, "priority"),
    enabled: booleanValue(row.enabled, "enabled"),
    createdAt: timestamp(row.created_at, "createdAt"),
  });
}

async function readMember(
  transaction: SqlTransaction,
  promptSetMemberId: string,
): Promise<PersistedAIPromptSetMember | null> {
  const result = await transaction.query<AIPromptSetMemberRow>(
    `SELECT id,
            prompt_set_id,
            prompt_template_id,
            priority,
            enabled,
            created_at
       FROM core_ai.ai_prompt_set_member
      WHERE id=$1::uuid`,
    [promptSetMemberId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIPromptSetMember is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIPromptSetMemberStore implements AIPromptSetMemberReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly promptSetMemberId: string;
  }): Promise<PersistedAIPromptSetMember | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.promptSetMemberId)) {
      invalid("AIPromptSetMember id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readMember(transaction, input.promptSetMemberId),
    );
  }
}
