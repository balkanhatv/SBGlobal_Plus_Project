import type {
  DocumentAclEffect,
  DocumentAclEntry,
  DocumentAclPermission,
  DocumentAclReadPort,
  DocumentAclSubjectType,
} from "../../core/document/acl.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface DocumentAclRow {
  readonly id: string;
  readonly document_id: string;
  readonly subject_type: string;
  readonly subject_id: string;
  readonly permission: string;
  readonly effect: string;
  readonly valid_until: string | Date | null;
  readonly created_at: string | Date;
}

export class DocumentAclPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentAclPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new DocumentAclPersistenceError(message);
}

function parseUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted Document ACL ${field} is invalid.`);
  }
  return value;
}

function parseSubjectType(value: string): DocumentAclSubjectType {
  if (value !== "PRINCIPAL" && value !== "ROLE" && value !== "ORG_UNIT") {
    invalid("Persisted Document ACL subject type is invalid.");
  }
  return value;
}

function parsePermission(value: string): DocumentAclPermission {
  if (value !== "VIEW"
    && value !== "DOWNLOAD"
    && value !== "SHARE"
    && value !== "DELETE_VERSION") {
    invalid("Persisted Document ACL permission is invalid.");
  }
  return value;
}

function parseEffect(value: string): DocumentAclEffect {
  if (value !== "ALLOW" && value !== "DENY") {
    invalid("Persisted Document ACL effect is invalid.");
  }
  return value;
}

function parseTimestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted Document ACL ${field} is invalid.`);
  }
  return date.toISOString();
}

function assertTenantContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY" && !context.industryContextId)) {
    invalid("Document ACL PostgreSQL reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: DocumentAclRow): DocumentAclEntry {
  return Object.freeze({
    id: parseUuid(row.id, "id"),
    documentId: parseUuid(row.document_id, "document id"),
    subjectType: parseSubjectType(row.subject_type),
    subjectId: parseUuid(row.subject_id, "subject id"),
    permission: parsePermission(row.permission),
    effect: parseEffect(row.effect),
    ...(row.valid_until !== null
      ? {validUntil: parseTimestamp(row.valid_until, "validUntil")}
      : {}),
    createdAt: parseTimestamp(row.created_at, "createdAt"),
  });
}

async function readAcl(
  transaction: SqlTransaction,
  documentId: string,
): Promise<readonly DocumentAclEntry[]> {
  const result = await transaction.query<DocumentAclRow>(
    `SELECT id,
            document_id,
            subject_type::text,
            subject_id,
            permission::text,
            effect::text,
            valid_until,
            created_at
       FROM core_document.document_acl
      WHERE document_id=$1::uuid
      ORDER BY permission::text, subject_type::text, subject_id, id`,
    [documentId],
  );

  return Object.freeze(result.rows.map(parseRow));
}

export class PostgresDocumentAclStore implements DocumentAclReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForDocument(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
  }): Promise<readonly DocumentAclEntry[]> {
    assertTenantContext(input.requestContext);
    if (!UUID_PATTERN.test(input.documentId)) {
      invalid("Document ACL document id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readAcl(transaction, input.documentId),
    );
  }
}
