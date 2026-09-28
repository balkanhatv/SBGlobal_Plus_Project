import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  PersistedWorkflowDefinition,
  WorkflowDefinitionOwnerScope,
  WorkflowDefinitionReadPort,
  WorkflowDefinitionStatus,
} from "../../core/workflow/definition.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface WorkflowDefinitionRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly version: string | number;
  readonly status: string;
  readonly schema_version: string | number;
  readonly state_machine_json: unknown;
  readonly approval_policy_json: unknown;
  readonly rule_refs: string[];
  readonly created_by: string;
  readonly approved_by: string | null;
  readonly effective_from: string | Date | null;
  readonly effective_to: string | Date | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class WorkflowDefinitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowDefinitionPersistenceError";
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

function invalid(message: string): never {
  throw new WorkflowDefinitionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted WorkflowDefinition ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted WorkflowDefinition ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted WorkflowDefinition ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted WorkflowDefinition ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(
  value: string | Date | null,
  field: string,
): string | undefined {
  if (value === null) return undefined;
  return timestamp(value, field);
}

function ownerScope(value: string): WorkflowDefinitionOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") {
    invalid("Persisted WorkflowDefinition owner scope is invalid.");
  }
  return value;
}

function status(value: string): WorkflowDefinitionStatus {
  if (!STATUSES.has(value as WorkflowDefinitionStatus)) {
    invalid("Persisted WorkflowDefinition status is invalid.");
  }
  return value as WorkflowDefinitionStatus;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted WorkflowDefinition JSON is invalid at ${path}.`);
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
      invalid(`Persisted WorkflowDefinition JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted WorkflowDefinition JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted WorkflowDefinition JSON is invalid at ${path}.`);
}

function ruleRefs(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    invalid("Persisted WorkflowDefinition rule refs are invalid.");
  }
  return Object.freeze([...value]);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("WorkflowDefinition reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("WorkflowDefinition platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("WorkflowDefinition reads require a resolved private context.");
  }
}

function parseRow(row: WorkflowDefinitionRow): PersistedWorkflowDefinition {
  const parsedOwnerScope = ownerScope(row.owner_scope);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if ((parsedOwnerScope === "PLATFORM" && (tenantId || industryContextId))
    || (parsedOwnerScope === "TENANT" && (!tenantId || industryContextId))
    || (parsedOwnerScope === "INDUSTRY" && (!tenantId || !industryContextId))) {
    invalid("Persisted WorkflowDefinition ownership shape is invalid.");
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
    stateMachine: normalizeJson(row.state_machine_json),
    approvalPolicy: normalizeJson(row.approval_policy_json),
    ruleRefs: ruleRefs(row.rule_refs),
    createdBy: uuid(row.created_by, "createdBy"),
    ...(row.approved_by !== null
      ? {approvedBy: uuid(row.approved_by, "approvedBy")}
      : {}),
    ...(row.effective_from !== null
      ? {effectiveFrom: optionalTimestamp(row.effective_from, "effectiveFrom")}
      : {}),
    ...(row.effective_to !== null
      ? {effectiveTo: optionalTimestamp(row.effective_to, "effectiveTo")}
      : {}),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readDefinition(
  transaction: SqlTransaction,
  workflowDefinitionId: string,
): Promise<PersistedWorkflowDefinition | null> {
  const result = await transaction.query<WorkflowDefinitionRow>(
    `SELECT id,
            owner_scope::text,
            tenant_id,
            industry_context_id,
            code,
            version,
            status::text,
            schema_version,
            state_machine_json,
            approval_policy_json,
            rule_refs,
            created_by,
            approved_by,
            effective_from,
            effective_to,
            created_at,
            updated_at
       FROM core_workflow.workflow_definition
      WHERE id=$1::uuid`,
    [workflowDefinitionId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted WorkflowDefinition is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresWorkflowDefinitionStore implements WorkflowDefinitionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly workflowDefinitionId: string;
  }): Promise<PersistedWorkflowDefinition | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.workflowDefinitionId)) {
      invalid("WorkflowDefinition id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readDefinition(transaction, input.workflowDefinitionId),
    );
  }
}
