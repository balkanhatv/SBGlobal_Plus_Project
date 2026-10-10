import type { JsonValue } from "../../core/api/schema-registry.js";
import type { AIMessageReadPort, PersistedAIMessage } from "../../core/ai/message.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIMessageRow {
  readonly id: string;
  readonly conversation_id: string;
  readonly role: string;
  readonly content_ref_or_encrypted_content: string;
  readonly source_refs_json: unknown | null;
  readonly model_route_id: string | null;
  readonly created_at: string | Date;
  readonly deleted_at: string | Date | null;
}

export class AIMessagePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIMessagePersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AIMessagePersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIMessage ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIMessage ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIMessage ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: string | Date | null, field: string): string | undefined {
  if (value === null) return undefined;
  return timestamp(value, field);
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AIMessage source JSON is invalid at ${path}.`);
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
      invalid(`Persisted AIMessage source JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIMessage source JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AIMessage source JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIMessage reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId
      || context.industryContextId
    ) {
      invalid("AIMessage platform reads require trusted platform-global context.");
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
    invalid("AIMessage reads require a resolved private context.");
  }
}

function parseRow(row: AIMessageRow): PersistedAIMessage {
  const sourceRefs = row.source_refs_json === null
    ? undefined
    : normalizeJson(row.source_refs_json);
  const modelRouteId = optionalUuid(row.model_route_id, "model route id");
  const deletedAt = optionalTimestamp(row.deleted_at, "deletedAt");

  return Object.freeze({
    id: uuid(row.id, "id"),
    conversationId: uuid(row.conversation_id, "Conversation id"),
    role: rawText(row.role, "role"),
    contentRefOrEncryptedContent: rawText(
      row.content_ref_or_encrypted_content,
      "content ref or encrypted content",
    ),
    ...(sourceRefs === undefined ? {} : { sourceRefs }),
    ...(modelRouteId === undefined ? {} : { modelRouteId }),
    createdAt: timestamp(row.created_at, "createdAt"),
    ...(deletedAt === undefined ? {} : { deletedAt }),
  });
}

async function readMessage(
  transaction: SqlTransaction,
  messageId: string,
): Promise<PersistedAIMessage | null> {
  const result = await transaction.query<AIMessageRow>(
    `SELECT id,
            conversation_id,
            role,
            content_ref_or_encrypted_content,
            source_refs_json,
            model_route_id,
            created_at,
            deleted_at
       FROM core_ai.ai_message
      WHERE id=$1::uuid`,
    [messageId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIMessage is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIMessageStore implements AIMessageReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly messageId: string;
  }): Promise<PersistedAIMessage | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.messageId)) {
      invalid("AIMessage id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readMessage(transaction, input.messageId),
    );
  }
}
