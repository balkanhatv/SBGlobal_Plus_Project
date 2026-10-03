import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AIPromptSetOwnerScope,
  AIPromptSetReadPort,
  AIPromptSetStatus,
  PersistedAIPromptSet,
} from "../../core/ai/prompt-set.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIPromptSetRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly version: string | number;
  readonly status: string;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class AIPromptSetPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIPromptSetPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set<AIPromptSetStatus>([
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ACTIVE",
  "RETIRED",
]);

function invalid(message: string): never {
  throw new AIPromptSetPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIPromptSet ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIPromptSet ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AIPromptSet ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIPromptSet ${field} is invalid.`);
  }
  return date.toISOString();
}

function ownerScope(value: string): AIPromptSetOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") {
    invalid("Persisted AIPromptSet owner scope is invalid.");
  }
  return value;
}

function status(value: string): AIPromptSetStatus {
  if (!STATUSES.has(value as AIPromptSetStatus)) {
    invalid("Persisted AIPromptSet status is invalid.");
  }
  return value as AIPromptSetStatus;
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIPromptSet reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIPromptSet platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIPromptSet reads require a resolved private context.");
  }
}

function parseRow(row: AIPromptSetRow): PersistedAIPromptSet {
  const parsedOwnerScope = ownerScope(row.owner_scope);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if ((parsedOwnerScope === "PLATFORM" && (tenantId || industryContextId))
    || (parsedOwnerScope === "TENANT" && (!tenantId || industryContextId))
    || (parsedOwnerScope === "INDUSTRY" && (!tenantId || !industryContextId))) {
    invalid("Persisted AIPromptSet ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    ownerScope: parsedOwnerScope,
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    code: textValue(row.code, "code"),
    version: positiveInteger(row.version, "version"),
    status: status(row.status),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readPromptSet(
  transaction: SqlTransaction,
  promptSetId: string,
): Promise<PersistedAIPromptSet | null> {
  const result = await transaction.query<AIPromptSetRow>(
    `SELECT id,
            owner_scope::text,
            tenant_id,
            industry_context_id,
            code,
            version,
            status,
            created_at,
            updated_at
       FROM core_ai.ai_prompt_set
      WHERE id=$1::uuid`,
    [promptSetId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIPromptSet is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIPromptSetStore implements AIPromptSetReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly promptSetId: string;
  }): Promise<PersistedAIPromptSet | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.promptSetId)) {
      invalid("AIPromptSet id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readPromptSet(transaction, input.promptSetId),
    );
  }
}
