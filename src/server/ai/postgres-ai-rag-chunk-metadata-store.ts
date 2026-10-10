import type { JsonValue } from "../../core/api/schema-registry.js";
import type {
  AIRAGChunkMetadataReadPort,
  AIRAGChunkScopeClass,
  AIRAGChunkSensitivityClass,
  PersistedAIRAGChunkMetadata,
} from "../../core/ai/rag-chunk-metadata.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIRAGChunkRow {
  readonly id: string;
  readonly source_id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly scope_class: string;
  readonly chunk_ordinal: string | number;
  readonly text_ref_or_encrypted_text: string;
  readonly content_hash: string;
  readonly token_count: string | number;
  readonly acl_projection_json: unknown;
  readonly sensitivity_class: string;
  readonly residency_region: string;
  readonly retention_class: string;
  readonly embedding_model_id: string;
  readonly embedding_version: string;
  readonly metadata_json: unknown;
  readonly created_at: string | Date;
}

export class AIRAGChunkMetadataPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIRAGChunkMetadataPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SCOPE_CLASSES = new Set<AIRAGChunkScopeClass>([
  "TENANT_CORE",
  "TENANT_INDUSTRY",
]);

const SENSITIVITY_CLASSES = new Set<AIRAGChunkSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new AIRAGChunkMetadataPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIRAGChunk ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIRAGChunk ${field} is invalid.`);
  }
  return value;
}

function boundedInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum?: number,
): number {
  const parsed = Number(value);
  if (
    !Number.isSafeInteger(parsed)
    || parsed < minimum
    || (maximum !== undefined && parsed > maximum)
  ) {
    invalid(`Persisted AIRAGChunk ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIRAGChunk ${field} is invalid.`);
  }
  return date.toISOString();
}

function scopeClass(value: unknown): AIRAGChunkScopeClass {
  if (
    typeof value !== "string"
    || !SCOPE_CLASSES.has(value as AIRAGChunkScopeClass)
  ) {
    invalid("Persisted AIRAGChunk scope class is invalid.");
  }
  return value as AIRAGChunkScopeClass;
}

function sensitivityClass(value: unknown): AIRAGChunkSensitivityClass {
  if (
    typeof value !== "string"
    || !SENSITIVITY_CLASSES.has(value as AIRAGChunkSensitivityClass)
  ) {
    invalid("Persisted AIRAGChunk sensitivity class is invalid.");
  }
  return value as AIRAGChunkSensitivityClass;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AIRAGChunk JSON is invalid at ${path}.`);
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
      invalid(`Persisted AIRAGChunk JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIRAGChunk JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AIRAGChunk JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIRAGChunk reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId
      || context.industryContextId
    ) {
      invalid("AIRAGChunk platform reads require trusted platform-global context.");
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
    invalid("AIRAGChunk reads require a resolved private context.");
  }
}

function parseRow(row: AIRAGChunkRow): PersistedAIRAGChunkMetadata {
  const parsedScope = scopeClass(row.scope_class);
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");

  if (
    (parsedScope === "TENANT_CORE" && industryContextId)
    || (parsedScope === "TENANT_INDUSTRY" && !industryContextId)
  ) {
    invalid("Persisted AIRAGChunk scope ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    sourceId: uuid(row.source_id, "source id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    scopeClass: parsedScope,
    chunkOrdinal: boundedInteger(row.chunk_ordinal, "chunk ordinal", 0),
    textRefOrEncryptedText: rawText(
      row.text_ref_or_encrypted_text,
      "text ref or encrypted text",
    ),
    contentHash: rawText(row.content_hash, "content hash"),
    tokenCount: boundedInteger(row.token_count, "token count", 0, 1200),
    aclProjection: normalizeJson(row.acl_projection_json),
    sensitivityClass: sensitivityClass(row.sensitivity_class),
    residencyRegion: rawText(row.residency_region, "residency region"),
    retentionClass: rawText(row.retention_class, "retention class"),
    embeddingModelId: uuid(row.embedding_model_id, "embedding model id"),
    embeddingVersion: rawText(row.embedding_version, "embedding version"),
    metadata: normalizeJson(row.metadata_json),
    createdAt: timestamp(row.created_at, "createdAt"),
  });
}

async function readRAGChunkMetadata(
  transaction: SqlTransaction,
  ragChunkId: string,
): Promise<PersistedAIRAGChunkMetadata | null> {
  const result = await transaction.query<AIRAGChunkRow>(
    `SELECT id,
            source_id,
            tenant_id,
            industry_context_id,
            scope_class,
            chunk_ordinal,
            text_ref_or_encrypted_text,
            content_hash,
            token_count,
            acl_projection_json,
            sensitivity_class,
            residency_region,
            retention_class,
            embedding_model_id,
            embedding_version,
            metadata_json,
            created_at
       FROM core_ai.rag_chunk
      WHERE id=$1::uuid`,
    [ragChunkId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIRAGChunk is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIRAGChunkMetadataStore implements AIRAGChunkMetadataReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly ragChunkId: string;
  }): Promise<PersistedAIRAGChunkMetadata | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.ragChunkId)) {
      invalid("AIRAGChunk id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readRAGChunkMetadata(transaction, input.ragChunkId),
    );
  }
}
