import type { OperationContract } from "../api/operation-contract.js";
import type { CommercialContext, RequestContext } from "../context/contracts.js";
import { ContextResolutionError } from "../context/errors.js";
import type { CommercialContextPort } from "../context/ports.js";
import type {
  CommercialGuardPort,
  CommercialGuardResult,
} from "../authorization/guard-ports.js";
import type {
  AuthorizationSupplementalFactsPort,
  AuthorizationSupplementalFactsV1,
} from "../authorization/decision-service.js";
import { MAX_ABAC_SET_ITEMS_V1 } from "../authorization/policy-grammar.js";

export type CommercialSubscriptionState =
  | "PENDING"
  | "TRIAL"
  | "ACTIVE"
  | "GRACE"
  | "SUSPENDED"
  | "EXPIRED"
  | "CANCELLED";

export type CommercialLicenseType =
  | "INDUSTRY"
  | "MANAGEMENT_SYSTEM"
  | "SEAT"
  | "SURFACE"
  | "API_SERVICE";

export type CommercialEntitlementValueType =
  | "BOOLEAN"
  | "INTEGER"
  | "DECIMAL"
  | "TEXT"
  | "SET";

export interface CurrentCommercialLicenseRead {
  readonly id: string;
  readonly licenseType: CommercialLicenseType;
  readonly subjectKey: string;
  readonly industryContextId?: string;
  readonly principalId?: string;
  readonly isEffective: boolean;
}

export interface CurrentCommercialEntitlementRead {
  readonly code: string;
  readonly valueType: CommercialEntitlementValueType;
  readonly value: unknown;
}

export type CommercialClientEntitlementValue =
  | true
  | number
  | string
  | readonly string[];

export interface CommercialClientEntitlementRead {
  readonly code: string;
  readonly valueType: CommercialEntitlementValueType;
  readonly value: CommercialClientEntitlementValue;
}

export interface CommercialClientCurrentProjectionV1 {
  readonly snapshotVersion: number;
  readonly subscriptionState: CommercialSubscriptionState;
  readonly entitlements: readonly CommercialClientEntitlementRead[];
}

export interface CommercialCurrentStateRead {
  readonly snapshotId: string;
  readonly snapshotVersion: number;
  readonly subscriptionId: string;
  readonly subscriptionState: CommercialSubscriptionState;
  readonly denySet: readonly string[];
  readonly licenses: readonly CurrentCommercialLicenseRead[];
  readonly entitlements: readonly CurrentCommercialEntitlementRead[];
}

export interface CommercialCurrentStateReadStorePort {
  loadCurrent(input: {
    readonly requestContext: RequestContext;
  }): Promise<CommercialCurrentStateRead | null>;
}

export type CommercialStateErrorCode =
  | "COMMERCIAL_SCOPE_UNSUPPORTED"
  | "COMMERCIAL_STATE_UNAVAILABLE"
  | "COMMERCIAL_STATE_INVALID"
  | "COMMERCIAL_CONTEXT_STALE";

export class CommercialStateError extends Error {
  constructor(
    readonly code: CommercialStateErrorCode,
    message = "Current Commercial state is unavailable.",
  ) {
    super(message);
    this.name = "CommercialStateError";
  }
}

function stateInvalid(message: string): never {
  throw new CommercialStateError("COMMERCIAL_STATE_INVALID", message);
}

const SUBSCRIPTION_STATES = new Set<CommercialSubscriptionState>([
  "PENDING", "TRIAL", "ACTIVE", "GRACE", "SUSPENDED", "EXPIRED", "CANCELLED",
]);

function clientEntitlementValue(
  fact: CurrentCommercialEntitlementRead,
): CommercialClientEntitlementValue | undefined {
  switch (fact.valueType) {
    case "BOOLEAN":
      if (typeof fact.value !== "boolean") stateInvalid("Boolean entitlement value is invalid.");
      return fact.value ? true : undefined;
    case "INTEGER":
      if (!Number.isSafeInteger(fact.value) || Number(fact.value) < 0) {
        stateInvalid("Integer entitlement value is invalid.");
      }
      return Number(fact.value) > 0 ? Number(fact.value) : undefined;
    case "DECIMAL":
      if (typeof fact.value !== "number" || !Number.isFinite(fact.value) || fact.value < 0) {
        stateInvalid("Decimal entitlement value is invalid.");
      }
      return fact.value > 0 ? fact.value : undefined;
    case "TEXT":
      if (typeof fact.value !== "string" || fact.value.length > 256) {
        stateInvalid("Text entitlement value is invalid.");
      }
      return fact.value.length > 0 ? fact.value : undefined;
    case "SET": {
      if (!Array.isArray(fact.value) || fact.value.length > MAX_ABAC_SET_ITEMS_V1) {
        stateInvalid("Set entitlement value is invalid.");
      }
      const values = fact.value.map((value) => {
        if (typeof value !== "string" || value.length === 0 || value.length > 256) {
          stateInvalid("Set entitlement item is invalid.");
        }
        return value;
      });
      if (new Set(values).size !== values.length) {
        stateInvalid("Set entitlement value contains duplicates.");
      }
      if (values.length === 0) return undefined;
      return Object.freeze([...values].sort());
    }
  }
  stateInvalid("Entitlement value type is invalid.");
}

