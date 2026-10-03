import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIAgentRunDefinitionBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  run: "11111111-1111-4111-8111-111111111111",
  definition: "22222222-2222-4222-8222-222222222222",
  otherDefinition: "33333333-3333-4333-8333-333333333333",
  tenantA: "44444444-4444-4444-8444-444444444444",
  tenantB: "55555555-5555-4555-8555-555555555555",
  industryA: "66666666-6666-4666-8666-666666666666",
  industryB: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
  membership: "99999999-9999-4999-8999-999999999999",
  toolSet: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  approval: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  budget: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  correlation: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
});

const baseRun = Object.freeze({
  id: ids.run,
  agentDefinitionId: ids.definition,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  actingPrincipalId: ids.principal,
  membershipId: ids.membership,
  entitlementSnapshotVersion: "7",
  permissionVersion: "9",
  requestedResourceScope: Object.freeze({opaque: true}),
  status: "RUNNING",
  stepBudgetClass: "opaque",
  tokenBudgetClass: "opaque",
  startedAt: "2026-09-24T06:00:00.000Z",
  completedAt: undefined,
  correlationId: ids.correlation,
});

const baseDefinition = Object.freeze({
  id: ids.definition,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque-agent",
  objectiveClass: "UNINTERPRETED",
  allowedToolSetId: ids.toolSet,
  maxRiskClass: "UNINTERPRETED",
  approvalPolicyId: ids.approval,
  budgetPolicyId: ids.budget,
  version: 4,
  status: "ACTIVE",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

function run(overrides = {}) {
  return Object.freeze({...baseRun, ...overrides});
}

function definition(overrides = {}) {
  return Object.freeze({...baseDefinition, ...overrides});
}

test("AIARUN-DEF-CUR-001 ACTIVE PLATFORM definition applies to Core and Industry runs", () => {
  const platformDefinition = definition({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run({industryContextId: undefined}),
      platformDefinition,
    ),
    true,
  );
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(run(), platformDefinition),
    true,
  );
});

test("AIARUN-DEF-CUR-002 same-Tenant TENANT definition applies to Core/Industry and foreign Tenant fails", () => {
  const tenantDefinition = definition({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run({industryContextId: undefined}),
      tenantDefinition,
    ),
    true,
  );
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(run(), tenantDefinition),
    true,
  );
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run(),
      definition({ownerScope: "TENANT", tenantId: ids.tenantB, industryContextId: undefined}),
    ),
    false,
  );
});

test("AIARUN-DEF-CUR-003 INDUSTRY definition applies only to exact same-Tenant Industry run", () => {
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(run(), definition()),
    true,
  );
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run({industryContextId: ids.industryB}),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run({industryContextId: undefined}),
      definition(),
    ),
    false,
  );
});

test("AIARUN-DEF-CUR-004 wrong definition id fails closed", () => {
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run(),
      definition({id: ids.otherDefinition}),
    ),
    false,
  );
});

test("AIARUN-DEF-CUR-005 non-ACTIVE definition states fail closed", () => {
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED", ""]) {
    assert.equal(
      matchesAIAgentRunDefinitionBindingFloors(
        run(),
        definition({status}),
      ),
      false,
      status,
    );
  }
});

test("AIARUN-DEF-CUR-006 malformed run/definition identities or owner shapes fail closed", () => {
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run({id: "not-a-uuid"}),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run({industryContextId: "not-a-uuid"}),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run(),
      definition({ownerScope: "TENANT", industryContextId: ids.industryA}),
    ),
    false,
  );
  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      run(),
      definition({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
    ),
    false,
  );
});

test("AIARUN-DEF-CUR-007 principal/snapshot/run and definition policy semantics remain uninterpreted without mutation", () => {
  const candidateRun = run({
    actingPrincipalId: "not-interpreted",
    membershipId: "not-interpreted",
    entitlementSnapshotVersion: "not-interpreted",
    permissionVersion: "not-interpreted",
    requestedResourceScope: Object.freeze({anything: Object.freeze([true])}),
    status: "CANCELLED",
    stepBudgetClass: "",
    tokenBudgetClass: "",
    startedAt: "not-interpreted",
    completedAt: "not-interpreted",
    correlationId: "not-interpreted",
  });
  const candidateDefinition = definition({
    code: "",
    objectiveClass: "",
    allowedToolSetId: "not-interpreted",
    maxRiskClass: "",
    approvalPolicyId: "not-interpreted",
    budgetPolicyId: "not-interpreted",
    version: -99,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  const beforeRun = JSON.stringify(candidateRun);
  const beforeDefinition = JSON.stringify(candidateDefinition);

  assert.equal(
    matchesAIAgentRunDefinitionBindingFloors(
      candidateRun,
      candidateDefinition,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateRun), beforeRun);
  assert.equal(JSON.stringify(candidateDefinition), beforeDefinition);
});
