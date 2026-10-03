import type { OperationContract } from "../api/operation-contract.js";
import type { RequestContext } from "../context/contracts.js";
import {
  AuthorizationDecisionError,
  type AccessDecision,
  type BaseAccessDecisionInput,
  type ResourceAccessDecisionInput,
  type ResourceDescriptor,
} from "./contracts.js";
import type { AuthorizationDecisionPort } from "./guard-ports.js";
import {
  ABAC_ATTRIBUTE_KINDS_V1,
  MAX_ABAC_SET_ITEMS_V1,
  type AbacAttributePathV1,
  type AbacExpressionV1,
} from "./policy-grammar.js";
import type {
  ActiveAbacPolicyRead,
  AuthorizationReadState,
  AuthorizationReadStorePort,
} from "./read-store.js";

export type AuthorizationAttributeValueV1 = string | readonly string[];
export type AuthorizationSupplementalFactsV1 = Readonly<
  Partial<Record<AbacAttributePathV1, AuthorizationAttributeValueV1>>
>;

export interface AuthorizationSupplementalFactsPort {
  load(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly resourceDescriptor?: ResourceDescriptor;
  }): Promise<AuthorizationSupplementalFactsV1>;
}

export interface AuthorizationDecisionRuntimePort {
  now(): Date;
  nextDecisionId(): string;
}

export interface AuthorizationDecisionServicePorts {
  readonly readStore: AuthorizationReadStorePort;
  readonly runtime: AuthorizationDecisionRuntimePort;
  readonly supplementalFacts?: AuthorizationSupplementalFactsPort;
}

type AttributeMap = Map<AbacAttributePathV1, AuthorizationAttributeValueV1>;

const EMPTY_SUPPLEMENTAL_FACTS: AuthorizationSupplementalFactsPort = Object.freeze({
  async load(): Promise<AuthorizationSupplementalFactsV1> {
    return Object.freeze({});
  },
});

function decisionError(
  code: ConstructorParameters<typeof AuthorizationDecisionError>[0],
  message: string,
): never {
  throw new AuthorizationDecisionError(code, message);
}

function isPositiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function equalStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateScalar(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 256) {
    decisionError("AUTHORIZATION_ATTRIBUTE_INVALID", `Invalid supplemental Authorization fact: ${path}.`);
  }
  return value;
}

function validateSet(value: unknown, path: string): readonly string[] {
  if (!Array.isArray(value) || value.length > MAX_ABAC_SET_ITEMS_V1) {
    decisionError("AUTHORIZATION_ATTRIBUTE_INVALID", `Invalid supplemental Authorization fact: ${path}.`);
  }
  const normalized = value.map((item, index) => validateScalar(item, `${path}[${index}]`));
  if (new Set(normalized).size !== normalized.length) {
    decisionError("AUTHORIZATION_ATTRIBUTE_INVALID", `Duplicate supplemental Authorization fact: ${path}.`);
  }
  return Object.freeze(normalized);
}

function expressionUsesResource(expression: AbacExpressionV1): boolean {
  switch (expression.op) {
    case "all":
    case "any":
      return expression.args.some(expressionUsesResource);
    case "not":
      return expressionUsesResource(expression.arg);
    case "exists":
    case "eq":
    case "neq":
    case "in":
    case "notIn":
    case "contains":
    case "notContains":
    case "before":
    case "after":
      return expression.attribute.startsWith("resource.");
  }
}

function requireAttribute(
  attributes: AttributeMap,
  path: AbacAttributePathV1,
): AuthorizationAttributeValueV1 {
  const value = attributes.get(path);
  if (value === undefined) {
    decisionError(
      "AUTHORIZATION_ATTRIBUTE_UNAVAILABLE",
      "A required server-derived Authorization policy fact is unavailable.",
    );
  }
  return value;
}

