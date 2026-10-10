import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AuditEventOutcome,
  AuditEventReadPort,
  AuditEventScopeClass,
  AuditEventSensitivityClass,
  PersistedAuditEvent,
} from "../../core/audit/audit-event.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AuditEventRow {
  readonly id: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly source_industry_context_id: string | null;
  readonly target_industry_context_id: string | null;
  readonly scope_class: string;
  readonly occurred_at: string | Date;
  readonly actor_principal_id: string | null;
  readonly actor_type: string;
  readonly action_code: string;
  readonly resource_type: string | null;
  readonly resource_id: string | null;
  readonly outcome: string;
  readonly reason_code: string | null;
  readonly permission_code: string | null;
  readonly access_decision_id: string | null;
  readonly source_module: string;
  readonly correlation_id: string;
  readonly causation_id: string | null;
  readonly request_id: string | null;
  readonly data_home_id: string | null;
  readonly region_code: string | null;
  readonly sensitivity_class: string;
  readonly evidence_json: unknown;
  readonly schema_version: string | number;
}

export class AuditEventPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditEventPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SCOPES = new Set<AuditEventScopeClass>([
  "PLATFORM_GLOBAL",
  "TENANT_CORE",
  "TENANT_INDUSTRY",
  "EXPLICIT_CROSS_CONTEXT",
]);

const OUTCOMES = new Set<AuditEventOutcome>([
  "SUCCESS",
  "DENIED",
  "FAILED",
]);

const SENSITIVITY = new Set<AuditEventSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new AuditEventPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AuditEvent ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AuditEvent ${field} is invalid.`);
  }
  return value;
}

function optionalRawText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return rawText(value, field);
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AuditEvent ${field} is invalid.`);
  }
  return date.toISOString();
}

function positiveInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AuditEvent ${field} is invalid.`);
  }
  return parsed;
}

function scope(value: string): AuditEventScopeClass {
  if (!SCOPES.has(value as AuditEventScopeClass)) {
    invalid("Persisted AuditEvent scope is invalid.");
  }
  return value as AuditEventScopeClass;
}

function outcome(value: string): AuditEventOutcome {
  if (!OUTCOMES.has(value as AuditEventOutcome)) {
    invalid("Persisted AuditEvent outcome is invalid.");
  }
  return value as AuditEventOutcome;
}

function sensitivity(value: string): AuditEventSensitivityClass {
  if (!SENSITIVITY.has(value as AuditEventSensitivityClass)) {
    invalid("Persisted AuditEvent sensitivity is invalid.");
  }
  return value as AuditEventSensitivityClass;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AuditEvent evidence is invalid at ${path}.`);
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
      invalid(`Persisted AuditEvent evidence is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AuditEvent evidence is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AuditEvent evidence is invalid at ${path}.`);
}

function parseRow(row: AuditEventRow): PersistedAuditEvent {
  const parsedScope = scope(row.scope_class);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(
    row.industry_context_id,
    "Industry Context id",
  );
  const sourceIndustryContextId = optionalUuid(
    row.source_industry_context_id,
    "source Industry Context id",
  );
  const targetIndustryContextId = optionalUuid(
    row.target_industry_context_id,
    "target Industry Context id",
  );

  const shapeValid =
    (parsedScope === "PLATFORM_GLOBAL" &&
      !tenantId && !industryContextId &&
      !sourceIndustryContextId && !targetIndustryContextId)
    || (parsedScope === "TENANT_CORE" &&
      !!tenantId && !industryContextId &&
      !sourceIndustryContextId && !targetIndustryContextId)
    || (parsedScope === "TENANT_INDUSTRY" &&
      !!tenantId && !!industryContextId &&
      !sourceIndustryContextId && !targetIndustryContextId)
    || (parsedScope === "EXPLICIT_CROSS_CONTEXT" &&
      !!tenantId && !industryContextId &&
      !!sourceIndustryContextId && !!targetIndustryContextId &&
      sourceIndustryContextId !== targetIndustryContextId);

  if (!shapeValid) {
    invalid("Persisted AuditEvent ownership shape is invalid.");
  }

  const actorPrincipalId = optionalUuid(row.actor_principal_id, "actor Principal id");
  const accessDecisionId = optionalUuid(row.access_decision_id, "access Decision id");
  const causationId = optionalUuid(row.causation_id, "causation id");
  const dataHomeId = optionalUuid(row.data_home_id, "Data Home id");

  return Object.freeze({
    id: uuid(row.id, "id"),
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    ...(sourceIndustryContextId ? {sourceIndustryContextId} : {}),
    ...(targetIndustryContextId ? {targetIndustryContextId} : {}),
    scopeClass: parsedScope,
    occurredAt: timestamp(row.occurred_at, "occurredAt"),
    ...(actorPrincipalId ? {actorPrincipalId} : {}),
    actorType: rawText(row.actor_type, "actorType"),
    actionCode: rawText(row.action_code, "actionCode"),
    ...(row.resource_type !== null
      ? {resourceType: rawText(row.resource_type, "resourceType")}
      : {}),
    ...(row.resource_id !== null
      ? {resourceId: rawText(row.resource_id, "resourceId")}
      : {}),
    outcome: outcome(row.outcome),
    ...(row.reason_code !== null
      ? {reasonCode: rawText(row.reason_code, "reasonCode")}
      : {}),
    ...(row.permission_code !== null
      ? {permissionCode: rawText(row.permission_code, "permissionCode")}
      : {}),
    ...(accessDecisionId ? {accessDecisionId} : {}),
    sourceModule: rawText(row.source_module, "sourceModule"),
    correlationId: uuid(row.correlation_id, "correlation id"),
    ...(causationId ? {causationId} : {}),
    ...(row.request_id !== null
      ? {requestId: rawText(row.request_id, "requestId")}
      : {}),
    ...(dataHomeId ? {dataHomeId} : {}),
    ...(row.region_code !== null
      ? {regionCode: rawText(row.region_code, "regionCode")}
      : {}),
    sensitivityClass: sensitivity(row.sensitivity_class),
    evidenceJson: normalizeJson(row.evidence_json),
    schemaVersion: positiveInteger(row.schema_version, "schemaVersion"),
  });
}

async function readAuditEvent(
  transaction: SqlTransaction,
  auditEventId: string,
): Promise<PersistedAuditEvent | null> {
  const result = await transaction.query<AuditEventRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            source_industry_context_id,
            target_industry_context_id,
            scope_class,
            occurred_at,
            actor_principal_id,
            actor_type,
            action_code,
            resource_type,
            resource_id,
            outcome::text,
            reason_code,
            permission_code,
            access_decision_id,
            source_module,
            correlation_id,
            causation_id,
            request_id,
            data_home_id,
            region_code,
            sensitivity_class,
            evidence_json,
            schema_version
       FROM core_audit.audit_event
      WHERE id=$1::uuid`,
    [auditEventId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AuditEvent is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAuditEventStore implements AuditEventReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly auditEventId: string;
  }): Promise<PersistedAuditEvent | null> {
    if (!UUID_PATTERN.test(input.auditEventId)) {
      invalid("AuditEvent id is invalid.");
    }
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readAuditEvent(transaction, input.auditEventId),
    );
  }
}
