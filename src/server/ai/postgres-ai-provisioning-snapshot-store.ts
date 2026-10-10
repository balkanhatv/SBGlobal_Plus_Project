import type { JsonObject, JsonValue } from "../../core/api/schema-registry.js";
import type {
  AIProvisioningApiAccessClass,
  AIProvisioningSnapshotReadPort,
  AIProvisioningSnapshotStatus,
  PersistedAIProvisioningSnapshot,
} from "../../core/ai/provisioning-snapshot.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIProvisioningSnapshotRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly version: string;
  readonly subscription_version: string;
  readonly entitlement_snapshot_version: string;
  readonly industry_activation_version: string | null;
  readonly ms_pack_versions: unknown;
  readonly country_pack_versions: unknown;
  readonly tenant_ai_config_version: string;
  readonly allowed_capability_ids: unknown;
  readonly allowed_api_classes: unknown;
  readonly allowed_provider_ids: unknown;
  readonly allowed_model_classes: unknown;
  readonly budget_policy_ref: string | null;
  readonly status: string;
  readonly compiled_at: string | Date;
  readonly valid_until: string | Date | null;
}

export class AIProvisioningSnapshotPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProvisioningSnapshotPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTEGER_TEXT = /^-?\d+$/;
const POSITIVE_INTEGER_TEXT = /^[1-9]\d*$/;

const API_ACCESS_CLASSES = new Set<AIProvisioningApiAccessClass>([
  "INTERNAL_FIRST_PARTY",
  "TENANT_API",
  "PARTNER_API",
  "PUBLIC_DEVELOPER_API",
]);

const STATUSES = new Set<AIProvisioningSnapshotStatus>([
  "ACTIVE",
  "SUPERSEDED",
  "REVOKED",
]);

function invalid(message: string): never {
  throw new AIProvisioningSnapshotPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIProvisioningSnapshot ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function integerText(value: unknown, field: string, positive = false): string {
  if (
    typeof value !== "string"
    || !(positive ? POSITIVE_INTEGER_TEXT : INTEGER_TEXT).test(value)
  ) {
    invalid(`Persisted AIProvisioningSnapshot ${field} is invalid.`);
  }
  return value;
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIProvisioningSnapshot ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return rawText(value, field);
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIProvisioningSnapshot ${field} is invalid.`);
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
      invalid(`Persisted AIProvisioningSnapshot JSON is invalid at ${path}.`);
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
      invalid(`Persisted AIProvisioningSnapshot JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIProvisioningSnapshot JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AIProvisioningSnapshot JSON is invalid at ${path}.`);
}

function jsonObject(value: unknown, field: string): JsonObject {
  const normalized = normalizeJson(value);
  if (
    normalized === null
    || Array.isArray(normalized)
    || typeof normalized !== "object"
  ) {
    invalid(`Persisted AIProvisioningSnapshot ${field} is invalid.`);
  }
  return normalized as JsonObject;
}

function uniqueUuidArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted AIProvisioningSnapshot ${field} is invalid.`);
  }
  const result = value.map((entry) => uuid(entry, field));
  if (new Set(result).size !== result.length) {
    invalid(`Persisted AIProvisioningSnapshot ${field} is invalid.`);
  }
  return Object.freeze(result);
}

function uniqueTextArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted AIProvisioningSnapshot ${field} is invalid.`);
  }
  const result = value.map((entry) => rawText(entry, field));
  if (new Set(result).size !== result.length) {
    invalid(`Persisted AIProvisioningSnapshot ${field} is invalid.`);
  }
  return Object.freeze(result);
}

function apiAccessClasses(value: unknown): readonly AIProvisioningApiAccessClass[] {
  const raw = uniqueTextArray(value, "allowed API classes");
  const result = raw.map((entry) => {
    if (!API_ACCESS_CLASSES.has(entry as AIProvisioningApiAccessClass)) {
      invalid("Persisted AIProvisioningSnapshot allowed API class is invalid.");
    }
    return entry as AIProvisioningApiAccessClass;
  });
  return Object.freeze(result);
}

function status(value: unknown): AIProvisioningSnapshotStatus {
  if (typeof value !== "string" || !STATUSES.has(value as AIProvisioningSnapshotStatus)) {
    invalid("Persisted AIProvisioningSnapshot status is invalid.");
  }
  return value as AIProvisioningSnapshotStatus;
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIProvisioningSnapshot reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId
      || context.industryContextId
    ) {
      invalid("AIProvisioningSnapshot platform reads require trusted platform-global context.");
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
    invalid("AIProvisioningSnapshot reads require a resolved private context.");
  }
}

function parseRow(row: AIProvisioningSnapshotRow): PersistedAIProvisioningSnapshot {
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");
  const industryActivationVersion = row.industry_activation_version === null
    ? undefined
    : integerText(row.industry_activation_version, "Industry activation version");
  const budgetPolicyRef = optionalText(row.budget_policy_ref, "budget policy ref");
  const validUntil = optionalTimestamp(row.valid_until, "validUntil");

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    version: integerText(row.version, "version", true),
    subscriptionVersion: integerText(row.subscription_version, "Subscription version"),
    entitlementSnapshotVersion: integerText(
      row.entitlement_snapshot_version,
      "EntitlementSnapshot version",
    ),
    ...(industryActivationVersion === undefined ? {} : { industryActivationVersion }),
    msPackVersions: jsonObject(row.ms_pack_versions, "MS pack versions"),
    countryPackVersions: jsonObject(row.country_pack_versions, "country pack versions"),
    tenantAiConfigVersion: integerText(row.tenant_ai_config_version, "TenantAIConfig version"),
    allowedCapabilityIds: uniqueUuidArray(row.allowed_capability_ids, "allowed capability ids"),
    allowedApiClasses: apiAccessClasses(row.allowed_api_classes),
    allowedProviderIds: uniqueUuidArray(row.allowed_provider_ids, "allowed provider ids"),
    allowedModelClasses: uniqueTextArray(row.allowed_model_classes, "allowed model classes"),
    ...(budgetPolicyRef === undefined ? {} : { budgetPolicyRef }),
    status: status(row.status),
    compiledAt: timestamp(row.compiled_at, "compiledAt"),
    ...(validUntil === undefined ? {} : { validUntil }),
  });
}

async function readSnapshot(
  transaction: SqlTransaction,
  snapshotId: string,
): Promise<PersistedAIProvisioningSnapshot | null> {
  const result = await transaction.query<AIProvisioningSnapshotRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            version::text AS version,
            subscription_version::text AS subscription_version,
            entitlement_snapshot_version::text AS entitlement_snapshot_version,
            industry_activation_version::text AS industry_activation_version,
            ms_pack_versions,
            country_pack_versions,
            tenant_ai_config_version::text AS tenant_ai_config_version,
            allowed_capability_ids,
            allowed_api_classes,
            allowed_provider_ids,
            allowed_model_classes,
            budget_policy_ref,
            status::text AS status,
            compiled_at,
            valid_until
       FROM core_ai.ai_provisioning_snapshot
      WHERE id=$1::uuid`,
    [snapshotId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIProvisioningSnapshot is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIProvisioningSnapshotStore implements AIProvisioningSnapshotReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly snapshotId: string;
  }): Promise<PersistedAIProvisioningSnapshot | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.snapshotId)) {
      invalid("AIProvisioningSnapshot id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readSnapshot(transaction, input.snapshotId),
    );
  }
}
