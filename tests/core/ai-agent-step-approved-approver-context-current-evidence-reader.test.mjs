import test from "node:test";
import assert from "node:assert/strict";

import {
  OperationRegistry,
  loadAIAgentStepApprovedApproverContextCurrentEvidence,
  matchesAIAgentApprovalApproverContextFloor,
  matchesAIAgentApprovalPersistedApprovedFloor,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  siblingIndustry: "23232323-2323-4232-8232-232323232323",
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
  correlation: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  capability: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
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
    membershipId: "abababab-abab-4bab-8bab-abababababab",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
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
    requiredPermission: "raw.approval.permission",
    approverPrincipalId: ids.approver,
    status: "APPROVED",
    requestSummarySafe: "safe summary",
    approvedAt: "2026-10-03T00:00:00.000Z",
    reason: "raw reason",
    correlationId: ids.correlation,
    createdAt: "2026-10-03T01:00:00.000Z",
    ...overrides,
  });
}

test("AIAPP-APPROVED-CUR-001 exact APPROVED persisted evidence passes", () => {
  assert.equal(matchesAIAgentApprovalPersistedApprovedFloor(approval()), true);
});

test("AIAPP-APPROVED-CUR-002 non-approved or malformed required approval evidence fails closed", () => {
  for (const status of ["PENDING", "REJECTED", "EXPIRED"]) {
    assert.equal(matchesAIAgentApprovalPersistedApprovedFloor(approval({status})), false);
  }
  assert.equal(matchesAIAgentApprovalPersistedApprovedFloor(
    approval({approverPrincipalId: undefined}),
  ), false);
  assert.equal(matchesAIAgentApprovalPersistedApprovedFloor(
    approval({approvedAt: undefined}),
  ), false);
  assert.equal(matchesAIAgentApprovalPersistedApprovedFloor(
    approval({approverPrincipalId: "bad"}),
  ), false);
  assert.equal(matchesAIAgentApprovalPersistedApprovedFloor(
    approval({approvedAt: "not-a-time"}),
  ), false);
});

test("AIAPP-APPROVED-CUR-003 unrelated fields stay raw and no timestamp ordering rule is invented", () => {
  const value = approval({
    approvalType: "",
    requiredPermission: "",
    requestedByAgent: false,
    approvedAt: "2026-10-03T00:00:00.000Z",
    createdAt: "2026-10-03T23:59:59.000Z",
    reason: "",
  });
  const before = JSON.stringify(value);
  assert.equal(matchesAIAgentApprovalPersistedApprovedFloor(value), true);
  assert.equal(JSON.stringify(value), before);
});

test("AIAPP-CTX-CUR-001 exact approver principal and Tenant-Core context passes Tenant-Core approval", () => {
  const coreApproval = approval({industryContextId: undefined});
  const context = approverContext({
    scopeClass: "TENANT_CORE",
    industryContextId: undefined,
  });
  assert.equal(matchesAIAgentApprovalApproverContextFloor(coreApproval, context), true);
});

test("AIAPP-CTX-CUR-002 same-Tenant Tenant-Industry context may carry Tenant-Core approval evidence without permission inference", () => {
  const coreApproval = approval({industryContextId: undefined});
  assert.equal(
    matchesAIAgentApprovalApproverContextFloor(coreApproval, approverContext()),
    true,
  );
});

