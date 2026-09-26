import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAutomationRunDefinitionBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  run: "11111111-1111-4111-8111-111111111111",
  tenantA: "22222222-2222-4222-8222-222222222222",
  tenantB: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  definition: "66666666-6666-4666-8666-666666666666",
  otherDefinition: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
  correlation: "99999999-9999-4999-8999-999999999999",
});

const baseRun = Object.freeze({
  id: ids.run,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  automationDefinitionId: ids.definition,
  triggerRef: "opaque-trigger",
  idempotencyKeyHash: "opaque-hash",
  status: "PENDING",
  startedAt: "2026-09-24T06:00:00.000Z",
  correlationId: ids.correlation,
});

const baseDefinition = Object.freeze({
  id: ids.definition,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque",
  version: 7,
  status: "ACTIVE",
  schemaVersion: 3,
  triggerType: "EVENT",
  triggerConfig: Object.freeze({anything: true}),
  conditionRuleRef: "opaque-condition",
  operationContractId: "opaque-operation",
  config: Object.freeze({anything: true}),
  createdBy: ids.principal,
  approvedBy: ids.principal,
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  effectiveTo: "2027-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
});

function run(overrides = {}) {
  return Object.freeze({...baseRun, ...overrides});
}

function definition(overrides = {}) {
  return Object.freeze({...baseDefinition, ...overrides});
}

test("WFA-RUN-DEF-CUR-001 ACTIVE PLATFORM definition applies to Core and Industry runs", () => {
  const platform = definition({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(
      run({industryContextId: undefined}),
      platform,
    ),
    true,
  );
  assert.equal(matchesAutomationRunDefinitionBindingFloors(run(), platform), true);
});

test("WFA-RUN-DEF-CUR-002 same-Tenant TENANT definition applies to Core/Industry and foreign Tenant fails", () => {
  const tenantDefinition = definition({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(
      run({industryContextId: undefined}),
      tenantDefinition,
    ),
    true,
  );
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(run(), tenantDefinition),
    true,
  );
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(
      run(),
      definition({ownerScope: "TENANT", tenantId: ids.tenantB, industryContextId: undefined}),
    ),
    false,
  );
});

test("WFA-RUN-DEF-CUR-003 INDUSTRY definition applies only to exact same-Tenant Industry", () => {
  assert.equal(matchesAutomationRunDefinitionBindingFloors(run(), definition()), true);
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(
      run({industryContextId: ids.industryB}),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(
      run({industryContextId: undefined}),
      definition(),
    ),
    false,
  );
});

test("WFA-RUN-DEF-CUR-004 wrong definition id fails", () => {
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(
      run(),
      definition({id: ids.otherDefinition}),
    ),
    false,
  );
});

test("WFA-RUN-DEF-CUR-005 non-ACTIVE definition states fail", () => {
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"]) {
    assert.equal(
      matchesAutomationRunDefinitionBindingFloors(
        run(),
        definition({status}),
      ),
      false,
      status,
    );
  }
});

test("WFA-RUN-DEF-CUR-006 malformed run/definition ownership fails closed", () => {
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(
      run({id: "not-a-uuid"}),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(
      run(),
      definition({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(
      run({industryContextId: "not-a-uuid"}),
      definition(),
    ),
    false,
  );
});

test("WFA-RUN-DEF-CUR-007 version/effective/trigger/run semantics remain uninterpreted without mutation", () => {
  const candidateRun = run({
    triggerRef: "",
    idempotencyKeyHash: "",
    status: "FAILED",
    startedAt: "not-interpreted",
    completedAt: "not-interpreted",
    correlationId: "not-interpreted",
    lastErrorCode: "",
  });
  const candidateDefinition = definition({
    version: 999,
    schemaVersion: -99,
    triggerType: "MANUAL",
    triggerConfig: Object.freeze(null),
    conditionRuleRef: "",
    operationContractId: undefined,
    workflowDefinitionId: "not-interpreted",
    config: Object.freeze(null),
    createdBy: "",
    approvedBy: undefined,
    effectiveFrom: "not-interpreted",
    effectiveTo: "not-interpreted",
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  const beforeRun = JSON.stringify(candidateRun);
  const beforeDefinition = JSON.stringify(candidateDefinition);

  assert.equal(
    matchesAutomationRunDefinitionBindingFloors(candidateRun, candidateDefinition),
    true,
  );
  assert.equal(JSON.stringify(candidateRun), beforeRun);
  assert.equal(JSON.stringify(candidateDefinition), beforeDefinition);
});
