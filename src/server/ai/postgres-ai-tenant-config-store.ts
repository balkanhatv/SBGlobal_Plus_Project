import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AITenantConfigReadPort,
  AITenantConfigSensitivityClass,
  PersistedAITenantConfig,
} from "../../core/ai/tenant-config.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AITenantConfigRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly enabled: boolean;
  readonly allowed_capabilities: unknown;
  readonly allowed_provider_ids: unknown;
  readonly allowed_model_ids: unknown;
  readonly max_sensitivity_class: string;
  readonly residency_policy_id: string;
  readonly monthly_budget_policy_ref: string | null;
  readonly retention_policy_id: string;
  readonly prompt_override_policy_id: string;
  readonly version: string | number;
  readonly updated_at: string | Date;
}

export class AITenantConfigPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AITenantConfigPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVITY_CLASSES = new Set<AITenantConfigSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new AITenantConfigPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AITenantConfig ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") {
    invalid(`Persisted AITenantConfig ${field} is invalid.`);
  }
  return value;
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    invalid(`Persisted AITenantConfig ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AITenantConfig ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AITenantConfig ${field} is invalid.`);
  }
  return date.toISOString();
}

function sensitivityClass(value: string): AITenantConfigSensitivityClass {
  if (!SENSITIVITY_CLASSES.has(value as AITenantConfigSensitivityClass)) {
    invalid("Persisted AITenantConfig max sensitivity class is invalid.");
  }
  return value as AITenantConfigSensitivityClass;
}

function textArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted AITenantConfig ${field} is invalid.`);
  }
  return Object.freeze(value.map((entry, index) => {
    if (typeof entry !== "string") {
      invalid(`Persisted AITenantConfig ${field}[${index}] is invalid.`);
    }
    return entry;
  }));
}

function uuidArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted AITenantConfig ${field} is invalid.`);
  }
  return Object.freeze(value.map((entry, index) => uuid(entry, `${field}[${index}]`)));
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AITenantConfig reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE") ||
      context.tenantId ||
      context.industryContextId
    ) {
      invalid("AITenantConfig platform reads require trusted platform-global context.");
    }
    return;
  }

  if (
    (context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY") ||
    !context.tenantId ||
    !UUID_PATTERN.test(context.tenantId) ||
    (context.scopeClass === "TENANT_CORE" && context.industryContextId) ||
    (
      context.scopeClass === "TENANT_INDUSTRY" &&
      (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId))
    )
  ) {
    invalid("AITenantConfig reads require a resolved private context.");
  }
}

function parseRow(row: AITenantConfigRow): PersistedAITenantConfig {
  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    enabled: booleanValue(row.enabled, "enabled"),
    allowedCapabilities: textArray(row.allowed_capabilities, "allowed capabilities"),
    allowedProviderIds: uuidArray(row.allowed_provider_ids, "allowed provider ids"),
    allowedModelIds: uuidArray(row.allowed_model_ids, "allowed model ids"),
    maxSensitivityClass: sensitivityClass(row.max_sensitivity_class),
    residencyPolicyId: uuid(row.residency_policy_id, "residency policy id"),
    ...(row.monthly_budget_policy_ref === null
      ? {}
      : { monthlyBudgetPolicyRef: optionalText(row.monthly_budget_policy_ref, "monthly budget policy ref") }),
    retentionPolicyId: uuid(row.retention_policy_id, "retention policy id"),
    promptOverridePolicyId: uuid(row.prompt_override_policy_id, "prompt override policy id"),
    version: positiveInteger(row.version, "version"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readTenantConfig(
  transaction: SqlTransaction,
  tenantConfigId: string,
): Promise<PersistedAITenantConfig | null> {
  const result = await transaction.query<AITenantConfigRow>(
    `SELECT id,
            tenant_id,
            enabled,
            allowed_capabilities,
            allowed_provider_ids,
            allowed_model_ids,
            max_sensitivity_class,
            residency_policy_id,
            monthly_budget_policy_ref,
            retention_policy_id,
            prompt_override_policy_id,
            version,
            updated_at
       FROM core_ai.tenant_ai_config
      WHERE id=$1::uuid`,
    [tenantConfigId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AITenantConfig is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAITenantConfigStore implements AITenantConfigReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly tenantConfigId: string;
  }): Promise<PersistedAITenantConfig | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.tenantConfigId)) {
      invalid("AITenantConfig id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readTenantConfig(transaction, input.tenantConfigId),
    );
  }
}