test("AIAPP-CTX-CUR-003 Industry approval requires exact Tenant-Industry context", () => {
  assert.equal(
    matchesAIAgentApprovalApproverContextFloor(approval(), approverContext()),
    true,
  );
  assert.equal(
    matchesAIAgentApprovalApproverContextFloor(
      approval(),
      approverContext({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    ),
    false,
  );
});

test("AIAPP-CTX-CUR-004 wrong principal/Tenant/Industry or untrusted scope fails closed", () => {
  const value = approval();
  const foreignTenant = "12121212-1212-4212-8212-121212121212";
  for (const context of [
    approverContext({principalId: ids.actor}),
    approverContext({tenantId: foreignTenant}),
    approverContext({industryContextId: ids.siblingIndustry}),
    approverContext({industryContextId: undefined}),
    approverContext({scopeClass: "PUBLIC", tenantId: undefined, industryContextId: undefined}),
    approverContext({scopeClass: "PLATFORM_GLOBAL", tenantId: undefined, industryContextId: undefined}),
    approverContext({scopeClass: "EXPLICIT_CROSS_CONTEXT"}),
    approverContext({principalId: "bad"}),
  ]) {
    assert.equal(matchesAIAgentApprovalApproverContextFloor(value, context), false);
  }
});

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
    startedAt: "2026-10-03T00:00:00.000Z",
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
    startedAt: "2026-10-03T00:00:00.000Z",
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
    createdAt: "2026-10-03T00:00:00.000Z",
    updatedAt: "2026-10-03T00:00:00.000Z",
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
    createdAt: "2026-10-03T00:00:00.000Z",
    updatedAt: "2026-10-03T00:00:00.000Z",
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
    createdAt: "2026-10-03T00:00:00.000Z",
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
    requiredPermission: "tool.permission",
    requiredEntitlement: "tool.entitlement",
    inputSchemaVersion: 1,
    outputSchemaVersion: 1,
    sideEffectClass: "HIGH",
    approvalPolicyId: ids.approval,
    idempotencyRequired: true,
    auditClass: "TOOL_AUDIT",
    status: "ACTIVE",
    version: 1,
    createdAt: "2026-10-03T00:00:00.000Z",
    updatedAt: "2026-10-03T00:00:00.000Z",
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
    permissionCode: "operation.permission",
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

function fixture(overrides = {}) {
  const order = [];
  const calls = {approval: 0, capability: 0};
  const values = {
    step: Object.hasOwn(overrides, "step") ? overrides.step : step(),
    run: run(),
    definition: definition(),
    toolSet: toolSet(),
    member: member(),
    toolDefinition: toolDefinition(),
    approval: Object.hasOwn(overrides, "approval") ? overrides.approval : approval(),
    capability: capability(),
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
  };

  const registry = new OperationRegistry();
  registry.register(operation());

  return {order, calls, values, readers, registry};
}

async function load(f, inputOverrides = {}) {
  const input = {
    requestContext: actingContext(),
    agentStepId: ids.step,
    approverRequestContext: approverContext(),
    ...inputOverrides,
  };
  return loadAIAgentStepApprovedApproverContextCurrentEvidence(
    input,
    f.readers.stepReader,
    f.readers.runReader,
    f.readers.definitionReader,
    f.readers.toolSetReader,
    f.readers.memberReader,
    f.readers.toolDefinitionReader,
    f.readers.approvalReader,
    f.registry,
    f.readers.capabilityReader,
  );
}

test("AISTEP-APPCTX-BASE-001 exact DD-417 parent resolves first and parent errors propagate", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.deepEqual(f.order, [
    "step", "run", "definition", "toolSet", "member", "toolDefinition",
    "approval", "capability",
  ]);

  const expected = new Error("parent-failed");
  const broken = fixture({stepError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["step"]);
  assert.equal(broken.calls.approval, 0);
  assert.equal(broken.calls.capability, 0);
});

test("AISTEP-APPCTX-BRANCH-001 no persisted approval returns exact frozen parent-only evidence", async () => {
  const f = fixture({
    step: step({approvalId: undefined}),
    approval: null,
  });
  const result = await load(f, {approverRequestContext: undefined});
  assert.ok(result);
  assert.equal("approverRequestContext" in result, false);
  assert.equal(f.calls.approval, 0);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(Object.isFrozen(result), true);
});

test("AISTEP-APPCTX-APPROVAL-001 persisted approval requires exact current approver context", async () => {
  const missing = fixture();
  assert.equal(await load(missing, {approverRequestContext: undefined}), null);

  const wrong = fixture();
  assert.equal(await load(wrong, {
    approverRequestContext: approverContext({principalId: ids.actor}),
  }), null);

  const pending = fixture({approval: approval({status: "PENDING", approverPrincipalId: undefined, approvedAt: undefined})});
  assert.equal(await load(pending), null);

  const valid = fixture();
  assert.ok(await load(valid));
});

test("AISTEP-APPCTX-EVID-001 success preserves exact parent and supplied approver RequestContext references", async () => {
  const f = fixture();
  const currentApprover = approverContext();
  const result = await load(f, {approverRequestContext: currentApprover});
  assert.ok(result);
  assert.equal(result.approverRequestContext, currentApprover);
  assert.equal(result.parent.parent.parent.approval, f.values.approval);
  assert.equal(result.parent.capability, f.values.capability);
  assert.equal(Object.isFrozen(result), true);
});

test("AISTEP-APPCTX-BOUND-001 context evidence grants no permission approval satisfaction guard resume dispatch or execution authority", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  for (const forbidden of [
    "requiredPermissionGranted",
    "permissionGranted",
    "approvalSatisfied",
    "approvalAuthorized",
    "guardResult",
    "commercialAllowed",
    "resumeAuthorized",
    "cancelAuthorized",
    "dispatchAuthorized",
    "executionAuthorized",
    "providerAuthorized",
    "modelAuthorized",
  ]) {
    assert.equal(forbidden in result, false);
  }
  assert.equal(result.parent.parent.parent.approval.requiredPermission, "raw.approval.permission");
});
