import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIAgentStepApprovalBacklinkFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  step: "11111111-1111-4111-8111-111111111111",
  otherStep: "22222222-2222-4222-8222-222222222222",
  run: "33333333-3333-4333-8333-333333333333",
  otherRun: "44444444-4444-4444-8444-444444444444",
  approval: "55555555-5555-4555-8555-555555555555",
  otherApproval: "66666666-6666-4666-8666-666666666666",
  tenant: "77777777-7777-4777-8777-777777777777",
  industry: "88888888-8888-4888-8888-888888888888",
  principal: "99999999-9999-4999-8999-999999999999",
  correlation: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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

const baseApproval = Object.freeze({
  id: ids.approval,
  runId: ids.run,
  stepId: ids.step,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  requestedByAgent: true,
  approvalType: "HIGH_RISK_TOOL",
  requiredPermission: "opaque.permission",
  approverPrincipalId: ids.principal,
  status: "REJECTED",
  requestSummarySafe: "opaque",
  approvedAt: "2026-09-24T12:01:00.000Z",
  reason: "opaque",
  correlationId: ids.correlation,
  createdAt: "2026-09-24T12:00:30.000Z",
});

function step(overrides = {}) {
  return Object.freeze({...baseStep, ...overrides});
}

function approval(overrides = {}) {
  return Object.freeze({...baseApproval, ...overrides});
}

test("AISTEP-APP-CUR-001 unbound step with no approval evidence matches", () => {
  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(
      step({approvalId: undefined}),
      undefined,
    ),
    true,
  );
});

test("AISTEP-APP-CUR-002 exact approval id/run/step backlink matches", () => {
  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(step(), approval()),
    true,
  );
});

test("AISTEP-APP-CUR-003 wrong approval id fails closed", () => {
  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(
      step(),
      approval({id: ids.otherApproval}),
    ),
    false,
  );
});

test("AISTEP-APP-CUR-004 wrong run or step backlink fails closed", () => {
  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(
      step(),
      approval({runId: ids.otherRun}),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(
      step(),
      approval({stepId: ids.otherStep}),
    ),
    false,
  );
});

test("AISTEP-APP-CUR-005 unexpected approval evidence for unbound step fails", () => {
  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(
      step({approvalId: undefined}),
      approval(),
    ),
    false,
  );
});

test("AISTEP-APP-CUR-006 malformed step or approval identifiers fail closed", () => {
  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(
      step({id: "not-a-uuid"}),
      approval(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(
      step(),
      approval({runId: "not-a-uuid"}),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(
      step({approvalId: "not-a-uuid"}),
      approval(),
    ),
    false,
  );
});

test("AISTEP-APP-CUR-007 approval/runtime semantics remain uninterpreted without mutation", () => {
  const candidateStep = step({
    ordinal: -99,
    stepType: "TOOL",
    toolBindingId: "not-interpreted",
    status: "FAILED",
    startedAt: "not-interpreted",
    completedAt: "not-interpreted",
    auditRef: "not-interpreted",
  });
  const candidateApproval = approval({
    tenantId: "not-interpreted",
    industryContextId: "not-interpreted",
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

  const beforeStep = JSON.stringify(candidateStep);
  const beforeApproval = JSON.stringify(candidateApproval);

  assert.equal(
    matchesAIAgentStepApprovalBacklinkFloors(
      candidateStep,
      candidateApproval,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateStep), beforeStep);
  assert.equal(JSON.stringify(candidateApproval), beforeApproval);
});
