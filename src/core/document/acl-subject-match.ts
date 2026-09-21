import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentAclEntry,
  DocumentAclPermission,
} from "./acl.js";

export type DocumentAclSubjectMatchErrorCode =
  | "ACL_MATCH_CONTEXT_INVALID"
  | "ACL_MATCH_INPUT_INVALID";

export class DocumentAclSubjectMatchError extends Error {
  constructor(
    readonly code: DocumentAclSubjectMatchErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DocumentAclSubjectMatchError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACL_PERMISSIONS = new Set<DocumentAclPermission>([
  "VIEW",
  "DOWNLOAD",
  "SHARE",
  "DELETE_VERSION",
]);

function contextInvalid(message: string): never {
  throw new DocumentAclSubjectMatchError("ACL_MATCH_CONTEXT_INVALID", message);
}

function inputInvalid(message: string): never {
  throw new DocumentAclSubjectMatchError("ACL_MATCH_INPUT_INVALID", message);
}

function assertUuid(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    inputInvalid(`Document ACL ${field} is invalid.`);
  }
}

function assertResolvedTenantContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE"
      && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || !UUID_PATTERN.test(context.tenantId)
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    contextInvalid("Document ACL subject matching requires a resolved single-Tenant context.");
  }

  if (!Array.isArray(context.roleIds)
    || !context.roleIds.every((id) => typeof id === "string" && UUID_PATTERN.test(id))
    || !Array.isArray(context.orgUnitPath)
    || !context.orgUnitPath.every((id) => typeof id === "string" && UUID_PATTERN.test(id))) {
    contextInvalid("Document ACL subject context is malformed.");
  }
}

function assertEntry(entry: DocumentAclEntry, documentId: string): void {
  if (!entry || typeof entry !== "object") {
    inputInvalid("Document ACL entry is invalid.");
  }
  assertUuid(entry.id, "entry id");
  assertUuid(entry.documentId, "entry document id");
  assertUuid(entry.subjectId, "subject id");

  if (entry.documentId !== documentId) {
    inputInvalid("Document ACL evidence crosses document boundary.");
  }
  if (entry.subjectType !== "PRINCIPAL"
    && entry.subjectType !== "ROLE"
    && entry.subjectType !== "ORG_UNIT") {
    inputInvalid("Document ACL subject type is invalid.");
  }
  if (!ACL_PERMISSIONS.has(entry.permission)) {
    inputInvalid("Document ACL persisted permission is invalid.");
  }
  if (entry.effect !== "ALLOW" && entry.effect !== "DENY") {
    inputInvalid("Document ACL persisted effect is invalid.");
  }
  if (typeof entry.createdAt !== "string" || entry.createdAt.length === 0
    || (entry.validUntil !== undefined
      && (typeof entry.validUntil !== "string" || entry.validUntil.length === 0))) {
    inputInvalid("Document ACL persisted timestamp evidence is invalid.");
  }
}

function subjectMatches(
  entry: DocumentAclEntry,
  context: RequestContext,
): boolean {
  if (entry.subjectType === "PRINCIPAL") {
    return entry.subjectId === context.principalId;
  }
  if (entry.subjectType === "ROLE") {
    return context.roleIds.includes(entry.subjectId);
  }
  return context.orgUnitPath.includes(entry.subjectId);
}

export class DocumentAclSubjectMatcher {
  match(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
    readonly permission: DocumentAclPermission;
    readonly entries: readonly DocumentAclEntry[];
  }): readonly DocumentAclEntry[] {
    assertResolvedTenantContext(input.requestContext);
    assertUuid(input.documentId, "document id");

    if (!ACL_PERMISSIONS.has(input.permission)) {
      inputInvalid("Document ACL requested permission is invalid.");
    }
    if (!Array.isArray(input.entries)) {
      inputInvalid("Document ACL evidence set is invalid.");
    }

    const matched: DocumentAclEntry[] = [];
    for (const entry of input.entries) {
      assertEntry(entry, input.documentId);
      if (entry.permission !== input.permission) continue;
      if (!subjectMatches(entry, input.requestContext)) continue;
      matched.push(Object.freeze({...entry}));
    }

    return Object.freeze(matched);
  }
}
