import type { JsonValue } from "../api/schema-registry.js";
import type {
  EventCatalogContract,
  EventScopeClass,
} from "./event-envelope.js";

export type EventCatalogStatus = "ACTIVE" | "RETIRED";

export interface PersistedEventCatalogEntry extends EventCatalogContract {
  readonly orderingKey?: string;
  readonly consumerClassesJson: JsonValue;
  readonly retentionAuditPosture: string;
  readonly webhookEligible: boolean;
  readonly backwardCompatibility: string;
  readonly status: EventCatalogStatus;
  readonly createdAt: string;
}

export interface EventCatalogReadPort {
  loadExact(input: {
    readonly eventType: string;
    readonly eventVersion: number;
    readonly scopeClass: EventScopeClass;
  }): Promise<PersistedEventCatalogEntry | null>;
}