function enabledEntitlement(fact: CurrentCommercialEntitlementRead): boolean {
  return clientEntitlementValue(fact) !== undefined;
}

function canonicalSet(values: readonly string[], label: string): readonly string[] {
  const sorted = [...new Set(values)].sort();
  if (sorted.length > MAX_ABAC_SET_ITEMS_V1) {
    stateInvalid(`${label} exceeds Authorization v1 set bounds.`);
  }
  for (const value of sorted) {
    if (value.length === 0 || value.length > 256) {
      stateInvalid(`${label} contains an invalid value.`);
    }
  }
  return Object.freeze(sorted);
}

function enabledEntitlementCodes(state: CommercialCurrentStateRead): readonly string[] {
  const denied = new Set(state.denySet);
  return canonicalSet(
    state.entitlements
      .filter((fact) => !denied.has(fact.code) && enabledEntitlement(fact))
      .map((fact) => fact.code),
    "Commercial entitlement facts",
  );
}

function clientEntitlements(
  state: CommercialCurrentStateRead,
): readonly CommercialClientEntitlementRead[] {
  const denied = new Set(state.denySet);
  const seen = new Set<string>();
  const output: CommercialClientEntitlementRead[] = [];

  for (const fact of state.entitlements) {
    if (!fact.code || fact.code.length > 256) {
      stateInvalid("Commercial entitlement code is invalid.");
    }
    if (denied.has(fact.code)) continue;
    const value = clientEntitlementValue(fact);
    if (value === undefined) continue;
    if (seen.has(fact.code)) {
      stateInvalid("Commercial entitlement projection contains duplicate codes.");
    }
    seen.add(fact.code);
    output.push(Object.freeze({
      code: fact.code,
      valueType: fact.valueType,
      value,
    }));
  }

  if (output.length > MAX_ABAC_SET_ITEMS_V1) {
    stateInvalid("Commercial entitlement projection exceeds v1 bounds.");
  }

  output.sort((left, right) => left.code.localeCompare(right.code));
  return Object.freeze(output);
}

function effectiveLicenseTokens(state: CommercialCurrentStateRead): readonly string[] {
  return canonicalSet(
    state.licenses
      .filter((license) => license.isEffective)
      .map((license) => `${license.licenseType}:${license.subjectKey}`),
    "Commercial license set",
  );
}

function commercialPersistenceContext(
  input: Parameters<CommercialContextPort["validateAndLoad"]>[0],
): RequestContext {
  if (input.scopeClass !== "TENANT_CORE" && input.scopeClass !== "TENANT_INDUSTRY") {
    throw new CommercialStateError(
      "COMMERCIAL_SCOPE_UNSUPPORTED",
      "Commercial current-state reads require a single tenant scope.",
    );
  }
  if (!input.tenantId || !input.principalId || !input.dataHomeId || !input.regionCode) {
    throw new CommercialStateError(
      "COMMERCIAL_SCOPE_UNSUPPORTED",
      "Commercial persistence context is incomplete.",
    );
  }
  if (input.scopeClass === "TENANT_CORE" && input.industryContextId) {
    throw new CommercialStateError(
      "COMMERCIAL_SCOPE_UNSUPPORTED",
      "Tenant Core Commercial context cannot carry an Industry Context.",
    );
  }
  if (input.scopeClass === "TENANT_INDUSTRY" && !input.industryContextId) {
    throw new CommercialStateError(
      "COMMERCIAL_SCOPE_UNSUPPORTED",
      "Tenant Industry Commercial context requires an Industry Context.",
    );
  }

  return Object.freeze({
    requestId: input.requestId,
    correlationId: input.correlationId,
    tenantId: input.tenantId,
    industryContextId: input.industryContextId,
    dataHomeId: input.dataHomeId,
    regionCode: input.regionCode,
    principalId: input.principalId,
    principalType: input.principalType,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: input.scopeClass,
  });
}

