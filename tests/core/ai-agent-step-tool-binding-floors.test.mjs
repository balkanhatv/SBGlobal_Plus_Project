import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIAgentStepToolBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  step: "11111111-1111-4111-8111-111111111111",
  run: "22222222-2222-4222-8222-222222222222",
  otherRun: "33333333-3333-4333-8333-333333333333",
  definition: "44444444-4444-4444-8444-444444444444",
  otherDefinition: "55555555-5555-4555-8555-555555555555",
  toolSet: "66666666-6666-4666-8666-666666666666",
  otherToolSet: "77777777-7777-4777-8777-777777777777",
  member: "88888888-8888-4888-8888-888888888888",
  otherMember: "99999999-9999-4999-8999-999999999999",
  tool: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  otherTool: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  tenant: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  principal: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  approval: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  operation: "ffffffff-ffff-4fff-8fff-ffffffffffff",
});

const baseStep = Object.freeze({
  id: ids.step,
  runId: ids.run,
  ordinal: 1,
  stepType: "TOOL",
  inputRef: "opaque-input",
  outputRef: "opaque-output",
  toolBindingId: ids.member,
  approvalId: ids.approval,
  status: "PENDING",
  startedAt: "2026-09-24T12:00:00.000Z",
  completedAt: "2026-09-24T12:01:00.000Z",
  auditRef: "opaque-audit",
});

const baseRun = Object.freeze({
  id: ids.run,
  agentDefinitionId: ids.definition,
  tenantId: ids.tenant,
  actingPrincipalId: ids.principal,
  entitlementSnapshotVersion: "opaque-entitlement",
  permissionVersion: "opaque-permission",
  requestedResourceScope: Object.freeze({anything: true}),
  status: "RUNNING",
  stepBudgetClass: "opaque-step-budget",
  tokenBudgetClass: "opaque-token-budget",
  startedAt: "2026-09-24T12:00:00.000Z",
  correlationId: ids.approval,
});

const baseDefinition = Object.freeze({
  id: ids.definition,
  ownerScope: "TENANT",
  tenantId: ids.tenant,
  code: "opaque-agent",
  objectiveClass: "opaque-objective",
  allowedToolSetId: ids.toolSet,
  maxRiskClass: "opaque-risk",
  approvalPolicyId: ids.approval,
  budgetPolicyId: ids.approval,
  version: 7,
  status: "RETIRED",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

const baseMember = Object.freeze({
  id: ids.member,
  toolSetId: ids.toolSet,
  toolDefinitionId: ids.tool,
  enabled: true,
  constraint: Object.freeze({anything: true}),
  createdAt: "2026-09-20T00:00:00.000Z",
});

const baseTool = Object.freeze({
  id: ids.tool,
  toolId: "opaque.tool",
  capabilityCode: "opaque.capability",
  operationContractId: ids.operation,
  scopeClass: "EXPLICIT_CROSS_CONTEXT",
  requiredPermission: "opaque.permission",
  requiredEntitlement: "opaque.entitlement",
  inputSchemaVersion: 999,
  outputSchemaVersion: 999,
  sideEffectClass: "HIGH",
  approvalPolicyId: ids.approval,
  idempotencyRequired: false,
  auditClass: "opaque-audit",
  status: "ACTIVE",
  version: 999,
  createdAt: "not-interpreted",
  updatedAt: "not-interpreted",
});

function step(overrides = {}) {
  return Object.freeze({...baseStep, ...overrides});
}

function run(overrides = {}) {
  return Object.freeze({...baseRun, ...overrides});
}

function definition(overrides = {}) {
  return Object.freeze({...baseDefinition, ...overrides});
}

function member(overrides = {}) {
  return Object.freeze({...baseMember, ...overrides});
}

function toolDefinition(overrides = {}) {
  return Object.freeze({...baseTool, ...overrides});
}

test("AISTEP-TOOL-CUR-001 exact TOOL binding chain matches", () => {
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run(),
      definition(),
      member(),
      toolDefinition(),
    ),
    true,
  );
});

