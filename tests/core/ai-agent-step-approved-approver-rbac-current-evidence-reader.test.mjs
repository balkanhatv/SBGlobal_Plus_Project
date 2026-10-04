import test from "node:test";
import assert from "node:assert/strict";

import {
  OperationRegistry,
  loadAIAgentStepApprovedApproverRbacCurrentEvidence,
} from "../../dist/core/index.js";

const APPROVAL_PERMISSION = "raw.approval.permission";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  step: "33333333-3333-4333-8333-333333333333",
  run: "44444444-4444-4444-8444-444444444444",
  definition: "55555555-5555-4555-8555-555555555555",
  toolSet: "66666666-6666-4666-8666-666666666666",
  member: "77777777-7777-4777-8777-777777777777",
  toolDefinition: "88888888-8888-4888-8888-888888888888",
  actor: "99999999-9999-4999-8999-999999999999",
  approver: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  approval: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  membership: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  approverMembership: "abababab-abab-4bab-8bab-abababababab",
  correlation: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  capability: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  roleA: "12121212-1212-4212-8212-121212121212",
  roleB: "13131313-1313-4313-8313-131313131313",
  policy: "14141414-1414-4414-8414-141414141414",
});

const operationId = "operation.raw";
const capabilityCode = "capability.raw";

function actingContext(overrides = {}) {
  return Object.freeze({
    requestId: "request-actor",
    correlationId: "correlation-actor",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "data-home",
    regionCode: "IN-CENTRAL",
    principalId: ids.actor,
    principalType: "HUMAN",
    membershipId: ids.membership,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    permissionVersion: 7,
    entitlementSnapshotVersion: 11,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function approverContext(overrides = {}) {
  return Object.freeze({
    requestId: "request-approver",
    correlationId: "correlation-approver",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "data-home",
    regionCode: "IN-CENTRAL",
    principalId: ids.approver,
    principalType: "HUMAN",
    membershipId: ids.approverMembership,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([ids.roleA, ids.roleB]),
    permissionVersion: 13,
    entitlementSnapshotVersion: 17,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function approval(overrides = {}) {
  return Object.freeze({
    id: ids.approval,
    runId: ids.run,
    stepId: ids.step,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    requestedByAgent: true,
    approvalType: "RAW_TYPE",
    requiredPermission: APPROVAL_PERMISSION,
    approverPrincipalId: ids.approver,
    status: "APPROVED",
    requestSummarySafe: "safe summary",
    approvedAt: "2026-10-04T00:00:00.000Z",
    reason: "raw reason",
    correlationId: ids.correlation,
    createdAt: "2026-10-04T01:00:00.000Z",
    ...overrides,
  });
}

function step(overrides = {}) {
  return Object.freeze({
    id: ids.step,
    runId: ids.run,
    ordinal: 1,
    stepType: "TOOL",
    inputRef: "opaque-input",
    outputRef: "opaque-output",
    toolBindingId: ids.member,
    approvalId: ids.approval,
    status: "RUNNING",
    startedAt: "2026-10-04T00:00:00.000Z",
    completedAt: undefined,
    auditRef: "opaque-audit",
    ...overrides,
  });
}

function run(overrides = {}) {
  return Object.freeze({
    id: ids.run,
    agentDefinitionId: ids.definition,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    actingPrincipalId: ids.actor,
    membershipId: ids.membership,
    entitlementSnapshotVersion: "raw-snapshot-version",
    permissionVersion: "raw-permission-version",
    requestedResourceScope: Object.freeze({raw: true}),
    status: "WAITING_APPROVAL",
    stepBudgetClass: "raw-step-budget",
    tokenBudgetClass: "raw-token-budget",
    startedAt: "2026-10-04T00:00:00.000Z",
    correlationId: ids.correlation,
    ...overrides,
  });
}

function definition(overrides = {}) {
  return Object.freeze({
    id: ids.definition,
    ownerScope: "INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    code: "agent.raw",
    objectiveClass: "raw-objective",
    allowedToolSetId: ids.toolSet,
    maxRiskClass: "raw-risk",
    approvalPolicyId: ids.approval,
    budgetPolicyId: ids.approval,
    version: 1,
    status: "ACTIVE",
    createdAt: "2026-10-04T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
    ...overrides,
  });
}

function toolSet(overrides = {}) {
  return Object.freeze({
    id: ids.toolSet,
    ownerScope: "INDUSTRY",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    code: "toolset.raw",
    version: 1,
    status: "ACTIVE",
    createdAt: "2026-10-04T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
    ...overrides,
  });
}

function member(overrides = {}) {
  return Object.freeze({
    id: ids.member,
    toolSetId: ids.toolSet,
    toolDefinitionId: ids.toolDefinition,
    enabled: true,
    constraint: Object.freeze({raw: true}),
    createdAt: "2026-10-04T00:00:00.000Z",
    ...overrides,
  });
}

function toolDefinition(overrides = {}) {
  return Object.freeze({
    id: ids.toolDefinition,
    toolId: "tool.raw",
    capabilityCode,
    operationContractId: operationId,
    scopeClass: "TENANT_INDUSTRY",
    requiredPermission: "tool.permission.different",
    requiredEntitlement: "tool.entitlement",
    inputSchemaVersion: 1,
    outputSchemaVersion: 1,
    sideEffectClass: "HIGH",
    approvalPolicyId: ids.approval,
    idempotencyRequired: true,
    auditClass: "TOOL_AUDIT",
    status: "ACTIVE",
    version: 1,
    createdAt: "2026-10-04T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
    ...overrides,
  });
}

function capability(overrides = {}) {
  return Object.freeze({
    id: ids.capability,
    code: capabilityCode,
    category: "TOOL",
    requiredEntitlement: "cap.entitlement",
    defaultPolicyClass: "raw-policy",
    schemaVersion: 1,
    status: "ACTIVE",
    ...overrides,
  });
}

function operation() {
  return Object.freeze({
    operationId,
    module: "RawModule",
    scopeClass: "TENANT_INDUSTRY",
    kind: "COMMAND",
    permissionCode: "operation.permission.different",
    entitlementRequirement: "operation.entitlement",
    inputSchemaVersion: 1,
    outputSchemaVersion: 1,
    idempotencyPolicy: "REQUIRED",
    rateClass: "AI_COSTED",
    auditClass: "OPERATION_AUDIT",
    domainService: "RawService.execute",
    emittedEvents: Object.freeze([]),
    errorCodes: Object.freeze([]),
  });
}

function authorizationState(overrides = {}) {
  const snapshotOverrides = overrides.permissionSnapshot ?? {};
  const policies = Object.hasOwn(overrides, "policies")
    ? overrides.policies
    : Object.freeze([
      Object.freeze({
        id: ids.policy,
        code: "raw-policy",
        tenantId: ids.tenant,
        industryContextId: ids.industry,
        permissionPattern: APPROVAL_PERMISSION,
        priority: 10,
        effect: "DENY",
        expressionVersion: 1,
        expression: Object.freeze({
          op: "eq",
          attribute: "environment.region",
          value: "OUTSIDE",
        }),
      }),
    ]);

  return Object.freeze({
    permissionSnapshot: Object.freeze({
      scopeClass: "TENANT_INDUSTRY",
      permissionVersion: 13,
      roleIds: Object.freeze([ids.roleA, ids.roleB]),
      permissionSet: Object.freeze({
        permissions: Object.freeze([
          Object.freeze({code: APPROVAL_PERMISSION, effect: "ALLOW"}),
        ]),
      }),
      sourceFingerprint: "fingerprint-1",
      ...snapshotOverrides,
    }),
    policies,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {approval: 0, capability: 0, authorization: 0};
  const values = {
    step: Object.hasOwn(overrides, "step") ? overrides.step : step(),
    run: run(),
    definition: definition(),
    toolSet: toolSet(),
    member: member(),
    toolDefinition: toolDefinition(),
    approval: Object.hasOwn(overrides, "approval") ? overrides.approval : approval(),
    capability: capability(),
    authorizationState: Object.hasOwn(overrides, "authorizationState")
      ? overrides.authorizationState
      : authorizationState(),
  };

  const readers = {
    stepReader: {
      async loadForContext() {
        order.push("step");
        if (overrides.stepError) throw overrides.stepError;
        return values.step;
      },
    },
    runReader: {
      async loadForContext() {
        order.push("run");
        return values.run;
      },
    },
    definitionReader: {
      async loadForContext() {
        order.push("definition");
        return values.definition;
      },
    },
    toolSetReader: {
      async loadForContext() {
        order.push("toolSet");
        return values.toolSet;
      },
    },
    memberReader: {
      async loadForContext() {
        order.push("member");
        return values.member;
      },
    },
    toolDefinitionReader: {
      async loadById() {
        order.push("toolDefinition");
        return values.toolDefinition;
      },
    },
    approvalReader: {
      async loadForContext() {
        order.push("approval");
        calls.approval += 1;
        return values.approval;
      },
    },
    capabilityReader: {
      async loadByCode() {
        order.push("capability");
        calls.capability += 1;
        return values.capability;
      },
    },
    authorizationReader: {
      async load(input) {
        order.push("authorization");
        calls.authorization += 1;
        if (overrides.authorizationError) throw overrides.authorizationError;
        return values.authorizationState;
      },
    },
  };

  const registry = new OperationRegistry();
  registry.register(operation());

  return {order, calls, values, readers, registry};
}

async function load(f, inputOverrides = {}) {
  return loadAIAgentStepApprovedApproverRbacCurrentEvidence(
    {
      requestContext: actingContext(),
      agentStepId: ids.step,
      approverRequestContext: approverContext(),
      ...inputOverrides,
    },
    f.readers.stepReader,
    f.readers.runReader,
    f.readers.definitionReader,
    f.readers.toolSetReader,
    f.readers.memberReader,
    f.readers.toolDefinitionReader,
    f.readers.approvalReader,
    f.registry,
    f.readers.capabilityReader,
    f.readers.authorizationReader,
  );
}

test("AISTEP-RBACREAD-BASE-001 exact DD-422 parent evidence is established first with unchanged inputs/dependencies", async () => {
  const f = fixture();
  const acting = actingContext();
  const current = approverContext();
  const result = await load(f, {
    requestContext: acting,
    approverRequestContext: current,
  });

  assert.ok(result);
  assert.deepEqual(f.order, [
    "step", "run", "definition", "toolSet", "member", "toolDefinition",
    "approval", "capability", "authorization",
  ]);
  assert.equal(result.parent.approverRequestContext, current);
  assert.equal(result.parent.parent.parent.parent.approval, f.values.approval);
});

test("AISTEP-RBACREAD-BASE-002 DD-422 null/error short-circuits or propagates before Authorization access", async () => {
  const expected = new Error("parent-failed");
  const f = fixture({stepError: expected});
  await assert.rejects(load(f), error => error === expected);
  assert.deepEqual(f.order, ["step"]);
  assert.equal(f.calls.authorization, 0);
});

test("AISTEP-RBACREAD-BRANCH-001 no approval performs zero Authorization reads and returns frozen exact parent-only evidence", async () => {
  const f = fixture({
    step: step({approvalId: undefined}),
    approval: null,
  });
  const result = await load(f, {approverRequestContext: undefined});
  assert.ok(result);
  assert.equal(f.calls.approval, 0);
  assert.equal(f.calls.authorization, 0);
  assert.equal("authorizationState" in result, false);
  assert.equal("permission" in result, false);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(Object.isFrozen(result), true);
});

test("AISTEP-RBACREAD-READ-001 approval branch reads exact trusted approver context and persisted requiredPermission once", async () => {
  const f = fixture();
  const current = approverContext();
  const result = await load(f, {approverRequestContext: current});

  assert.ok(result);
  assert.equal(f.calls.authorization, 1);
  assert.equal(f.order.at(-1), "authorization");
  assert.equal(result.parent.approverRequestContext, current);
  assert.equal(result.parent.parent.parent.parent.approval.requiredPermission, APPROVAL_PERMISSION);
  assert.notEqual(
    result.parent.parent.parent.operationContract.permissionCode,
    APPROVAL_PERMISSION,
  );
});

test("AISTEP-RBACREAD-READ-002 Authorization errors propagate unchanged with no ToolDefinition/OperationContract permission fallback", async () => {
  const expected = new Error("authorization-unavailable");
  const f = fixture({authorizationError: expected});
  await assert.rejects(load(f), error => error === expected);
  assert.equal(f.calls.authorization, 1);
  assert.equal(f.values.toolDefinition.requiredPermission, "tool.permission.different");
});

test("AISTEP-RBACREAD-CUR-001 exact current snapshot plus one RBAC ALLOW passes and preserves exact permission", async () => {
  const state = authorizationState();
  const f = fixture({authorizationState: state});
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.authorizationState, state);
  assert.equal(result.permission, state.permissionSnapshot.permissionSet.permissions[0]);
  assert.equal(result.permission.effect, "ALLOW");
});

test("AISTEP-RBACREAD-CUR-002 stale/mismatched current snapshot or missing/DENY/duplicate exact permission fails closed", async () => {
  const cases = [
    {
      context: approverContext(),
      state: authorizationState({permissionSnapshot: {scopeClass: "TENANT_CORE"}}),
    },
    {
      context: approverContext({permissionVersion: undefined}),
      state: authorizationState(),
    },
    {
      context: approverContext({permissionVersion: 12}),
      state: authorizationState(),
    },
    {
      context: approverContext(),
      state: authorizationState({permissionSnapshot: {roleIds: Object.freeze([ids.roleB, ids.roleA])}}),
    },
    {
      context: approverContext(),
      state: authorizationState({permissionSnapshot: {
        permissionSet: Object.freeze({permissions: Object.freeze([])}),
      }}),
    },
    {
      context: approverContext(),
      state: authorizationState({permissionSnapshot: {
        permissionSet: Object.freeze({permissions: Object.freeze([
          Object.freeze({code: APPROVAL_PERMISSION, effect: "DENY"}),
        ])}),
      }}),
    },
    {
      context: approverContext(),
      state: authorizationState({permissionSnapshot: {
        permissionSet: Object.freeze({permissions: Object.freeze([
          Object.freeze({code: APPROVAL_PERMISSION, effect: "ALLOW"}),
          Object.freeze({code: APPROVAL_PERMISSION, effect: "ALLOW"}),
        ])}),
      }}),
    },
  ];

  for (const candidate of cases) {
    const f = fixture({authorizationState: candidate.state});
    assert.equal(
      await load(f, {approverRequestContext: candidate.context}),
      null,
    );
    assert.equal(f.calls.authorization, 1);
  }
});

test("AISTEP-RBACREAD-EVID-001 success preserves parent state permission raw ABAC operation and capability references unchanged", async () => {
  const state = authorizationState();
  const current = approverContext();
  const f = fixture({authorizationState: state});
  const before = JSON.stringify([
    f.values.step, f.values.approval, f.values.toolDefinition,
    f.values.capability, current, state,
  ]);

  const result = await load(f, {approverRequestContext: current});
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.approverRequestContext, current);
  assert.equal(result.authorizationState, state);
  assert.equal(result.authorizationState.policies, state.policies);
  assert.equal(result.permission, state.permissionSnapshot.permissionSet.permissions[0]);
  assert.equal(result.parent.parent.capability, f.values.capability);
  assert.equal(result.parent.parent.parent.operationContract.permissionCode, "operation.permission.different");
  assert.equal(result.parent.parent.parent.parent.approval, f.values.approval);
  assert.equal(
    JSON.stringify([
      f.values.step, f.values.approval, f.values.toolDefinition,
      f.values.capability, current, state,
    ]),
    before,
  );
});

test("AISTEP-RBACREAD-BOUND-001 result exposes no permission compatibility full authorization approval transition dispatch mutation routing or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  assert.equal(result.parent.parent.parent.parent.approval.requiredPermission, APPROVAL_PERMISSION);
  assert.equal(result.parent.parent.parent.operationContract.permissionCode, "operation.permission.different");

  for (const forbidden of [
    "permissionCompatible",
    "toolOperationCompatible",
    "authorizationDecision",
    "accessDecision",
    "decision",
    "abacSatisfied",
    "commercialAllowed",
    "entitlementAllowed",
    "resourceAllowed",
    "approvalSatisfied",
    "approvalAuthorized",
    "guardResult",
    "resumeAuthorized",
    "cancelAuthorized",
    "dispatchAuthorized",
    "mutation",
    "eventEmitted",
    "providerAuthorized",
    "modelAuthorized",
    "executionAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