export class CommercialCurrentStateService
implements CommercialContextPort, CommercialGuardPort, AuthorizationSupplementalFactsPort {
  constructor(private readonly store: CommercialCurrentStateReadStorePort) {}

  async validateAndLoad(
    input: Parameters<CommercialContextPort["validateAndLoad"]>[0],
  ): Promise<CommercialContext> {
    try {
      const requestContext = commercialPersistenceContext(input);
      const state = await this.loadCurrent(requestContext);
      return Object.freeze({
        entitlementSnapshotId: state.snapshotId,
        entitlementSnapshotVersion: state.snapshotVersion,
      });
    } catch {
      throw new ContextResolutionError(
        "DEPENDENCY_UNAVAILABLE",
        "Commercial context is unavailable.",
      );
    }
  }

  async validateCurrent(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
  }): Promise<CommercialGuardResult> {
    const state = await this.loadCurrent(input.requestContext);
    this.assertSnapshotCurrent(input.requestContext, state);

    if (state.subscriptionState === "PENDING"
      || state.subscriptionState === "SUSPENDED"
      || state.subscriptionState === "EXPIRED"
      || state.subscriptionState === "CANCELLED") {
      return Object.freeze({
        allowed: false,
        code: "SUBSCRIPTION_INVALID",
        reasonCode: "SUBSCRIPTION_RESTRICTED",
      });
    }

    if (input.requestContext.scopeClass === "TENANT_INDUSTRY") {
      const industryContextId = input.requestContext.industryContextId;
      const industryLicense = state.licenses.some((license) =>
        license.licenseType === "INDUSTRY"
        && license.industryContextId === industryContextId
        && license.isEffective);
      if (!industryLicense) {
        return Object.freeze({
          allowed: false,
          code: "LICENSE_INVALID",
          reasonCode: "LICENSE_INVALID",
        });
      }

      const managementSystemLicenses = state.licenses.filter((license) =>
        license.licenseType === "MANAGEMENT_SYSTEM"
        && license.subjectKey === input.operation.module);
      if (managementSystemLicenses.length > 0
        && !managementSystemLicenses.some((license) => license.isEffective)) {
        return Object.freeze({
          allowed: false,
          code: "LICENSE_INVALID",
          reasonCode: "LICENSE_INVALID",
        });
      }
    }

    if (input.requestContext.principalType === "HUMAN") {
      const assignedSeatLicenses = state.licenses.filter((license) =>
        license.licenseType === "SEAT" && license.principalId !== undefined);
      if (assignedSeatLicenses.length > 0
        && !assignedSeatLicenses.some((license) =>
          license.principalId === input.requestContext.principalId && license.isEffective)) {
        return Object.freeze({
          allowed: false,
          code: "LICENSE_INVALID",
          reasonCode: "LICENSE_INVALID",
        });
      }
    }

    const requirement = input.operation.entitlementRequirement;
    if (requirement) {
      const enabled = enabledEntitlementCodes(state);
      if (state.denySet.includes(requirement) || !enabled.includes(requirement)) {
        return Object.freeze({
          allowed: false,
          code: "ENTITLEMENT_DENIED",
          reasonCode: "ENTITLEMENT_MISSING",
          upgradeTarget: requirement,
        });
      }
    }

    return Object.freeze({ allowed: true });
  }

  async getClientCurrentProjection(input: {
    readonly requestContext: RequestContext;
  }): Promise<CommercialClientCurrentProjectionV1> {
    const state = await this.loadCurrent(input.requestContext);
    this.assertSnapshotCurrent(input.requestContext, state);
    return Object.freeze({
      snapshotVersion: state.snapshotVersion,
      subscriptionState: state.subscriptionState,
      entitlements: clientEntitlements(state),
    });
  }

  async load(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
  }): Promise<AuthorizationSupplementalFactsV1> {
    if (input.requestContext.scopeClass === "PLATFORM_GLOBAL") {
      return Object.freeze({});
    }

    const state = await this.loadCurrent(input.requestContext);
    this.assertSnapshotCurrent(input.requestContext, state);

    return Object.freeze({
      "commercial.subscriptionState": state.subscriptionState,
      "commercial.licenseSet": effectiveLicenseTokens(state),
      "commercial.entitlementFacts": enabledEntitlementCodes(state),
    });
  }

  private async loadCurrent(requestContext: RequestContext): Promise<CommercialCurrentStateRead> {
    if (requestContext.scopeClass !== "TENANT_CORE"
      && requestContext.scopeClass !== "TENANT_INDUSTRY") {
      throw new CommercialStateError(
        "COMMERCIAL_SCOPE_UNSUPPORTED",
        "Commercial current-state reads require a single tenant scope.",
      );
    }

    let state: CommercialCurrentStateRead | null;
    try {
      state = await this.store.loadCurrent({ requestContext });
    } catch (error) {
      if (error instanceof CommercialStateError) throw error;
      throw new CommercialStateError("COMMERCIAL_STATE_UNAVAILABLE");
    }
    if (!state) {
      throw new CommercialStateError("COMMERCIAL_STATE_UNAVAILABLE");
    }
    if (!SUBSCRIPTION_STATES.has(state.subscriptionState)) {
      stateInvalid("Commercial subscription state is invalid.");
    }
    if (!Number.isSafeInteger(state.snapshotVersion) || state.snapshotVersion <= 0) {
      stateInvalid("Commercial snapshot version is invalid.");
    }
    return state;
  }

  private assertSnapshotCurrent(
    context: RequestContext,
    state: CommercialCurrentStateRead,
  ): void {
    if (!context.entitlementSnapshotId
      || !Number.isSafeInteger(context.entitlementSnapshotVersion)
      || context.entitlementSnapshotVersion! <= 0
      || context.entitlementSnapshotId !== state.snapshotId
      || context.entitlementSnapshotVersion !== state.snapshotVersion) {
      throw new CommercialStateError(
        "COMMERCIAL_CONTEXT_STALE",
        "Commercial RequestContext is stale relative to current state.",
      );
    }
  }
}
