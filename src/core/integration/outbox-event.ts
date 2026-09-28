import type { JsonObject } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type OutboxEventScopeClass =
  | "PLATFORM_GLOBAL"
  | "TENANT_CORE"
  | "TENANT_INDUSTRY"
  | "EXPLICIT_CROSS_CONTEXT";

export type OutboxEventStatus =
  | "PENDING"
  | "DISPATCHING"
  | "DISPATCHED"
  | "DEAD";

export interface OutboxEventEvidence {
  readonly id: string;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly scopeClass: OutboxEventScopeClass;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly aggregateVersion?: string;
  readonly envelopeJson: JsonObject;
  readonly status: OutboxEventStatus;
  readonly attemptCount: number;
  readonly availableAt: string;
  readonly lockedAt?: string;
  readonly lockedBy?: string;
  readonly dispatchedAt?: string;
  readonly lastErrorCode?: string;
  readonly createdAt: string;
}

export interface OutboxEventReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly eventId: string;
  }): Promise<OutboxEventEvidence | null>;
}
