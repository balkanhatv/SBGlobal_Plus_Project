import type { RequestContext } from "../../core/context/contracts.js";
import type {
  DocumentDerivativeCurrentEvidence,
  DocumentDerivativeParentCurrentEvidenceReadPort,
  DocumentDerivativeParentEvidence,
  DocumentDerivativeParentRelationshipEvidence,
} from "../../core/document/derivative-parent-current-evidence-reader.js";
import type {
  DocumentScopeClass,
  DocumentSensitivityClass,
  DocumentStatus,
  DocumentVirusScanStatus,
} from "../../core/document/access-candidate.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface DerivativeParentRow {
  readonly derivative_id: string;
  readonly derivative_tenant_id: string;
  readonly derivative_industry_context_id: string | null;
  readonly derivative_scope_class: string;
  readonly derivative_parent_document_id: string;
  readonly derivative_type: string;
  readonly derivative_sensitivity_class: string;
  readonly derivative_residency_region: string;
  readonly derivative_status: string;
  readonly derivative_virus_scan_status: string;
  readonly parent_id: string;
  readonly parent_tenant_id: string;
  readonly parent_industry_context_id: string | null;
  readonly parent_scope_class: string;
  readonly parent_sensitivity_class: string;
  readonly parent_residency_region: string;
  readonly parent_status: string;
  readonly parent_virus_scan_status: string;
}

export class DocumentDerivativeParentPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentDerivativeParentPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SENSITIVITY = new Set<DocumentSensitivityClass>([
  "PUBLIC","INTERNAL","CONFIDENTIAL","SENSITIVE_PERSONAL","REGULATED",
]);
const STATUS = new Set<DocumentStatus>([
  "UPLOADING","SCANNING","ACTIVE","QUARANTINED","REJECTED","DELETED","PURGED",
]);
const VIRUS = new Set<DocumentVirusScanStatus>([
  "PENDING","CLEAN","INFECTED","ERROR",
]);

function invalid(message: string): never {
  throw new DocumentDerivativeParentPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted Document derivative ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted Document derivative ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function scope(value: string): DocumentScopeClass {
  if (value !== "TENANT_CORE" && value !== "TENANT_INDUSTRY") {
    invalid("Persisted Document derivative scope class is invalid.");
  }
  return value;
}

function sensitivity(value: string): DocumentSensitivityClass {
  if (!SENSITIVITY.has(value as DocumentSensitivityClass)) {
    invalid("Persisted Document derivative sensitivity is invalid.");
  }
  return value as DocumentSensitivityClass;
}

function status(value: string): DocumentStatus {
  if (!STATUS.has(value as DocumentStatus)) {
    invalid("Persisted Document derivative status is invalid.");
  }
  return value as DocumentStatus;
}

function virus(value: string): DocumentVirusScanStatus {
  if (!VIRUS.has(value as DocumentVirusScanStatus)) {
    invalid("Persisted Document derivative virus status is invalid.");
  }
  return value as DocumentVirusScanStatus;
}

function assertContext(context: RequestContext): void {
  if (
    (context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || !UUID_PATTERN.test(context.tenantId)
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (
      context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId))
    )
  ) {
    invalid("Document derivative read requires a resolved single-Tenant context.");
  }
}

function parseDerivative(row: DerivativeParentRow): DocumentDerivativeCurrentEvidence {
  const parsedScope = scope(row.derivative_scope_class);
  const industryContextId = optionalUuid(
    row.derivative_industry_context_id,
    "Industry Context",
  );
  if (
    (parsedScope === "TENANT_CORE" && industryContextId !== undefined)
    || (parsedScope === "TENANT_INDUSTRY" && industryContextId === undefined)
  ) {
    invalid("Persisted Document derivative ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.derivative_id, "id"),
    tenantId: uuid(row.derivative_tenant_id, "Tenant id"),
    ...(industryContextId !== undefined ? { industryContextId } : {}),
    scopeClass: parsedScope,
    parentDocumentId: uuid(row.derivative_parent_document_id, "parent id"),
    derivativeType: textValue(row.derivative_type, "type"),
    sensitivityClass: sensitivity(row.derivative_sensitivity_class),
    residencyRegion: textValue(row.derivative_residency_region, "residency region"),
    status: status(row.derivative_status),
    virusScanStatus: virus(row.derivative_virus_scan_status),
  });
}

