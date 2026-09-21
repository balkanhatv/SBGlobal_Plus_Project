import type { RequestContext } from "../context/contracts.js";

export type DocumentAclSubjectType = "PRINCIPAL" | "ROLE" | "ORG_UNIT";
export type DocumentAclPermission = "VIEW" | "DOWNLOAD" | "SHARE" | "DELETE_VERSION";
export type DocumentAclEffect = "ALLOW" | "DENY";

export interface DocumentAclEntry {
  readonly id: string;
  readonly documentId: string;
  readonly subjectType: DocumentAclSubjectType;
  readonly subjectId: string;
  readonly permission: DocumentAclPermission;
  readonly effect: DocumentAclEffect;
  readonly validUntil?: string;
  readonly createdAt: string;
}

export interface DocumentAclReadPort {
  loadForDocument(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
  }): Promise<readonly DocumentAclEntry[]>;
}
