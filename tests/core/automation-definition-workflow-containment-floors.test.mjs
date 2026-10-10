import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAutomationDefinitionWorkflowDefinitionContainmentFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  automation: "11111111-1111-4111-8111-111111111111",
  workflow: "22222222-2222-4222-8222-222222222222",
  otherWorkflow: "33333333-3333-4333-8333-333333333333",
  tenantA: "44444444-4444-4444-8444-444444444444",
  tenantB: "55555555-5555-4555-8555-555555555555",
  industryA: "66666666-6666-4666-8666-666666666666",
  industryB: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
});

const baseAutomation = Object.freeze({
  id: ids.automation,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque-automation",
  version: 4,
  status: "ACTIVE",
  schemaVersion: 2,
  triggerType: "EVENT",
  triggerConfig: Object.freeze({anything: true}),
  conditionRuleRef: "opaque-condition",
  operationContractId: "opaque-operation",
  workflowDefinitionId: ids.workflow,
  config: Object.freeze({anything: true}),
  createdBy: ids.principal,
  approvedBy: ids.principal,
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  effectiveTo: "2027-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
});

const baseWorkflow = Object.freeze({
  id: ids.workflow,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque-workflow",
  version: 9,
  status: "RETIRED",
  schemaVersion: 7,
  stateMachine: Object.freeze({anything: true}),
  approvalPolicy: Object.freeze({anything: true}),
  ruleRefs: Object.freeze(["opaque"]),
  createdBy: ids.principal,
  approvedBy: ids.principal,
  effectiveFrom: "not-interpreted",
  effectiveTo: "not-interpreted",
  createdAt: "not-interpreted",
  updatedAt: "not-interpreted",
});

function automation(overrides = {}) {
  return Object.freeze({...baseAutomation, ...overrides});
}

function workflow(overrides = {}) {
  return Object.freeze({...baseWorkflow, ...overrides});
}

test("WFA-DEF-WF-CUR-001 unbound automation requires no WorkflowDefinition evidence", () => {
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation({workflowDefinitionId: undefined}),
      undefined,
    ),
    true,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation({workflowDefinitionId: undefined}),
      workflow(),
    ),
    false,
  );
});

test("WFA-DEF-WF-CUR-002 PLATFORM automation accepts PLATFORM workflow only", () => {
  const platformAutomation = automation({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });

  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      platformAutomation,
      workflow({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    true,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      platformAutomation,
      workflow({ownerScope: "TENANT", industryContextId: undefined}),
    ),
    false,
  );
});

test("WFA-DEF-WF-CUR-003 TENANT automation accepts PLATFORM or same-Tenant TENANT parent", () => {
  const tenantAutomation = automation({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });

  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      tenantAutomation,
      workflow({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    true,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      tenantAutomation,
      workflow({ownerScope: "TENANT", industryContextId: undefined}),
    ),
    true,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      tenantAutomation,
      workflow({ownerScope: "TENANT", tenantId: ids.tenantB, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      tenantAutomation,
      workflow(),
    ),
    false,
  );
});

test("WFA-DEF-WF-CUR-004 INDUSTRY automation accepts broader/equal parent only", () => {
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation(),
      workflow({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    true,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation(),
      workflow({ownerScope: "TENANT", industryContextId: undefined}),
    ),
    true,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation(),
      workflow(),
    ),
    true,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation(),
      workflow({industryContextId: ids.industryB}),
    ),
    false,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation(),
      workflow({tenantId: ids.tenantB, industryContextId: ids.industryA}),
    ),
    false,
  );
});

test("WFA-DEF-WF-CUR-005 wrong, missing or malformed WorkflowDefinition identity fails", () => {
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation(),
      undefined,
    ),
    false,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation(),
      workflow({id: ids.otherWorkflow}),
    ),
    false,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation({workflowDefinitionId: "not-a-uuid"}),
      workflow(),
    ),
    false,
  );
});

test("WFA-DEF-WF-CUR-006 malformed owner shape fails closed", () => {
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
      workflow({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation(),
      workflow({ownerScope: "TENANT", tenantId: ids.tenantA, industryContextId: ids.industryA}),
    ),
    false,
  );
  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automation({industryContextId: "not-a-uuid"}),
      workflow(),
    ),
    false,
  );
});

test("WFA-DEF-WF-CUR-007 status/version/effective/runtime semantics remain uninterpreted without mutation", () => {
  const candidateAutomation = automation({
    code: "",
    version: -99,
    status: "DRAFT",
    schemaVersion: -7,
    triggerType: "MANUAL",
    triggerConfig: Object.freeze(null),
    conditionRuleRef: "",
    operationContractId: undefined,
    config: Object.freeze(null),
    createdBy: "",
    approvedBy: undefined,
    effectiveFrom: "not-interpreted",
    effectiveTo: "not-interpreted",
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });
  const candidateWorkflow = workflow({
    code: "",
    version: -99,
    status: "RETIRED",
    schemaVersion: -7,
    stateMachine: Object.freeze(null),
    approvalPolicy: Object.freeze(null),
    ruleRefs: Object.freeze([]),
    createdBy: "",
    approvedBy: undefined,
    effectiveFrom: "not-interpreted",
    effectiveTo: "not-interpreted",
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  const beforeAutomation = JSON.stringify(candidateAutomation);
  const beforeWorkflow = JSON.stringify(candidateWorkflow);

  assert.equal(
    matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      candidateAutomation,
      candidateWorkflow,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateAutomation), beforeAutomation);
  assert.equal(JSON.stringify(candidateWorkflow), beforeWorkflow);
});
