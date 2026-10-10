import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type AuditEventScopeClass =
  | "PLATFORM_GLOBAL"
  | "TENANT_CORE"
  | "TENANT_INDUSTRY"
  | "EXPLICIT_CROSS_CONTEXT";

export type AuditEventOutcome = "SUCCESS" | "DENIED" | "FAILED";

export type AuditEventSensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface PersistedAuditEvent {
  readonly id: string;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly sourceIndustryContextId?: string;
  readonly targetIndustryContextId?: string;
  readonly scopeClass: AuditEventScopeClass;
  readonly occurredAt: string;
  readonly actorPrincipalId?: string;
  readonly actorType: string;
  readonly actionCode: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly outcome: AuditEventOutcome;
  readonly reasonCode?: string;
  readonly permissionCode?: string;
  readonly accessDecisionId?: string;
  readonly sourceModule: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly requestId?: string;
  readonly dataHomeId?: string;
  readonly regionCode?: string;
  readonly sensitivityClass: AuditEventSensitivityClass;
  readonly evidenceJson: JsonValue;
  readonly schemaVersion: number;
}

export interface AuditEventReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly auditEventId: string;
  }): Promise<PersistedAuditEvent | null>;
}
