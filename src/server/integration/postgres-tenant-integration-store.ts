import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  IntegrationHealthState,
  PersistedTenantIntegration,
  TenantIntegrationReadPort,
  TenantIntegrationScopeClass,
  TenantIntegrationStatus,
} from "../../core/integration/tenant-integration.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface TenantIntegrationRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly integration_definition_id: string;
  readonly scope_class: string;
  readonly display_name: string;
  readonly status: string;
  readonly credential_reference_id: string;
  readonly config_json_encrypted_or_safe: unknown;
  readonly enabled_capabilities: string[];
  readonly permission_profile_id: string | null;
  readonly health_state: string;
  readonly last_health_at: string | Date | null;
  readonly version: string | number;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class TenantIntegrationPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantIntegrationPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set<TenantIntegrationStatus>([
  "PENDING",
  "ACTIVE",
  "PAUSED",
  "ERROR",
  "REVOKED",
]);

const HEALTH_STATES = new Set<IntegrationHealthState>([
  "UNKNOWN",
  "HEALTHY",
  "DEGRADED",
  "UNAVAILABLE",
  "AUTH_ERROR",
  "RATE_LIMITED",
  "POLICY_BLOCKED",
]);

function invalid(message: string): never {
  throw new TenantIntegrationPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted TenantIntegration ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted TenantIntegration ${field} is invalid.`);
  }
  return value;
}

function stringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted TenantIntegration ${field} is invalid.`);
  }
  return Object.freeze(value.map((entry) => textValue(entry, field)));
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted TenantIntegration ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: string | Date | null, field: string): string | undefined {
  if (value === null) return undefined;
  return timestamp(value, field);
}

function positiveVersion(value: string | number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid("Persisted TenantIntegration version is invalid.");
  }
  return parsed;
}

function scope(value: string): TenantIntegrationScopeClass {
  if (value !== "TENANT_CORE" && value !== "TENANT_INDUSTRY") {
    invalid("Persisted TenantIntegration scope is invalid.");
  }
  return value;
}

function status(value: string): TenantIntegrationStatus {
  if (!STATUSES.has(value as TenantIntegrationStatus)) {
    invalid("Persisted TenantIntegration status is invalid.");
  }
  return value as TenantIntegrationStatus;
}

function health(value: string): IntegrationHealthState {
  if (!HEALTH_STATES.has(value as IntegrationHealthState)) {
    invalid("Persisted TenantIntegration health state is invalid.");
  }
  return value as IntegrationHealthState;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted TenantIntegration JSON is invalid at ${path}.`);
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
      invalid(`Persisted TenantIntegration JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted TenantIntegration JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted TenantIntegration JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || !UUID_PATTERN.test(context.tenantId)
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("TenantIntegration reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: TenantIntegrationRow): PersistedTenantIntegration {
  const parsedScope = scope(row.scope_class);
  const industryContextId = optionalUuid(
    row.industry_context_id,
    "Industry Context id",
  );
  if ((parsedScope === "TENANT_CORE" && industryContextId)
    || (parsedScope === "TENANT_INDUSTRY" && !industryContextId)) {
    invalid("Persisted TenantIntegration ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? {industryContextId} : {}),
    integrationDefinitionId: uuid(
      row.integration_definition_id,
      "IntegrationDefinition id",
    ),
    scopeClass: parsedScope,
    displayName: textValue(row.display_name, "display name"),
    status: status(row.status),
    credentialReferenceId: uuid(
      row.credential_reference_id,
      "CredentialReference id",
    ),
    config: normalizeJson(row.config_json_encrypted_or_safe),
    enabledCapabilities: stringArray(
      row.enabled_capabilities,
      "enabled capabilities",
    ),
    ...(row.permission_profile_id !== null
      ? {permissionProfileId: uuid(row.permission_profile_id, "permission profile id")}
      : {}),
    healthState: health(row.health_state),
    ...(row.last_health_at !== null
      ? {lastHealthAt: optionalTimestamp(row.last_health_at, "lastHealthAt")}
      : {}),
    version: positiveVersion(row.version),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readTenantIntegration(
  transaction: SqlTransaction,
  tenantIntegrationId: string,
): Promise<PersistedTenantIntegration | null> {
  const result = await transaction.query<TenantIntegrationRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            integration_definition_id,
            scope_class,
            display_name,
            status::text,
            credential_reference_id,
            config_json_encrypted_or_safe,
            enabled_capabilities,
            permission_profile_id,
            health_state::text,
            last_health_at,
            version,
            created_at,
            updated_at
       FROM core_integration.tenant_integration
      WHERE id=$1::uuid`,
    [tenantIntegrationId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted TenantIntegration is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresTenantIntegrationStore implements TenantIntegrationReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly tenantIntegrationId: string;
  }): Promise<PersistedTenantIntegration | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.tenantIntegrationId)) {
      invalid("TenantIntegration id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readTenantIntegration(transaction, input.tenantIntegrationId),
    );
  }
}
