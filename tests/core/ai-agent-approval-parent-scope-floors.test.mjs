import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIAgentApprovalParentScopeFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  approval: "11111111-1111-4111-8111-111111111111",
  run: "22222222-2222-4222-8222-222222222222",
  otherRun: "33333333-3333-4333-8333-333333333333",
  step: "44444444-4444-4444-8444-444444444444",
  otherStep: "55555555-5555-4555-8555-555555555555",
  tenantA: "66666666-6666-4666-8666-666666666666",
  tenantB: "77777777-7777-4777-8777-777777777777",
  industryA: "88888888-8888-4888-8888-888888888888",
  industryB: "99999999-9999-4999-8999-999999999999",
  definition: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  principal: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  membership: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  correlation: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
});

const baseApproval = Object.freeze({
  id: ids.approval,
  runId: ids.run,
  stepId: ids.step,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  requestedByAgent: true,
  approvalType: "HIGH_RISK_TOOL",
  requiredPermission: "opaque.permission",
  approverPrincipalId: ids.principal,
  status: "APPROVED",
  requestSummarySafe: "opaque",
  approvedAt: "2026-09-24T12:01:00.000Z",
  reason: "opaque",
  correlationId: ids.correlation,
  createdAt: "2026-09-24T12:00:30.000Z",
});

const baseRun = Object.freeze({
  id: ids.run,
  agentDefinitionId: ids.definition,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  actingPrincipalId: ids.principal,
  membershipId: ids.membership,
  entitlementSnapshotVersion: "11",
  permissionVersion: "12",
  requestedResourceScope: Object.freeze({opaque: true}),
  status: "WAITING_APPROVAL",
  stepBudgetClass: "opaque",
  tokenBudgetClass: "opaque",
  startedAt: "2026-09-24T12:00:00.000Z",
  correlationId: ids.correlation,
});

const baseStep = Object.freeze({
  id: ids.step,
  runId: ids.run,
  ordinal: 1,
  stepType: "APPROVAL",
  approvalId: ids.approval,
  status: "PENDING",
  startedAt: "2026-09-24T12:00:00.000Z",
});

function approval(overrides = {}) {
  return Object.freeze({...baseApproval, ...overrides});
}

function run(overrides = {}) {
  return Object.freeze({...baseRun, ...overrides});
}

function step(overrides = {}) {
  return Object.freeze({...baseStep, ...overrides});
}

test("AIAPP-PARENT-CUR-001 exact Tenant-Core approval/run/step chain matches", () => {
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval({industryContextId: undefined}),
      run({industryContextId: undefined}),
      step(),
    ),
    true,
  );
});

test("AIAPP-PARENT-CUR-002 exact Tenant-Industry approval/run/step chain matches", () => {
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(approval(), run(), step()),
    true,
  );
});

test("AIAPP-PARENT-CUR-003 wrong run id or step id fails closed", () => {
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval(),
      run({id: ids.otherRun}),
      step(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval(),
      run(),
      step({id: ids.otherStep}),
    ),
    false,
  );
});

test("AIAPP-PARENT-CUR-004 step belonging to a different run fails closed", () => {
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval(),
      run(),
      step({runId: ids.otherRun}),
    ),
    false,
  );
});

test("AIAPP-PARENT-CUR-005 Tenant, Industry and Core/Industry mismatches fail closed", () => {
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval(),
      run({tenantId: ids.tenantB}),
      step(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval(),
      run({industryContextId: ids.industryB}),
      step(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval({industryContextId: undefined}),
      run(),
      step(),
    ),
    false,
  );
});

test("AIAPP-PARENT-CUR-006 malformed approval/run/step identifiers fail closed", () => {
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval({id: "not-a-uuid"}),
      run(),
      step(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval(),
      run({industryContextId: "not-a-uuid"}),
      step(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      approval(),
      run(),
      step({runId: "not-a-uuid"}),
    ),
    false,
  );
});

test("AIAPP-PARENT-CUR-007 approval/run/step runtime semantics remain uninterpreted without mutation", () => {
  const candidateApproval = approval({
    requestedByAgent: false,
    approvalType: "",
    requiredPermission: "",
    approverPrincipalId: "not-interpreted",
    status: "EXPIRED",
    requestSummarySafe: "",
    approvedAt: "not-interpreted",
    reason: "",
    correlationId: "not-interpreted",
    createdAt: "not-interpreted",
  });
  const candidateRun = run({
    agentDefinitionId: "not-interpreted",
    actingPrincipalId: "not-interpreted",
    membershipId: "not-interpreted",
    entitlementSnapshotVersion: "not-interpreted",
    permissionVersion: "not-interpreted",
    requestedResourceScope: Object.freeze({anything: true}),
    status: "FAILED",
    stepBudgetClass: "",
    tokenBudgetClass: "",
    startedAt: "not-interpreted",
    completedAt: "not-interpreted",
    correlationId: "not-interpreted",
  });
  const candidateStep = step({
    ordinal: -99,
    stepType: "TOOL",
    inputRef: "not-interpreted",
    outputRef: "not-interpreted",
    toolBindingId: "not-interpreted",
    approvalId: "not-interpreted",
    status: "FAILED",
    startedAt: "not-interpreted",
    completedAt: "not-interpreted",
    auditRef: "not-interpreted",
  });

  const beforeApproval = JSON.stringify(candidateApproval);
  const beforeRun = JSON.stringify(candidateRun);
  const beforeStep = JSON.stringify(candidateStep);

  assert.equal(
    matchesAIAgentApprovalParentScopeFloors(
      candidateApproval,
      candidateRun,
      candidateStep,
    ),
    true,
  );

  assert.equal(JSON.stringify(candidateApproval), beforeApproval);
  assert.equal(JSON.stringify(candidateRun), beforeRun);
  assert.equal(JSON.stringify(candidateStep), beforeStep);
});
