import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AIPromptTemplateOwnerScope,
  AIPromptTemplateReadPort,
  AIPromptTemplateStatus,
  PersistedAIPromptTemplate,
} from "../../core/ai/prompt-template.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIPromptTemplateRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly version: string | number;
  readonly system_template: string;
  readonly variable_schema_json: unknown;
  readonly grounding_required: boolean;
  readonly allowed_override_fields: unknown;
  readonly status: string;
  readonly created_by: string;
  readonly approved_by: string | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class AIPromptTemplatePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIPromptTemplatePersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set<AIPromptTemplateStatus>([
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ACTIVE",
  "RETIRED",
]);

function invalid(message: string): never {
  throw new AIPromptTemplatePersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIPromptTemplate ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIPromptTemplate ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AIPromptTemplate ${field} is invalid.`);
  }
  return parsed;
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    invalid(`Persisted AIPromptTemplate ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIPromptTemplate ${field} is invalid.`);
  }
  return date.toISOString();
}

function ownerScope(value: string): AIPromptTemplateOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") {
    invalid("Persisted AIPromptTemplate owner scope is invalid.");
  }
  return value;
}

function status(value: string): AIPromptTemplateStatus {
  if (!STATUSES.has(value as AIPromptTemplateStatus)) {
    invalid("Persisted AIPromptTemplate status is invalid.");
  }
  return value as AIPromptTemplateStatus;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AIPromptTemplate variable schema JSON is invalid at ${path}.`);
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
      invalid(`Persisted AIPromptTemplate variable schema JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIPromptTemplate variable schema JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AIPromptTemplate variable schema JSON is invalid at ${path}.`);
}

function stringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    invalid(`Persisted AIPromptTemplate ${field} is invalid.`);
  }
  return Object.freeze([...value]);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIPromptTemplate reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIPromptTemplate platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIPromptTemplate reads require a resolved private context.");
  }
}

function parseRow(row: AIPromptTemplateRow): PersistedAIPromptTemplate {
  const parsedOwnerScope = ownerScope(row.owner_scope);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if ((parsedOwnerScope === "PLATFORM" && (tenantId || industryContextId))
    || (parsedOwnerScope === "TENANT" && (!tenantId || industryContextId))
    || (parsedOwnerScope === "INDUSTRY" && (!tenantId || !industryContextId))) {
    invalid("Persisted AIPromptTemplate ownership shape is invalid.");
  }

  const approvedBy = optionalUuid(row.approved_by, "approvedBy");

  return Object.freeze({
    id: uuid(row.id, "id"),
    ownerScope: parsedOwnerScope,
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    code: textValue(row.code, "code"),
    version: positiveInteger(row.version, "version"),
    systemTemplate: textValue(row.system_template, "systemTemplate"),
    variableSchema: normalizeJson(row.variable_schema_json),
    groundingRequired: booleanValue(row.grounding_required, "groundingRequired"),
    allowedOverrideFields: stringArray(row.allowed_override_fields, "allowedOverrideFields"),
    status: status(row.status),
    createdBy: uuid(row.created_by, "createdBy"),
    ...(approvedBy ? {approvedBy} : {}),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readPromptTemplate(
  transaction: SqlTransaction,
  promptTemplateId: string,
): Promise<PersistedAIPromptTemplate | null> {
  const result = await transaction.query<AIPromptTemplateRow>(
    `SELECT id,
            owner_scope::text,
            tenant_id,
            industry_context_id,
            code,
            version,
            system_template,
            variable_schema_json,
            grounding_required,
            allowed_override_fields,
            status::text,
            created_by,
            approved_by,
            created_at,
            updated_at
       FROM core_ai.prompt_template
      WHERE id=$1::uuid`,
    [promptTemplateId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIPromptTemplate is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIPromptTemplateStore implements AIPromptTemplateReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly promptTemplateId: string;
  }): Promise<PersistedAIPromptTemplate | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.promptTemplateId)) {
      invalid("AIPromptTemplate id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readPromptTemplate(transaction, input.promptTemplateId),
    );
  }
}
