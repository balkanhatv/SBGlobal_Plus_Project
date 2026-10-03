import type {
  AIConversationReadPort,
  AIConversationScopeClass,
  AIConversationSensitivityClass,
  PersistedAIConversation,
} from "../../core/ai/conversation.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIConversationRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly scope_class: string;
  readonly owner_principal_id: string;
  readonly assistant_definition_id: string | null;
  readonly sensitivity_class: string;
  readonly retention_class: string;
  readonly status: string;
  readonly created_at: string | Date;
  readonly last_activity_at: string | Date;
}

export class AIConversationPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConversationPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVITY_CLASSES = new Set<AIConversationSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new AIConversationPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIConversation ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIConversation ${field} is invalid.`);
  }
  return value;
}

function scopeClass(value: unknown): AIConversationScopeClass {
  if (value !== "TENANT_CORE" && value !== "TENANT_INDUSTRY") {
    invalid("Persisted AIConversation scope class is invalid.");
  }
  return value;
}

function sensitivityClass(value: unknown): AIConversationSensitivityClass {
  if (typeof value !== "string" || !SENSITIVITY_CLASSES.has(value as AIConversationSensitivityClass)) {
    invalid("Persisted AIConversation sensitivity class is invalid.");
  }
  return value as AIConversationSensitivityClass;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIConversation ${field} is invalid.`);
  }
  return date.toISOString();
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIConversation reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId
      || context.industryContextId
    ) {
      invalid("AIConversation platform reads require trusted platform-global context.");
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
    invalid("AIConversation reads require a resolved private context.");
  }
}

function parseRow(row: AIConversationRow): PersistedAIConversation {
  const parsedScope = scopeClass(row.scope_class);
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if (
    (parsedScope === "TENANT_CORE" && industryContextId)
    || (parsedScope === "TENANT_INDUSTRY" && !industryContextId)
  ) {
    invalid("Persisted AIConversation scope shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    scopeClass: parsedScope,
    ownerPrincipalId: uuid(row.owner_principal_id, "owner principal id"),
    ...(row.assistant_definition_id === null
      ? {}
      : { assistantDefinitionId: optionalUuid(row.assistant_definition_id, "AssistantDefinition id") }),
    sensitivityClass: sensitivityClass(row.sensitivity_class),
    retentionClass: rawText(row.retention_class, "retention class"),
    status: rawText(row.status, "status"),
    createdAt: timestamp(row.created_at, "createdAt"),
    lastActivityAt: timestamp(row.last_activity_at, "lastActivityAt"),
  });
}

async function readConversation(
  transaction: SqlTransaction,
  conversationId: string,
): Promise<PersistedAIConversation | null> {
  const result = await transaction.query<AIConversationRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            scope_class,
            owner_principal_id,
            assistant_definition_id,
            sensitivity_class,
            retention_class,
            status,
            created_at,
            last_activity_at
       FROM core_ai.ai_conversation
      WHERE id=$1::uuid`,
    [conversationId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIConversation is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIConversationStore implements AIConversationReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly conversationId: string;
  }): Promise<PersistedAIConversation | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.conversationId)) {
      invalid("AIConversation id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readConversation(transaction, input.conversationId),
    );
  }
}
