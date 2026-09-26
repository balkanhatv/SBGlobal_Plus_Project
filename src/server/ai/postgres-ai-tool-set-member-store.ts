import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AIToolSetMemberReadPort,
  PersistedAIToolSetMember,
} from "../../core/ai/tool-set-member.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIToolSetMemberRow {
  readonly id: string;
  readonly tool_set_id: string;
  readonly tool_definition_id: string;
  readonly enabled: boolean;
  readonly constraint_json: unknown;
  readonly created_at: string | Date;
}

export class AIToolSetMemberPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIToolSetMemberPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AIToolSetMemberPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIToolSetMember ${field} is invalid.`);
  }
  return value;
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    invalid(`Persisted AIToolSetMember ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIToolSetMember ${field} is invalid.`);
  }
  return date.toISOString();
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AIToolSetMember constraint JSON is invalid at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)),
    );
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted AIToolSetMember constraint JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIToolSetMember constraint JSON is invalid at ${path}.${key}.`);
      }
      Object.defineProperty(normalized, key, {
        value: normalizeJson(entry, `${path}.${key}`),
        enumerable: true,
        configurable: false,
        writable: false,
      });
    }
    return Object.freeze(normalized);
  }
  invalid(`Persisted AIToolSetMember constraint JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIToolSetMember reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIToolSetMember platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIToolSetMember reads require a resolved private context.");
  }
}

function parseRow(row: AIToolSetMemberRow): PersistedAIToolSetMember {
  return Object.freeze({
    id: uuid(row.id, "id"),
    toolSetId: uuid(row.tool_set_id, "ToolSet id"),
    toolDefinitionId: uuid(row.tool_definition_id, "Tool Definition id"),
    enabled: booleanValue(row.enabled, "enabled"),
    constraint: normalizeJson(row.constraint_json),
    createdAt: timestamp(row.created_at, "createdAt"),
  });
}

async function readMember(
  transaction: SqlTransaction,
  toolSetMemberId: string,
): Promise<PersistedAIToolSetMember | null> {
  const result = await transaction.query<AIToolSetMemberRow>(
    `SELECT id,
            tool_set_id,
            tool_definition_id,
            enabled,
            constraint_json,
            created_at
       FROM core_ai.ai_tool_set_member
      WHERE id=$1::uuid`,
    [toolSetMemberId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIToolSetMember is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIToolSetMemberStore implements AIToolSetMemberReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly toolSetMemberId: string;
  }): Promise<PersistedAIToolSetMember | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.toolSetMemberId)) {
      invalid("AIToolSetMember id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readMember(transaction, input.toolSetMemberId),
    );
  }
}