function requireScalarAttribute(attributes: AttributeMap, path: AbacAttributePathV1): string {
  const value = requireAttribute(attributes, path);
  if (typeof value !== "string") {
    decisionError("AUTHORIZATION_ATTRIBUTE_INVALID", "Authorization policy fact type is invalid.");
  }
  return value;
}

function requireSetAttribute(attributes: AttributeMap, path: AbacAttributePathV1): readonly string[] {
  const value = requireAttribute(attributes, path);
  if (!Array.isArray(value)) {
    decisionError("AUTHORIZATION_ATTRIBUTE_INVALID", "Authorization policy fact type is invalid.");
  }
  return value;
}

function evaluateExpression(expression: AbacExpressionV1, attributes: AttributeMap): boolean {
  switch (expression.op) {
    case "all":
      return expression.args.every((child) => evaluateExpression(child, attributes));
    case "any":
      return expression.args.some((child) => evaluateExpression(child, attributes));
    case "not":
      return !evaluateExpression(expression.arg, attributes);
    case "exists":
      return attributes.has(expression.attribute);
    case "eq":
      return requireScalarAttribute(attributes, expression.attribute) === expression.value;
    case "neq":
      return requireScalarAttribute(attributes, expression.attribute) !== expression.value;
    case "in":
      return expression.values.includes(requireScalarAttribute(attributes, expression.attribute));
    case "notIn":
      return !expression.values.includes(requireScalarAttribute(attributes, expression.attribute));
    case "contains":
      return requireSetAttribute(attributes, expression.attribute).includes(expression.value);
    case "notContains":
      return !requireSetAttribute(attributes, expression.attribute).includes(expression.value);
    case "before":
      return Date.parse(requireScalarAttribute(attributes, expression.attribute)) < Date.parse(expression.value);
    case "after":
      return Date.parse(requireScalarAttribute(attributes, expression.attribute)) > Date.parse(expression.value);
  }
}

export class AuthorizationDecisionService implements AuthorizationDecisionPort {
  private readonly supplementalFacts: AuthorizationSupplementalFactsPort;

  constructor(private readonly ports: AuthorizationDecisionServicePorts) {
    this.supplementalFacts = ports.supplementalFacts ?? EMPTY_SUPPLEMENTAL_FACTS;
  }

  async evaluateBase(input: BaseAccessDecisionInput): Promise<AccessDecision> {
    return this.evaluate(input, "BASE");
  }

  async evaluateResource(input: ResourceAccessDecisionInput): Promise<AccessDecision> {
    return this.evaluate(input, "RESOURCE");
  }

  private async evaluate(
    input: BaseAccessDecisionInput | ResourceAccessDecisionInput,
    stage: "BASE" | "RESOURCE",
  ): Promise<AccessDecision> {
    const now = this.ports.runtime.now();
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
      decisionError("AUTHORIZATION_STATE_UNAVAILABLE", "Authorization decision clock is unavailable.");
    }

    const state = await this.loadCurrentState(input);
    this.assertCurrentContext(input.requestContext, state);

    const permission = state.permissionSnapshot.permissionSet.permissions
      .find((entry) => entry.code === input.operation.permissionCode);

    if (!permission || permission.effect === "DENY") {
      return this.makeDecision(input, state, now, {
        decision: "DENY",
        reasonCode: "RBAC_DENY",
        policyIds: [],
      });
    }

    const candidates = stage === "BASE"
      ? state.policies.filter((policy) => !expressionUsesResource(policy.expression))
      : state.policies;

    if (candidates.length === 0) {
      return this.makeDecision(input, state, now, {
        decision: "ALLOW",
        policyIds: [],
      });
    }

    const attributes = await this.buildAttributes(input, state, now);
    for (const policy of candidates) {
      if (!evaluateExpression(policy.expression, attributes)) continue;

      // DD-045: persisted RESTRICT currently has no governed restriction payload/reducer.
      // Treat both matching DENY and RESTRICT as a final deny until that contract exists.
      return this.makeDecision(input, state, now, {
        decision: "DENY",
        reasonCode: "ABAC_DENY",
        policyIds: [policy.id],
      });
    }

