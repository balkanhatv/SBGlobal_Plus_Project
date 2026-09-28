import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AIAssistantDefinitionOwnerScope,
  AIAssistantDefinitionReadPort,
  PersistedAIAssistantDefinition,
} from "../../core/ai/assistant-definition.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIAssistantDefinitionRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly allowed_capabilities: unknown;
  readonly rag_scope_rules: unknown;
  readonly prompt_template_id: string;
  readonly tool_set_id: string | null;
  readonly model_policy_id: string | null;
  readonly retention_policy_id: string;
  readonly version: string | number;
  readonly status: string;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class AIAssistantDefinitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIAssistantDefinitionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AIAssistantDefinitionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIAssistantDefinition ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIAssistantDefinition ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AIAssistantDefinition ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIAssistantDefinition ${field} is invalid.`);
  }
  return date.toISOString();
}

function ownerScope(value: string): AIAssistantDefinitionOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") {
    invalid("Persisted AIAssistantDefinition owner scope is invalid.");
  }
  return value;
}

function stringSet(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    invalid(`Persisted AIAssistantDefinition ${field} is invalid.`);
  }
  if (new Set(value).size !== value.length) {
    invalid(`Persisted AIAssistantDefinition ${field} is not a set.`);
  }
  return Object.freeze([...value]);
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AIAssistantDefinition RAG scope JSON is invalid at ${path}.`);
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
      invalid(`Persisted AIAssistantDefinition RAG scope JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIAssistantDefinition RAG scope JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AIAssistantDefinition RAG scope JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIAssistantDefinition reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIAssistantDefinition platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIAssistantDefinition reads require a resolved private context.");
  }
}

function parseRow(row: AIAssistantDefinitionRow): PersistedAIAssistantDefinition {
  const parsedOwnerScope = ownerScope(row.owner_scope);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if ((parsedOwnerScope === "PLATFORM" && (tenantId || industryContextId))
    || (parsedOwnerScope === "TENANT" && (!tenantId || industryContextId))
    || (parsedOwnerScope === "INDUSTRY" && (!tenantId || !industryContextId))) {
    invalid("Persisted AIAssistantDefinition ownership shape is invalid.");
  }

  const toolSetId = optionalUuid(row.tool_set_id, "ToolSet id");
  const modelPolicyId = optionalUuid(row.model_policy_id, "model policy id");

  return Object.freeze({
    id: uuid(row.id, "id"),
    ownerScope: parsedOwnerScope,
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    code: textValue(row.code, "code"),
    allowedCapabilities: stringSet(row.allowed_capabilities, "allowedCapabilities"),
    ragScopeRules: normalizeJson(row.rag_scope_rules),
    promptTemplateId: uuid(row.prompt_template_id, "PromptTemplate id"),
    ...(toolSetId ? {toolSetId} : {}),
    ...(modelPolicyId ? {modelPolicyId} : {}),
    retentionPolicyId: uuid(row.retention_policy_id, "retention policy id"),
    version: positiveInteger(row.version, "version"),
    status: textValue(row.status, "status"),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readAssistantDefinition(
  transaction: SqlTransaction,
  assistantDefinitionId: string,
): Promise<PersistedAIAssistantDefinition | null> {
  const result = await transaction.query<AIAssistantDefinitionRow>(
    `SELECT id,
            owner_scope::text,
            tenant_id,
            industry_context_id,
            code,
            allowed_capabilities,
            rag_scope_rules,
            prompt_template_id,
            tool_set_id,
            model_policy_id,
            retention_policy_id,
            version,
            status,
            created_at,
            updated_at
       FROM core_ai.assistant_definition
      WHERE id=$1::uuid`,
    [assistantDefinitionId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIAssistantDefinition is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIAssistantDefinitionStore implements AIAssistantDefinitionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly assistantDefinitionId: string;
  }): Promise<PersistedAIAssistantDefinition | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.assistantDefinitionId)) {
      invalid("AIAssistantDefinition id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readAssistantDefinition(transaction, input.assistantDefinitionId),
    );
  }
}
