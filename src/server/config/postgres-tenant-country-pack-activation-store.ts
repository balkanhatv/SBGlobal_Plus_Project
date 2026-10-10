import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  PersistedTenantCountryPackActivation,
  TenantCountryPackActivationReadPort,
  TenantCountryPackActivationStatus,
} from "../../core/config/tenant-country-pack-activation.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface TenantCountryPackActivationRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly country_pack_id: string;
  readonly status: string;
  readonly config_override_json: unknown;
  readonly activated_at: string | Date | null;
  readonly disabled_at: string | Date | null;
  readonly row_version: string;
}

export class TenantCountryPackActivationPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantCountryPackActivationPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BIGINT_TEXT_PATTERN = /^-?(?:0|[1-9][0-9]*)$/;
const STATUSES = new Set<TenantCountryPackActivationStatus>([
  "PENDING",
  "ACTIVE",
  "DISABLED",
]);

function invalid(message: string): never {
  throw new TenantCountryPackActivationPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted TenantCountryPackActivation ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted TenantCountryPackActivation ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(
  value: string | Date | null | undefined,
  field: string,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  return timestamp(value, field);
}

function status(value: string): TenantCountryPackActivationStatus {
  if (!STATUSES.has(value as TenantCountryPackActivationStatus)) {
    invalid("Persisted TenantCountryPackActivation status is invalid.");
  }
  return value as TenantCountryPackActivationStatus;
}

function bigintText(value: unknown, field: string): string {
  if (typeof value !== "string" || !BIGINT_TEXT_PATTERN.test(value)) {
    invalid(`Persisted TenantCountryPackActivation ${field} is invalid.`);
  }
  return value;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted TenantCountryPackActivation override JSON is invalid at ${path}.`);
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
      invalid(`Persisted TenantCountryPackActivation override JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted TenantCountryPackActivation override JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted TenantCountryPackActivation override JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("TenantCountryPackActivation reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE") ||
      context.tenantId ||
      context.industryContextId
    ) {
      invalid("TenantCountryPackActivation platform reads require trusted platform-global context.");
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
    invalid("TenantCountryPackActivation reads require a resolved private context.");
  }
}

function parseRow(
  row: TenantCountryPackActivationRow,
): PersistedTenantCountryPackActivation {
  const activatedAt = optionalTimestamp(row.activated_at, "activatedAt");
  const disabledAt = optionalTimestamp(row.disabled_at, "disabledAt");

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    countryPackId: uuid(row.country_pack_id, "CountryPack id"),
    status: status(row.status),
    configOverride: normalizeJson(row.config_override_json),
    ...(activatedAt ? {activatedAt} : {}),
    ...(disabledAt ? {disabledAt} : {}),
    rowVersion: bigintText(row.row_version, "rowVersion"),
  });
}

async function readActivation(
  transaction: SqlTransaction,
  activationId: string,
): Promise<PersistedTenantCountryPackActivation | null> {
  const result = await transaction.query<TenantCountryPackActivationRow>(
    `SELECT id,
            tenant_id,
            country_pack_id,
            status::text,
            config_override_json,
            activated_at,
            disabled_at,
            row_version::text
       FROM core_config.tenant_country_pack_activation
      WHERE id=$1::uuid`,
    [activationId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted TenantCountryPackActivation is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresTenantCountryPackActivationStore
implements TenantCountryPackActivationReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly activationId: string;
  }): Promise<PersistedTenantCountryPackActivation | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.activationId)) {
      invalid("TenantCountryPackActivation id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readActivation(transaction, input.activationId),
    );
  }
}
