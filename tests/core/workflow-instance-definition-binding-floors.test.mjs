import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesWorkflowInstanceDefinitionBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  instance: "11111111-1111-4111-8111-111111111111",
  tenantA: "22222222-2222-4222-8222-222222222222",
  tenantB: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  definition: "66666666-6666-4666-8666-666666666666",
  otherDefinition: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
});

const baseInstance = Object.freeze({
  id: ids.instance,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  scopeClass: "TENANT_INDUSTRY",
  workflowDefinitionId: ids.definition,
  workflowDefinitionVersion: 3,
  resourceType: "opaque",
  resourceId: "opaque",
  currentState: "UNINTERPRETED",
  lifecycleState: "OPEN",
  rowVersion: "1",
  startedAt: "2026-09-24T06:00:00.000Z",
  createdBy: ids.principal,
  createdAt: "2026-09-24T06:00:00.000Z",
  updatedAt: "2026-09-24T06:00:00.000Z",
});

const baseDefinition = Object.freeze({
  id: ids.definition,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque",
  version: 3,
  status: "ACTIVE",
  schemaVersion: 1,
  stateMachine: Object.freeze({anything: true}),
  approvalPolicy: Object.freeze({anything: true}),
  ruleRefs: Object.freeze(["opaque"]),
  createdBy: ids.principal,
  approvedBy: ids.principal,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

function instance(overrides = {}) {
  return Object.freeze({...baseInstance, ...overrides});
}

function definition(overrides = {}) {
  return Object.freeze({...baseDefinition, ...overrides});
}

test("WFI-DEF-CUR-001 exact ACTIVE PLATFORM definition applies to Core and Industry", () => {
  const platform = definition({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      platform,
    ),
    true,
  );
  assert.equal(matchesWorkflowInstanceDefinitionBindingFloors(instance(), platform), true);
});

test("WFI-DEF-CUR-002 same-Tenant TENANT definition applies to Core/Industry and foreign Tenant fails", () => {
  const tenantDefinition = definition({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      tenantDefinition,
    ),
    true,
  );
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(instance(), tenantDefinition),
    true,
  );
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance(),
      definition({ownerScope: "TENANT", tenantId: ids.tenantB, industryContextId: undefined}),
    ),
    false,
  );
});

test("WFI-DEF-CUR-003 INDUSTRY definition applies only to exact same-Tenant Industry", () => {
  assert.equal(matchesWorkflowInstanceDefinitionBindingFloors(instance(), definition()), true);
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance({industryContextId: ids.industryB}),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      definition(),
    ),
    false,
  );
});

test("WFI-DEF-CUR-004 definition id/version mismatches fail closed", () => {
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance(),
      definition({id: ids.otherDefinition}),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance({workflowDefinitionVersion: 2}),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance({workflowDefinitionVersion: 0}),
      definition({version: 0}),
    ),
    false,
  );
});

test("WFI-DEF-CUR-005 non-ACTIVE definition states fail", () => {
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"]) {
    assert.equal(
      matchesWorkflowInstanceDefinitionBindingFloors(
        instance(),
        definition({status}),
      ),
      false,
      status,
    );
  }
});

test("WFI-DEF-CUR-006 malformed instance/definition ownership fails closed", () => {
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance({id: "not-a-uuid"}),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance({scopeClass: "TENANT_CORE"}),
      definition({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      instance(),
      definition({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
    ),
    false,
  );
});

test("WFI-DEF-CUR-007 workflow execution semantics remain uninterpreted without mutation", () => {
  const candidateInstance = instance({
    resourceType: "",
    resourceId: "",
    currentState: "",
    lifecycleState: "CANCELLED",
    rowVersion: "-99",
    startedAt: "not-interpreted",
    completedAt: "not-interpreted",
    createdBy: "",
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });
  const candidateDefinition = definition({
    code: "",
    schemaVersion: -1,
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

  const beforeInstance = JSON.stringify(candidateInstance);
  const beforeDefinition = JSON.stringify(candidateDefinition);

  assert.equal(
    matchesWorkflowInstanceDefinitionBindingFloors(
      candidateInstance,
      candidateDefinition,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateInstance), beforeInstance);
  assert.equal(JSON.stringify(candidateDefinition), beforeDefinition);
});
