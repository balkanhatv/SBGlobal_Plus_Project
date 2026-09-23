import type {
  AIMemoryClass,
  AIMemoryRecordReadPort,
  AIMemorySensitivityClass,
  AIMemoryStatus,
  PersistedAIMemoryRecord,
} from "../../core/ai/memory-record.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIMemoryRecordRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly principal_id: string | null;
  readonly assistant_definition_id: string | null;
  readonly memory_class: string;
  readonly content_ref_or_encrypted_content: string;
  readonly source_ref: string | null;
  readonly sensitivity_class: string;
  readonly retention_class: string;
  readonly acl_policy_ref: string | null;
  readonly status: string;
  readonly created_at: string | Date;
  readonly expires_at: string | Date | null;
  readonly supersedes_id: string | null;
}

export class AIMemoryRecordPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIMemoryRecordPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MEMORY_CLASSES = new Set<AIMemoryClass>([
  "SESSION",
  "USER_PREFERENCE",
  "TENANT_KNOWLEDGE",
  "INDUSTRY_KNOWLEDGE",
  "WORKING_CONTEXT",
]);

const MEMORY_STATUSES = new Set<AIMemoryStatus>([
  "ACTIVE",
  "SUPERSEDED",
  "ERASED",
  "EXPIRED",
]);

const SENSITIVITY_CLASSES = new Set<AIMemorySensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new AIMemoryRecordPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIMemoryRecord ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIMemoryRecord ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return rawText(value, field);
}

function memoryClass(value: unknown): AIMemoryClass {
  if (typeof value !== "string" || !MEMORY_CLASSES.has(value as AIMemoryClass)) {
    invalid("Persisted AIMemoryRecord memory class is invalid.");
  }
  return value as AIMemoryClass;
}

function memoryStatus(value: unknown): AIMemoryStatus {
  if (typeof value !== "string" || !MEMORY_STATUSES.has(value as AIMemoryStatus)) {
    invalid("Persisted AIMemoryRecord status is invalid.");
  }
  return value as AIMemoryStatus;
}

function sensitivityClass(value: unknown): AIMemorySensitivityClass {
  if (typeof value !== "string" || !SENSITIVITY_CLASSES.has(value as AIMemorySensitivityClass)) {
    invalid("Persisted AIMemoryRecord sensitivity class is invalid.");
  }
  return value as AIMemorySensitivityClass;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIMemoryRecord ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: string | Date | null, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return timestamp(value, field);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIMemoryRecord reads require a resolved principal context.");
  }
  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("AIMemoryRecord platform reads require trusted platform-global context.");
    }
    return;
  }
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("AIMemoryRecord reads require a resolved private context.");
  }
}

function parseRow(row: AIMemoryRecordRow): PersistedAIMemoryRecord {
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");
  const principalId = optionalUuid(row.principal_id, "principal id");
  const parsedMemoryClass = memoryClass(row.memory_class);

  if (parsedMemoryClass === "INDUSTRY_KNOWLEDGE" && !industryContextId) {
    invalid("Persisted AIMemoryRecord Industry knowledge scope is invalid.");
  }

  const createdAt = timestamp(row.created_at, "createdAt");
  const expiresAt = optionalTimestamp(row.expires_at, "expiresAt");
  if (expiresAt && Date.parse(expiresAt) <= Date.parse(createdAt)) {
    invalid("Persisted AIMemoryRecord expiry ordering is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    ...(principalId ? { principalId } : {}),
    ...(row.assistant_definition_id === null
      ? {}
      : { assistantDefinitionId: optionalUuid(row.assistant_definition_id, "AssistantDefinition id") }),
    memoryClass: parsedMemoryClass,
    contentRefOrEncryptedContent: rawText(row.content_ref_or_encrypted_content, "content"),
    ...(row.source_ref === null ? {} : { sourceRef: optionalText(row.source_ref, "source ref") }),
    sensitivityClass: sensitivityClass(row.sensitivity_class),
    retentionClass: rawText(row.retention_class, "retention class"),
    ...(row.acl_policy_ref === null ? {} : { aclPolicyRef: optionalText(row.acl_policy_ref, "ACL policy ref") }),
    status: memoryStatus(row.status),
    createdAt,
    ...(expiresAt ? { expiresAt } : {}),
    ...(row.supersedes_id === null ? {} : { supersedesId: optionalUuid(row.supersedes_id, "supersedes id") }),
  });
}

async function readMemoryRecord(
  transaction: SqlTransaction,
  memoryRecordId: string,
): Promise<PersistedAIMemoryRecord | null> {
  const result = await transaction.query<AIMemoryRecordRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            principal_id,
            assistant_definition_id,
            memory_class::text,
            content_ref_or_encrypted_content,
            source_ref,
            sensitivity_class,
            retention_class,
            acl_policy_ref,
            status::text,
            created_at,
            expires_at,
            supersedes_id
       FROM core_ai.ai_memory_record
      WHERE id=$1::uuid`,
    [memoryRecordId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIMemoryRecord is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIMemoryRecordStore implements AIMemoryRecordReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly memoryRecordId: string;
  }): Promise<PersistedAIMemoryRecord | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.memoryRecordId)) {
      invalid("AIMemoryRecord id is invalid.");
    }
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readMemoryRecord(transaction, input.memoryRecordId),
    );
  }
}