function parseParent(row: DerivativeParentRow): DocumentDerivativeParentEvidence {
  const parsedScope = scope(row.parent_scope_class);
  const industryContextId = optionalUuid(
    row.parent_industry_context_id,
    "parent Industry Context",
  );
  if (
    (parsedScope === "TENANT_CORE" && industryContextId !== undefined)
    || (parsedScope === "TENANT_INDUSTRY" && industryContextId === undefined)
  ) {
    invalid("Persisted Document parent ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.parent_id, "parent id"),
    tenantId: uuid(row.parent_tenant_id, "parent Tenant id"),
    ...(industryContextId !== undefined ? { industryContextId } : {}),
    scopeClass: parsedScope,
    sensitivityClass: sensitivity(row.parent_sensitivity_class),
    residencyRegion: textValue(row.parent_residency_region, "parent residency region"),
    status: status(row.parent_status),
    virusScanStatus: virus(row.parent_virus_scan_status),
  });
}

async function loadRelationship(
  transaction: SqlTransaction,
  derivativeDocumentId: string,
  parentDocumentId: string,
): Promise<DocumentDerivativeParentRelationshipEvidence | null> {
  const result = await transaction.query<DerivativeParentRow>(
    `SELECT derivative.id AS derivative_id,
            derivative.tenant_id AS derivative_tenant_id,
            derivative.industry_context_id AS derivative_industry_context_id,
            derivative.scope_class AS derivative_scope_class,
            derivative.parent_document_id AS derivative_parent_document_id,
            derivative.derivative_type AS derivative_type,
            derivative.sensitivity_class AS derivative_sensitivity_class,
            derivative.residency_region AS derivative_residency_region,
            derivative.status::text AS derivative_status,
            derivative.virus_scan_status::text AS derivative_virus_scan_status,
            parent.id AS parent_id,
            parent.tenant_id AS parent_tenant_id,
            parent.industry_context_id AS parent_industry_context_id,
            parent.scope_class AS parent_scope_class,
            parent.sensitivity_class AS parent_sensitivity_class,
            parent.residency_region AS parent_residency_region,
            parent.status::text AS parent_status,
            parent.virus_scan_status::text AS parent_virus_scan_status
       FROM core_document.document_meta derivative
       JOIN core_document.document_meta parent
         ON parent.id=derivative.parent_document_id
      WHERE derivative.id=$1::uuid
        AND parent.id=$2::uuid`,
    [derivativeDocumentId, parentDocumentId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Document derivative-parent relationship is ambiguous.");
  }

  return Object.freeze({
    derivative: parseDerivative(result.rows[0]),
    parent: parseParent(result.rows[0]),
  });
}

export class PostgresDocumentDerivativeParentCurrentEvidenceStore
implements DocumentDerivativeParentCurrentEvidenceReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async load(input: {
    readonly requestContext: RequestContext;
    readonly derivativeDocumentId: string;
    readonly parentDocumentId: string;
  }): Promise<DocumentDerivativeParentRelationshipEvidence | null> {
    assertContext(input.requestContext);
    if (
      !UUID_PATTERN.test(input.derivativeDocumentId)
      || !UUID_PATTERN.test(input.parentDocumentId)
    ) {
      invalid("Document derivative relationship identifiers are invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => loadRelationship(
        transaction,
        input.derivativeDocumentId,
        input.parentDocumentId,
      ),
    );
  }
}
