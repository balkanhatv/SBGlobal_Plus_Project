import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AutomationDefinitionReadPort,
  AutomationTriggerType,
  PersistedAutomationDefinition,
} from "../../core/workflow/automation-definition.js";
import type {
  WorkflowDefinitionOwnerScope,
  WorkflowDefinitionStatus,
} from "../../core/workflow/definition.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AutomationDefinitionRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly version: string | number;
  readonly status: string;
  readonly schema_version: string | number;
  readonly trigger_type: string;
  readonly trigger_config_json: unknown;
  readonly condition_rule_ref: string | null;
  readonly operation_contract_id: string | null;
  readonly workflow_definition_id: string | null;
  readonly config_json: unknown;
  readonly created_by: string;
  readonly approved_by: string | null;
  readonly effective_from: string | Date | null;
  readonly effective_to: string | Date | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class AutomationDefinitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AutomationDefinitionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set<WorkflowDefinitionStatus>([
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ACTIVE",
  "RETIRED",
]);

const TRIGGERS = new Set<AutomationTriggerType>(["EVENT", "SCHEDULE", "MANUAL"]);

function invalid(message: string): never {
  throw new AutomationDefinitionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AutomationDefinition ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AutomationDefinition ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AutomationDefinition ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AutomationDefinition ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: string | Date | null, field: string): string | undefined {
  if (value === null) return undefined;
  return timestamp(value, field);
}

function ownerScope(value: string): WorkflowDefinitionOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") {
    invalid("Persisted AutomationDefinition owner scope is invalid.");
  }
  return value;
}

function status(value: string): WorkflowDefinitionStatus {
  if (!STATUSES.has(value as WorkflowDefinitionStatus)) {
    invalid("Persisted AutomationDefinition status is invalid.");
  }
  return value as WorkflowDefinitionStatus;
}

function triggerType(value: string): AutomationTriggerType {
  if (!TRIGGERS.has(value as AutomationTriggerType)) {
    invalid("Persisted AutomationDefinition trigger type is invalid.");
  }
  return value as AutomationTriggerType;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AutomationDefinition JSON is invalid at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)));
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted AutomationDefinition JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AutomationDefinition JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AutomationDefinition JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AutomationDefinition reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AutomationDefinition platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AutomationDefinition reads require a resolved private context.");
  }
}

function parseRow(row: AutomationDefinitionRow): PersistedAutomationDefinition {
  const parsedOwnerScope = ownerScope(row.owner_scope);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");
  const operationContractId = optionalText(row.operation_contract_id, "OperationContract id");
  const workflowDefinitionId = optionalUuid(row.workflow_definition_id, "WorkflowDefinition id");

  if ((parsedOwnerScope === "PLATFORM" && (tenantId || industryContextId))
    || (parsedOwnerScope === "TENANT" && (!tenantId || industryContextId))
    || (parsedOwnerScope === "INDUSTRY" && (!tenantId || !industryContextId))) {
    invalid("Persisted AutomationDefinition ownership shape is invalid.");
  }
  if (operationContractId === undefined && workflowDefinitionId === undefined) {
    invalid("Persisted AutomationDefinition execution references are invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    ownerScope: parsedOwnerScope,
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    code: textValue(row.code, "code"),
    version: positiveInteger(row.version, "version"),
    status: status(row.status),
    schemaVersion: positiveInteger(row.schema_version, "schema version"),
    triggerType: triggerType(row.trigger_type),
    triggerConfig: normalizeJson(row.trigger_config_json),
    ...(row.condition_rule_ref !== null
      ? {conditionRuleRef: optionalText(row.condition_rule_ref, "condition rule ref")}
      : {}),
    ...(operationContractId !== undefined ? {operationContractId} : {}),
    ...(workflowDefinitionId !== undefined ? {workflowDefinitionId} : {}),
    config: normalizeJson(row.config_json),
    createdBy: uuid(row.created_by, "createdBy"),
    ...(row.approved_by !== null ? {approvedBy: uuid(row.approved_by, "approvedBy")} : {}),
    ...(row.effective_from !== null ? {effectiveFrom: optionalTimestamp(row.effective_from, "effectiveFrom")} : {}),
    ...(row.effective_to !== null ? {effectiveTo: optionalTimestamp(row.effective_to, "effectiveTo")} : {}),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readDefinition(
  transaction: SqlTransaction,
  automationDefinitionId: string,
): Promise<PersistedAutomationDefinition | null> {
  const result = await transaction.query<AutomationDefinitionRow>(
    `SELECT id,
            owner_scope::text,
            tenant_id,
            industry_context_id,
            code,
            version,
            status::text,
            schema_version,
            trigger_type::text,
            trigger_config_json,
            condition_rule_ref,
            operation_contract_id,
            workflow_definition_id,
            config_json,
            created_by,
            approved_by,
            effective_from,
            effective_to,
            created_at,
            updated_at
       FROM core_workflow.automation_definition
      WHERE id=$1::uuid`,
    [automationDefinitionId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AutomationDefinition is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAutomationDefinitionStore implements AutomationDefinitionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly automationDefinitionId: string;
  }): Promise<PersistedAutomationDefinition | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.automationDefinitionId)) {
      invalid("AutomationDefinition id is invalid.");
    }
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readDefinition(transaction, input.automationDefinitionId),
    );
  }
}