test("AISTEP-TOOL-CUR-002 wrong run or AgentDefinition parent id fails closed", () => {
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run({id: ids.otherRun}),
      definition(),
      member(),
      toolDefinition(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run({agentDefinitionId: ids.otherDefinition}),
      definition(),
      member(),
      toolDefinition(),
    ),
    false,
  );
});

test("AISTEP-TOOL-CUR-003 wrong or missing member/tool definition fails closed", () => {
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run(),
      definition(),
      member({id: ids.otherMember}),
      toolDefinition(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run(),
      definition(),
      member(),
      toolDefinition({id: ids.otherTool}),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run(),
      definition(),
      undefined,
      undefined,
    ),
    false,
  );
});

test("AISTEP-TOOL-CUR-004 disabled/non-ACTIVE/outside-allowed-tool-set fails closed", () => {
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run(),
      definition(),
      member({enabled: false}),
      toolDefinition(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run(),
      definition(),
      member(),
      toolDefinition({status: "RETIRED"}),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run(),
      definition(),
      member({toolSetId: ids.otherToolSet}),
      toolDefinition(),
    ),
    false,
  );
});

test("AISTEP-TOOL-CUR-005 valid non-TOOL step requires no binding evidence", () => {
  for (const stepType of ["PLAN", "RAG", "APPROVAL", "INFERENCE"]) {
    assert.equal(
      matchesAIAgentStepToolBindingFloors(
        step({stepType, toolBindingId: undefined}),
        run(),
        definition(),
      ),
      true,
      stepType,
    );
  }

  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step({stepType: "PLAN"}),
      run(),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step({stepType: "PLAN", toolBindingId: undefined}),
      run(),
      definition(),
      member(),
      toolDefinition(),
    ),
    false,
  );
});

test("AISTEP-TOOL-CUR-006 malformed identifiers or unsupported step type fail closed", () => {
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step({id: "not-a-uuid"}),
      run(),
      definition(),
      member(),
      toolDefinition(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step({stepType: "UNSUPPORTED", toolBindingId: undefined}),
      run(),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      step(),
      run(),
      definition({allowedToolSetId: "not-a-uuid"}),
      member(),
      toolDefinition(),
    ),
    false,
  );
});

test("AISTEP-TOOL-CUR-007 unrelated policy/runtime evidence stays uninterpreted without mutation", () => {
  const candidateStep = step({
    ordinal: -99,
    approvalId: "not-interpreted",
    status: "FAILED",
    startedAt: "not-interpreted",
    completedAt: "not-interpreted",
    auditRef: "",
  });
  const candidateRun = run({
    actingPrincipalId: "not-interpreted",
    membershipId: "not-interpreted",
    entitlementSnapshotVersion: "",
    permissionVersion: "",
    requestedResourceScope: Object.freeze(null),
    status: "CANCELLED",
    stepBudgetClass: "",
    tokenBudgetClass: "",
  });
  const candidateDefinition = definition({
    ownerScope: "PLATFORM",
    tenantId: ids.tenant,
    version: -99,
    status: "RETIRED",
    maxRiskClass: "",
  });
  const candidateMember = member({
    constraint: Object.freeze({uninterpreted: true}),
  });
  const candidateTool = toolDefinition({
    scopeClass: "EXPLICIT_CROSS_CONTEXT",
    requiredPermission: "",
    requiredEntitlement: null,
    approvalPolicyId: null,
    operationContractId: "not-interpreted",
    idempotencyRequired: false,
    sideEffectClass: "HIGH",
  });

  const before = [
    JSON.stringify(candidateStep),
    JSON.stringify(candidateRun),
    JSON.stringify(candidateDefinition),
    JSON.stringify(candidateMember),
    JSON.stringify(candidateTool),
  ];

  assert.equal(
    matchesAIAgentStepToolBindingFloors(
      candidateStep,
      candidateRun,
      candidateDefinition,
      candidateMember,
      candidateTool,
    ),
    true,
  );

  assert.deepEqual([
    JSON.stringify(candidateStep),
    JSON.stringify(candidateRun),
    JSON.stringify(candidateDefinition),
    JSON.stringify(candidateMember),
    JSON.stringify(candidateTool),
  ], before);
});
