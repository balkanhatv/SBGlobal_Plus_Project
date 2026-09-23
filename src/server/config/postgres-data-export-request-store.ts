import type { RequestContext } from "../../core/context/contracts.js";
import type {
  DataExportRequestReadPort,
  DataExportRequestScopeClass,
  DataExportRequestStatus,
  DataExportSensitivityClass,
  DataExportType,
  PersistedDataExportRequest,
} from "../../core/config/data-export-request.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface DataExportRequestRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly requester_principal_id: string;
  readonly subject_principal_id: string | null;
  readonly scope_class: string;
  readonly export_type: string;
  readonly requested_resource_classes: unknown;
  readonly residency_policy_version: string;
  readonly sensitivity_ceiling: string;
  readonly status: string;
  readonly approval_ref: string | null;
  readonly document_id: string | null;
  readonly expires_at: string | Date | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class DataExportRequestPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataExportRequestPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXPORT_TYPES = new Set<DataExportType>([
  "DATA_ACCESS",
  "PORTABILITY",
  "TENANT_EXPORT",
  "ADMIN_EXPORT",
]);
const SENSITIVITY_CLASSES = new Set<DataExportSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);
const STATUSES = new Set<DataExportRequestStatus>([
  "REQUESTED",
  "VALIDATING",
  "APPROVAL_REQUIRED",
  "APPROVED",
  "GENERATING",
  "READY",
  "DOWNLOADED",
  "EXPIRED",
  "REJECTED",
  "CANCELLED",
]);

function invalid(message: string): never {
  throw new DataExportRequestPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted DataExportRequest ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted DataExportRequest ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted DataExportRequest ${field} is invalid.`);
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

function scopeClass(value: string): DataExportRequestScopeClass {
  if (value !== "TENANT_CORE" && value !== "TENANT_INDUSTRY") {
    invalid("Persisted DataExportRequest scope class is invalid.");
  }
  return value;
}

function exportType(value: string): DataExportType {
  if (!EXPORT_TYPES.has(value as DataExportType)) {
    invalid("Persisted DataExportRequest export type is invalid.");
  }
  return value as DataExportType;
}

function sensitivity(value: string): DataExportSensitivityClass {
  if (!SENSITIVITY_CLASSES.has(value as DataExportSensitivityClass)) {
    invalid("Persisted DataExportRequest sensitivity ceiling is invalid.");
  }
  return value as DataExportSensitivityClass;
}

function status(value: string): DataExportRequestStatus {
  if (!STATUSES.has(value as DataExportRequestStatus)) {
    invalid("Persisted DataExportRequest status is invalid.");
  }
  return value as DataExportRequestStatus;
}

function rawTextArray(value: unknown, field: string): readonly (string | null)[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted DataExportRequest ${field} is invalid.`);
  }
  return Object.freeze(value.map((entry) => {
    if (entry !== null && typeof entry !== "string") {
      invalid(`Persisted DataExportRequest ${field} is invalid.`);
    }
    return entry;
  }));
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("DataExportRequest reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE") ||
      context.tenantId ||
      context.industryContextId
    ) {
      invalid("DataExportRequest platform reads require trusted platform-global context.");
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
    invalid("DataExportRequest reads require a resolved private context.");
  }
}

function parseRow(row: DataExportRequestRow): PersistedDataExportRequest {
  const parsedScope = scopeClass(row.scope_class);
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if (
    (parsedScope === "TENANT_CORE" && industryContextId) ||
    (parsedScope === "TENANT_INDUSTRY" && !industryContextId)
  ) {
    invalid("Persisted DataExportRequest ownership shape is invalid.");
  }

  const subjectPrincipalId = optionalUuid(row.subject_principal_id, "subjectPrincipalId");
  const approvalRef = optionalText(row.approval_ref, "approvalRef");
  const documentId = optionalUuid(row.document_id, "documentId");
  const expiresAt = optionalTimestamp(row.expires_at, "expiresAt");

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? {industryContextId} : {}),
    requesterPrincipalId: uuid(row.requester_principal_id, "requesterPrincipalId"),
    ...(subjectPrincipalId ? {subjectPrincipalId} : {}),
    scopeClass: parsedScope,
    exportType: exportType(row.export_type),
    requestedResourceClasses: rawTextArray(
      row.requested_resource_classes,
      "requestedResourceClasses",
    ),
    residencyPolicyVersion: textValue(row.residency_policy_version, "residencyPolicyVersion"),
    sensitivityCeiling: sensitivity(row.sensitivity_ceiling),
    status: status(row.status),
    ...(approvalRef !== undefined ? {approvalRef} : {}),
    ...(documentId ? {documentId} : {}),
    ...(expiresAt ? {expiresAt} : {}),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readDataExportRequest(
  transaction: SqlTransaction,
  exportRequestId: string,
): Promise<PersistedDataExportRequest | null> {
  const result = await transaction.query<DataExportRequestRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            requester_principal_id,
            subject_principal_id,
            scope_class,
            export_type::text,
            requested_resource_classes,
            residency_policy_version,
            sensitivity_ceiling,
            status::text,
            approval_ref,
            document_id,
            expires_at,
            created_at,
            updated_at
       FROM core_config.data_export_request
      WHERE id=$1::uuid`,
    [exportRequestId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted DataExportRequest is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresDataExportRequestStore implements DataExportRequestReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly exportRequestId: string;
  }): Promise<PersistedDataExportRequest | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.exportRequestId)) {
      invalid("DataExportRequest id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readDataExportRequest(transaction, input.exportRequestId),
    );
  }
}