    return this.makeDecision(input, state, now, {
      decision: "ALLOW",
      policyIds: [],
    });
  }

  private async loadCurrentState(
    input: BaseAccessDecisionInput | ResourceAccessDecisionInput,
  ): Promise<AuthorizationReadState> {
    try {
      return await this.ports.readStore.load({
        requestContext: input.requestContext,
        permissionCode: input.operation.permissionCode,
      });
    } catch {
      decisionError(
        "AUTHORIZATION_STATE_UNAVAILABLE",
        "Current Authorization state is unavailable.",
      );
    }
  }

  private assertCurrentContext(context: RequestContext, state: AuthorizationReadState): void {
    if (state.permissionSnapshot.scopeClass !== context.scopeClass) {
      decisionError(
        "AUTHORIZATION_CONTEXT_STALE",
        "Authorization scope no longer matches the current compiled snapshot.",
      );
    }

    if (context.scopeClass === "PLATFORM_GLOBAL") {
      if (context.entitlementSnapshotVersion !== undefined) {
        decisionError(
          "AUTHORIZATION_CONTEXT_STALE",
          "Platform Authorization context cannot carry a tenant entitlement snapshot.",
        );
      }
      return;
    }

    if (!isPositiveSafeInteger(context.permissionVersion)
      || context.permissionVersion !== state.permissionSnapshot.permissionVersion
      || !equalStrings(context.roleIds, state.permissionSnapshot.roleIds)) {
      decisionError(
        "AUTHORIZATION_CONTEXT_STALE",
        "Authorization context is stale relative to the current compiled snapshot.",
      );
    }

    if (!isPositiveSafeInteger(context.entitlementSnapshotVersion)) {
      decisionError(
        "AUTHORIZATION_STATE_UNAVAILABLE",
        "Current tenant entitlement snapshot version is unavailable.",
      );
    }
  }

  private async buildAttributes(
    input: BaseAccessDecisionInput | ResourceAccessDecisionInput,
    state: AuthorizationReadState,
    now: Date,
  ): Promise<AttributeMap> {
    const context = input.requestContext;
    if (!context.principalId || !context.principalType) {
      decisionError("AUTHORIZATION_CONTEXT_STALE", "Protected Authorization context is incomplete.");
    }

    const attributes: AttributeMap = new Map();
    attributes.set("subject.principalId", context.principalId);
    attributes.set("subject.type", context.principalType);
    attributes.set("subject.roles", Object.freeze([...state.permissionSnapshot.roleIds]));

    const orgUnits = [...context.orgUnitPath];
    if (context.orgUnitId && !orgUnits.includes(context.orgUnitId)) orgUnits.push(context.orgUnitId);
    if (orgUnits.length > 0) attributes.set("subject.orgUnits", Object.freeze(orgUnits));
    if (context.membershipId) attributes.set("subject.membershipStatus", "ACTIVE");

    attributes.set("environment.time", now.toISOString());
    if (context.securityContext?.deviceTrust) {
      attributes.set("environment.deviceTrust", context.securityContext.deviceTrust);
    }
    if (context.regionCode) attributes.set("environment.region", context.regionCode);
    const authStrength = context.securityContext?.authStrength ?? context.authStrength;
    if (authStrength) attributes.set("environment.authStrength", authStrength);
    if (context.securityContext?.riskLevel) {
      attributes.set("environment.risk", context.securityContext.riskLevel);
    }

    if ("resourceDescriptor" in input) {
      const resource = input.resourceDescriptor;
      attributes.set("resource.tenantId", resource.tenantId);
      if (resource.industryContextId) {
        attributes.set("resource.industryContextId", resource.industryContextId);
      }
      if (resource.ownerPrincipalId) attributes.set("resource.owner", resource.ownerPrincipalId);
      if (resource.orgUnitId) attributes.set("resource.orgUnitId", resource.orgUnitId);
      if (resource.state) attributes.set("resource.state", resource.state);
      if (resource.sensitivityClass) {
        attributes.set("resource.sensitivity", resource.sensitivityClass);
      }
    }

    let supplemental: AuthorizationSupplementalFactsV1;
    try {
      supplemental = await this.supplementalFacts.load({
        requestContext: context,
        operation: input.operation,
        ...("resourceDescriptor" in input
          ? { resourceDescriptor: input.resourceDescriptor }
          : {}),
      });
    } catch (error) {
      if (error instanceof AuthorizationDecisionError) throw error;
      decisionError(
        "AUTHORIZATION_ATTRIBUTE_UNAVAILABLE",
        "Supplemental server-derived Authorization policy facts are unavailable.",
      );
    }

    this.mergeSupplementalFacts(attributes, supplemental);
    return attributes;
  }

  private mergeSupplementalFacts(
    attributes: AttributeMap,
    supplemental: AuthorizationSupplementalFactsV1,
  ): void {
    if (typeof supplemental !== "object" || supplemental === null || Array.isArray(supplemental)) {
      decisionError("AUTHORIZATION_ATTRIBUTE_INVALID", "Supplemental Authorization facts are invalid.");
    }

    for (const [rawKey, rawValue] of Object.entries(supplemental)) {
      if (!Object.hasOwn(ABAC_ATTRIBUTE_KINDS_V1, rawKey)) {
        decisionError("AUTHORIZATION_ATTRIBUTE_INVALID", "Supplemental Authorization fact key is invalid.");
      }
      const key = rawKey as AbacAttributePathV1;
      if (attributes.has(key)) {
        decisionError(
          "AUTHORIZATION_ATTRIBUTE_INVALID",
          "Supplemental Authorization facts cannot override directly resolved facts.",
        );
      }

      const kind = ABAC_ATTRIBUTE_KINDS_V1[key];
      if (kind === "STRING_SET") {
        attributes.set(key, validateSet(rawValue, key));
      } else {
        const value = validateScalar(rawValue, key);
        if (kind === "TIMESTAMP" && (Number.isNaN(Date.parse(value)) || !value.endsWith("Z"))) {
          decisionError("AUTHORIZATION_ATTRIBUTE_INVALID", "Supplemental timestamp fact is invalid.");
        }
        attributes.set(key, value);
      }
    }
  }

  private makeDecision(
    input: BaseAccessDecisionInput | ResourceAccessDecisionInput,
    state: AuthorizationReadState,
    now: Date,
    outcome: Pick<AccessDecision, "decision" | "policyIds"> & {
      readonly reasonCode?: AccessDecision["reasonCode"];
    },
  ): AccessDecision {
    const decisionId = this.ports.runtime.nextDecisionId();
    if (typeof decisionId !== "string" || decisionId.length === 0) {
      decisionError("AUTHORIZATION_STATE_UNAVAILABLE", "Authorization decision identity is unavailable.");
    }

    const entitlementSnapshotVersion = input.requestContext.scopeClass === "PLATFORM_GLOBAL"
      ? undefined
      : input.requestContext.entitlementSnapshotVersion;

    return Object.freeze({
      decision: outcome.decision,
      ...(outcome.reasonCode ? { reasonCode: outcome.reasonCode } : {}),
      policyIds: Object.freeze([...outcome.policyIds]),
      permissionCode: input.operation.permissionCode,
      decisionId,
      auditRequired: true,
      evaluatedAt: now.toISOString(),
      permissionVersion: state.permissionSnapshot.permissionVersion,
      ...(entitlementSnapshotVersion !== undefined
        ? { entitlementSnapshotVersion }
        : {}),
    });
  }
}
