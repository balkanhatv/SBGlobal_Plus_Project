import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { DocumentSensitivityClass } from "../../core/document/access-candidate.js";
import type {
  DocumentAIGeneratedProvenanceReadPort,
  DocumentAIProvenanceJsonObject,
  PersistedDocumentAIGeneratedProvenance,
} from "../../core/document/ai-generated-provenance.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface DocumentAIGeneratedProvenanceRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly sensitivity_class: string;
  readonly residency_region: string;
  readonly ai_generated: boolean;
  readonly ai_media_request_id: string | null;
  readonly ai_provider_id: string | null;
  readonly ai_model_id: string | null;
  readonly ai_provenance_json: unknown;
  readonly ai_moderation_result_json: unknown;
  readonly ai_licensing_usage_json: unknown;
}

export class DocumentAIGeneratedProvenancePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentAIGeneratedProvenancePersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVITY_CLASSES = new Set<DocumentSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new DocumentAIGeneratedProvenancePersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted Document AI provenance ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted Document AI provenance ${field} is invalid.`);
  }
  return value;
}

function sensitivity(value: unknown): DocumentSensitivityClass {
  if (
    typeof value !== "string"
    || !SENSITIVITY_CLASSES.has(value as DocumentSensitivityClass)
  ) {
    invalid("Persisted Document AI provenance sensitivity is invalid.");
  }
  return value as DocumentSensitivityClass;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted Document AI provenance JSON is invalid at ${path}.`);
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
      invalid(`Persisted Document AI provenance JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted Document AI provenance JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted Document AI provenance JSON is invalid at ${path}.`);
}

function optionalObject(
  value: unknown,
  field: string,
): DocumentAIProvenanceJsonObject | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    invalid(`Persisted Document AI provenance ${field} is invalid.`);
  }
  return normalizeJson(value, field) as DocumentAIProvenanceJsonObject;
}

function assertTenantContext(context: RequestContext): void {
  if (
    (context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || !context.principalId
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (
      context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId))
    )
  ) {
    invalid("Document AI provenance PostgreSQL reads require a resolved single-Tenant context.");
  }
}

function parseRow(
  row: DocumentAIGeneratedProvenanceRow,
): PersistedDocumentAIGeneratedProvenance {
  if (typeof row.ai_generated !== "boolean") {
    invalid("Persisted Document AI provenance generated flag is invalid.");
  }

  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");
  const aiMediaRequestId = optionalUuid(row.ai_media_request_id, "MediaRequest id");
  const aiProviderId = optionalUuid(row.ai_provider_id, "Provider id");
  const aiModelId = optionalUuid(row.ai_model_id, "Model id");
  const aiProvenance = optionalObject(row.ai_provenance_json, "provenance");
  const aiModerationResult = optionalObject(row.ai_moderation_result_json, "moderation result");
  const aiLicensingUsage = optionalObject(row.ai_licensing_usage_json, "licensing usage");

  if (!row.ai_generated) {
    if (
      aiMediaRequestId !== undefined
      || aiProviderId !== undefined
      || aiModelId !== undefined
      || aiProvenance !== undefined
      || aiModerationResult !== undefined
      || aiLicensingUsage !== undefined
    ) {
      invalid("Non-AI Document carries AI provenance evidence.");
    }
  } else if (
    aiMediaRequestId === undefined
    || aiProviderId === undefined
    || aiModelId === undefined
    || aiProvenance === undefined
    || aiModerationResult === undefined
  ) {
    invalid("AI-generated Document provenance evidence is incomplete.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    sensitivityClass: sensitivity(row.sensitivity_class),
    residencyRegion: requiredText(row.residency_region, "residency region"),
    aiGenerated: row.ai_generated,
    ...(aiMediaRequestId ? { aiMediaRequestId } : {}),
    ...(aiProviderId ? { aiProviderId } : {}),
    ...(aiModelId ? { aiModelId } : {}),
    ...(aiProvenance ? { aiProvenance } : {}),
    ...(aiModerationResult ? { aiModerationResult } : {}),
    ...(aiLicensingUsage ? { aiLicensingUsage } : {}),
  });
}

async function readDocumentAIProvenance(
  transaction: SqlTransaction,
  documentId: string,
): Promise<PersistedDocumentAIGeneratedProvenance | null> {
  const result = await transaction.query<DocumentAIGeneratedProvenanceRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            sensitivity_class,
            residency_region,
            ai_generated,
            ai_media_request_id,
            ai_provider_id,
            ai_model_id,
            ai_provenance_json,
            ai_moderation_result_json,
            ai_licensing_usage_json
       FROM core_document.document_meta
      WHERE id=$1::uuid`,
    [documentId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Document AI provenance is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresDocumentAIGeneratedProvenanceStore
implements DocumentAIGeneratedProvenanceReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
  }): Promise<PersistedDocumentAIGeneratedProvenance | null> {
    assertTenantContext(input.requestContext);
    if (!UUID_PATTERN.test(input.documentId)) {
      invalid("Document AI provenance id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readDocumentAIProvenance(transaction, input.documentId),
    );
  }
}
