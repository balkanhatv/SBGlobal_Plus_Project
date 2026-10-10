import type {
  AIToolDefinitionCatalogMetadata,
  AIToolDefinitionCatalogMetadataReadPort,
  AIToolDefinitionScopeClass,
  AIToolSideEffectClass,
} from "../../core/ai/tool-definition-catalog-metadata.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface AIToolDefinitionCatalogMetadataRow {
  readonly id: string;
  readonly tool_id: string;
  readonly capability_code: string;
  readonly operation_contract_id: string;
  readonly scope_class: string;
  readonly required_permission: string;
  readonly required_entitlement: string | null;
  readonly input_schema_version: string | number;
  readonly output_schema_version: string | number;
  readonly side_effect_class: string;
  readonly approval_policy_id: string | null;
  readonly idempotency_required: boolean;
  readonly audit_class: string;
  readonly status: string;
  readonly version: string | number;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class AIToolDefinitionCatalogPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIToolDefinitionCatalogPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TOOL_SCOPE_CLASSES = new Set<AIToolDefinitionScopeClass>([
  "PLATFORM_GLOBAL",
  "TENANT_CORE",
  "TENANT_INDUSTRY",
  "EXPLICIT_CROSS_CONTEXT",
]);

const SIDE_EFFECT_CLASSES = new Set<AIToolSideEffectClass>([
  "NONE",
  "LOW",
  "CONTROLLED",
  "HIGH",
]);

function invalid(message: string): never {
  throw new AIToolDefinitionCatalogPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIToolDefinition ${field} is invalid.`);
  }
  return value;
}

function nullableUuid(value: unknown, field: string): string | null {
  if (value === null) return null;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIToolDefinition ${field} is invalid.`);
  }
  return value;
}

function nullableText(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== "string") {
    invalid(`Persisted AIToolDefinition ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AIToolDefinition ${field} is invalid.`);
  }
  return parsed;
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    invalid(`Persisted AIToolDefinition ${field} is invalid.`);
  }
  return value;
}

function toolScopeClass(value: unknown): AIToolDefinitionScopeClass {
  if (typeof value !== "string" || !TOOL_SCOPE_CLASSES.has(value as AIToolDefinitionScopeClass)) {
    invalid("Persisted AIToolDefinition scope class is invalid.");
  }
  return value as AIToolDefinitionScopeClass;
}

function sideEffectClass(value: unknown): AIToolSideEffectClass {
  if (typeof value !== "string" || !SIDE_EFFECT_CLASSES.has(value as AIToolSideEffectClass)) {
    invalid("Persisted AIToolDefinition side effect class is invalid.");
  }
  return value as AIToolSideEffectClass;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIToolDefinition ${field} is invalid.`);
  }
  return date.toISOString();
}

function parseRow(row: AIToolDefinitionCatalogMetadataRow): AIToolDefinitionCatalogMetadata {
  return Object.freeze({
    id: uuid(row.id, "id"),
    toolId: textValue(row.tool_id, "tool id"),
    capabilityCode: textValue(row.capability_code, "capability code"),
    operationContractId: textValue(row.operation_contract_id, "operation contract id"),
    scopeClass: toolScopeClass(row.scope_class),
    requiredPermission: textValue(row.required_permission, "required permission"),
    requiredEntitlement: nullableText(row.required_entitlement, "required entitlement"),
    inputSchemaVersion: positiveInteger(row.input_schema_version, "input schema version"),
    outputSchemaVersion: positiveInteger(row.output_schema_version, "output schema version"),
    sideEffectClass: sideEffectClass(row.side_effect_class),
    approvalPolicyId: nullableUuid(row.approval_policy_id, "approval policy id"),
    idempotencyRequired: booleanValue(row.idempotency_required, "idempotency required"),
    auditClass: textValue(row.audit_class, "audit class"),
    status: textValue(row.status, "status"),
    version: positiveInteger(row.version, "version"),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readById(
  transaction: SqlTransaction,
  id: string,
): Promise<AIToolDefinitionCatalogMetadata | null> {
  const result = await transaction.query<AIToolDefinitionCatalogMetadataRow>(
    `SELECT id,
            tool_id,
            capability_code,
            operation_contract_id,
            scope_class,
            required_permission,
            required_entitlement,
            input_schema_version,
            output_schema_version,
            side_effect_class,
            approval_policy_id,
            idempotency_required,
            audit_class,
            status,
            version,
            created_at,
            updated_at
       FROM core_ai.ai_tool_definition
      WHERE id=$1::uuid`,
    [id],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIToolDefinition is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIToolDefinitionCatalogMetadataStore
implements AIToolDefinitionCatalogMetadataReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadById(id: string): Promise<AIToolDefinitionCatalogMetadata | null> {
    if (!UUID_PATTERN.test(id)) {
      invalid("AIToolDefinition id is invalid.");
    }
    return this.database.transaction((transaction) => readById(transaction, id));
  }
}
