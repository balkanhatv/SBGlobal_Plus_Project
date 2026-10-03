import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  OrgUnitIndustryReadPort,
  OrgUnitIndustryStatus,
  PersistedOrgUnitIndustry,
} from "../../core/tenancy/org-unit-industry.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface OrgUnitIndustryRow {
  readonly tenant_id: string;
  readonly org_unit_id: string;
  readonly industry_context_id: string;
  readonly status: string;
  readonly config_json: unknown;
}

export class OrgUnitIndustryPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrgUnitIndustryPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set<OrgUnitIndustryStatus>([
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]);

function invalid(message: string): never {
  throw new OrgUnitIndustryPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted OrgUnitIndustry ${field} is invalid.`);
  }
  return value;
}

function status(value: string): OrgUnitIndustryStatus {
  if (!STATUSES.has(value as OrgUnitIndustryStatus)) {
    invalid("Persisted OrgUnitIndustry status is invalid.");
  }
  return value as OrgUnitIndustryStatus;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted OrgUnitIndustry config JSON is invalid at ${path}.`);
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
      invalid(`Persisted OrgUnitIndustry config JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted OrgUnitIndustry config JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted OrgUnitIndustry config JSON is invalid at ${path}.`);
}

function assertIndustryContext(context: RequestContext): void {
  if (
    context.scopeClass !== "TENANT_INDUSTRY" ||
    !context.tenantId ||
    !UUID_PATTERN.test(context.tenantId) ||
    !context.industryContextId ||
    !UUID_PATTERN.test(context.industryContextId) ||
    !context.principalId ||
    !UUID_PATTERN.test(context.principalId)
  ) {
    invalid("OrgUnitIndustry reads require a resolved Tenant Industry context.");
  }
}

function parseRow(row: OrgUnitIndustryRow): PersistedOrgUnitIndustry {
  return Object.freeze({
    tenantId: uuid(row.tenant_id, "Tenant id"),
    orgUnitId: uuid(row.org_unit_id, "OrgUnit id"),
    industryContextId: uuid(row.industry_context_id, "Industry Context id"),
    status: status(row.status),
    config: normalizeJson(row.config_json),
  });
}

async function readOrgUnitIndustry(
  transaction: SqlTransaction,
  orgUnitId: string,
): Promise<PersistedOrgUnitIndustry | null> {
  const result = await transaction.query<OrgUnitIndustryRow>(
    `SELECT tenant_id,
            org_unit_id,
            industry_context_id,
            status::text,
            config_json
       FROM core_tenancy.org_unit_industry
      WHERE org_unit_id=$1::uuid`,
    [orgUnitId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted OrgUnitIndustry is ambiguous in the current Industry context.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresOrgUnitIndustryStore implements OrgUnitIndustryReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly orgUnitId: string;
  }): Promise<PersistedOrgUnitIndustry | null> {
    assertIndustryContext(input.requestContext);
    if (!UUID_PATTERN.test(input.orgUnitId)) {
      invalid("OrgUnit id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readOrgUnitIndustry(transaction, input.orgUnitId),
    );
  }
}
