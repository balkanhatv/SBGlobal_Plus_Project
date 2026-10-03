import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  BrandAccessibilityValidationStatus,
  BrandConfigurationOwnerScope,
  BrandConfigurationReadPort,
  BrandConfigurationStatus,
  PersistedBrandConfiguration,
} from "../../core/config/brand-configuration.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface BrandConfigurationRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly version: string | number;
  readonly status: string;
  readonly token_json: unknown;
  readonly typography_json: unknown;
  readonly logo_document_id: string | null;
  readonly favicon_document_id: string | null;
  readonly accessibility_validation_status: string;
  readonly created_by: string;
  readonly approved_by: string | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class BrandConfigurationPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrandConfigurationPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set<BrandConfigurationStatus>([
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ACTIVE",
  "RETIRED",
]);
const ACCESSIBILITY_STATUSES = new Set<BrandAccessibilityValidationStatus>([
  "PENDING",
  "PASS",
  "FAIL",
]);

function invalid(message: string): never {
  throw new BrandConfigurationPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted BrandConfiguration ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted BrandConfiguration ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted BrandConfiguration ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted BrandConfiguration ${field} is invalid.`);
  }
  return date.toISOString();
}

function ownerScope(value: string): BrandConfigurationOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") {
    invalid("Persisted BrandConfiguration owner scope is invalid.");
  }
  return value;
}

function status(value: string): BrandConfigurationStatus {
  if (!STATUSES.has(value as BrandConfigurationStatus)) {
    invalid("Persisted BrandConfiguration status is invalid.");
  }
  return value as BrandConfigurationStatus;
}

function accessibilityStatus(value: string): BrandAccessibilityValidationStatus {
  if (!ACCESSIBILITY_STATUSES.has(value as BrandAccessibilityValidationStatus)) {
    invalid("Persisted BrandConfiguration accessibility status is invalid.");
  }
  return value as BrandAccessibilityValidationStatus;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted BrandConfiguration JSON is invalid at ${path}.`);
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
      invalid(`Persisted BrandConfiguration JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted BrandConfiguration JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted BrandConfiguration JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("BrandConfiguration reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE") ||
      context.tenantId ||
      context.industryContextId
    ) {
      invalid("BrandConfiguration platform reads require trusted platform-global context.");
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
    invalid("BrandConfiguration reads require a resolved private context.");
  }
}

function parseRow(row: BrandConfigurationRow): PersistedBrandConfiguration {
  const parsedOwnerScope = ownerScope(row.owner_scope);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if (
    (parsedOwnerScope === "PLATFORM" && (tenantId || industryContextId)) ||
    (parsedOwnerScope === "TENANT" && (!tenantId || industryContextId)) ||
    (parsedOwnerScope === "INDUSTRY" && (!tenantId || !industryContextId))
  ) {
    invalid("Persisted BrandConfiguration ownership shape is invalid.");
  }

  const logoDocumentId = optionalUuid(row.logo_document_id, "logoDocumentId");
  const faviconDocumentId = optionalUuid(row.favicon_document_id, "faviconDocumentId");
  const approvedBy = optionalUuid(row.approved_by, "approvedBy");

  return Object.freeze({
    id: uuid(row.id, "id"),
    ownerScope: parsedOwnerScope,
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    code: textValue(row.code, "code"),
    version: positiveInteger(row.version, "version"),
    status: status(row.status),
    tokens: normalizeJson(row.token_json),
    typography: normalizeJson(row.typography_json),
    ...(logoDocumentId ? {logoDocumentId} : {}),
    ...(faviconDocumentId ? {faviconDocumentId} : {}),
    accessibilityValidationStatus: accessibilityStatus(row.accessibility_validation_status),
    createdBy: uuid(row.created_by, "createdBy"),
    ...(approvedBy ? {approvedBy} : {}),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readBrandConfiguration(
  transaction: SqlTransaction,
  brandConfigurationId: string,
): Promise<PersistedBrandConfiguration | null> {
  const result = await transaction.query<BrandConfigurationRow>(
    `SELECT id,
            owner_scope::text,
            tenant_id,
            industry_context_id,
            code,
            version,
            status::text,
            token_json,
            typography_json,
            logo_document_id,
            favicon_document_id,
            accessibility_validation_status::text,
            created_by,
            approved_by,
            created_at,
            updated_at
       FROM core_config.brand_configuration
      WHERE id=$1::uuid`,
    [brandConfigurationId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted BrandConfiguration is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresBrandConfigurationStore implements BrandConfigurationReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly brandConfigurationId: string;
  }): Promise<PersistedBrandConfiguration | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.brandConfigurationId)) {
      invalid("BrandConfiguration id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readBrandConfiguration(transaction, input.brandConfigurationId),
    );
  }
}
