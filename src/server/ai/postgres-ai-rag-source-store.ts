import type {
  AIRAGSourceReadPort,
  AIRAGSourceScopeClass,
  AIRAGSourceSensitivityClass,
  PersistedAIRAGSource,
} from "../../core/ai/rag-source.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIRAGSourceRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly scope_class: string;
  readonly source_module: string;
  readonly management_system_id: string | null;
  readonly resource_type: string;
  readonly resource_id: string;
  readonly document_id: string | null;
  readonly document_version: string | number | null;
  readonly sensitivity_class: string;
  readonly residency_region: string;
  readonly retention_class: string;
  readonly acl_policy_ref: string | null;
  readonly status: string;
  readonly source_version: string;
  readonly chunking_policy_version: string;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class AIRAGSourcePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIRAGSourcePersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POSITIVE_INTEGER_TEXT = /^[1-9]\d*$/;

const SCOPE_CLASSES = new Set<AIRAGSourceScopeClass>([
  "TENANT_CORE",
  "TENANT_INDUSTRY",
]);

const SENSITIVITY_CLASSES = new Set<AIRAGSourceSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new AIRAGSourcePersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIRAGSource ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIRAGSource ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return rawText(value, field);
}

function safeInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    invalid(`Persisted AIRAGSource ${field} is invalid.`);
  }
  return parsed;
}

function optionalSafeInteger(value: unknown, field: string): number | undefined {
  if (value === null || value === undefined) return undefined;
  return safeInteger(value, field);
}

function positiveIntegerText(value: unknown, field: string): string {
  if (typeof value !== "string" || !POSITIVE_INTEGER_TEXT.test(value)) {
    invalid(`Persisted AIRAGSource ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIRAGSource ${field} is invalid.`);
  }
  return date.toISOString();
}

function scopeClass(value: unknown): AIRAGSourceScopeClass {
  if (
    typeof value !== "string"
    || !SCOPE_CLASSES.has(value as AIRAGSourceScopeClass)
  ) {
    invalid("Persisted AIRAGSource scope class is invalid.");
  }
  return value as AIRAGSourceScopeClass;
}

function sensitivityClass(value: unknown): AIRAGSourceSensitivityClass {
  if (
    typeof value !== "string"
    || !SENSITIVITY_CLASSES.has(value as AIRAGSourceSensitivityClass)
  ) {
    invalid("Persisted AIRAGSource sensitivity class is invalid.");
  }
  return value as AIRAGSourceSensitivityClass;
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIRAGSource reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId
      || context.industryContextId
    ) {
      invalid("AIRAGSource platform reads require trusted platform-global context.");
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
    invalid("AIRAGSource reads require a resolved private context.");
  }
}

function parseRow(row: AIRAGSourceRow): PersistedAIRAGSource {
  const parsedScope = scopeClass(row.scope_class);
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");
  const managementSystemId = optionalText(row.management_system_id, "Management System id");
  const documentId = optionalUuid(row.document_id, "Document id");
  const documentVersion = optionalSafeInteger(row.document_version, "Document version");
  const aclPolicyRef = optionalText(row.acl_policy_ref, "ACL policy ref");

  if (
    (parsedScope === "TENANT_CORE" && industryContextId)
    || (parsedScope === "TENANT_INDUSTRY" && !industryContextId)
  ) {
    invalid("Persisted AIRAGSource scope ownership shape is invalid.");
  }

  if ((documentId === undefined) !== (documentVersion === undefined)) {
    invalid("Persisted AIRAGSource document identity/version evidence is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    scopeClass: parsedScope,
    sourceModule: rawText(row.source_module, "source module"),
    ...(managementSystemId === undefined ? {} : { managementSystemId }),
    resourceType: rawText(row.resource_type, "resource type"),
    resourceId: rawText(row.resource_id, "resource id"),
    ...(documentId ? { documentId } : {}),
    ...(documentVersion === undefined ? {} : { documentVersion }),
    sensitivityClass: sensitivityClass(row.sensitivity_class),
    residencyRegion: rawText(row.residency_region, "residency region"),
    retentionClass: rawText(row.retention_class, "retention class"),
    ...(aclPolicyRef === undefined ? {} : { aclPolicyRef }),
    status: rawText(row.status, "status"),
    sourceVersion: positiveIntegerText(row.source_version, "source version"),
    chunkingPolicyVersion: rawText(row.chunking_policy_version, "chunking policy version"),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readRAGSource(
  transaction: SqlTransaction,
  ragSourceId: string,
): Promise<PersistedAIRAGSource | null> {
  const result = await transaction.query<AIRAGSourceRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            scope_class,
            source_module,
            management_system_id,
            resource_type,
            resource_id,
            document_id,
            document_version,
            sensitivity_class,
            residency_region,
            retention_class,
            acl_policy_ref,
            status,
            source_version::text AS source_version,
            chunking_policy_version,
            created_at,
            updated_at
       FROM core_ai.rag_source
      WHERE id=$1::uuid`,
    [ragSourceId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIRAGSource is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIRAGSourceStore implements AIRAGSourceReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly ragSourceId: string;
  }): Promise<PersistedAIRAGSource | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.ragSourceId)) {
      invalid("AIRAGSource id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readRAGSource(transaction, input.ragSourceId),
    );
  }
}
