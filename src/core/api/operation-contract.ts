import type { ScopeClass } from "../context/contracts.js";

export type OperationKind = "COMMAND" | "QUERY";

export interface OperationContract {
  readonly operationId: string;
  readonly module: string;
  readonly scopeClass: ScopeClass;
  readonly kind: OperationKind;
  readonly permissionCode: string;
  readonly entitlementRequirement?: string;
  readonly inputSchemaVersion: number;
  readonly outputSchemaVersion: number;
  readonly resourceResolver?: string;
  readonly idempotencyPolicy: "NONE" | "OPTIONAL" | "REQUIRED";
  readonly rateClass: string;
  readonly auditClass: string;
  readonly domainService: string;
  readonly emittedEvents: readonly string[];
  readonly errorCodes: readonly string[];
}
