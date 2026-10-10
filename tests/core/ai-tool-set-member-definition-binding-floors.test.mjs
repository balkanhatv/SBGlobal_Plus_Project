import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIToolSetMemberDefinitionBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  member: "11111111-1111-4111-8111-111111111111",
  toolSet: "22222222-2222-4222-8222-222222222222",
  toolDefinition: "33333333-3333-4333-8333-333333333333",
  otherToolDefinition: "44444444-4444-4444-8444-444444444444",
  approvalPolicy: "55555555-5555-4555-8555-555555555555",
});

const baseMember = Object.freeze({
  id: ids.member,
  toolSetId: ids.toolSet,
  toolDefinitionId: ids.toolDefinition,
  enabled: true,
  constraint: Object.freeze({opaque: true}),
  createdAt: "2026-09-24T06:00:00.000Z",
});

const baseDefinition = Object.freeze({
  id: ids.toolDefinition,
  toolId: "opaque.tool",
  capabilityCode: "opaque.capability",
  operationContractId: "opaque.operation",
  scopeClass: "TENANT_INDUSTRY",
  requiredPermission: "opaque.permission",
  requiredEntitlement: "opaque.entitlement",
  inputSchemaVersion: 1,
  outputSchemaVersion: 1,
  sideEffectClass: "CONTROLLED",
  approvalPolicyId: ids.approvalPolicy,
  idempotencyRequired: true,
  auditClass: "opaque.audit",
  status: "ACTIVE",
  version: 1,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

function member(overrides = {}) {
  return Object.freeze({...baseMember, ...overrides});
}

function definition(overrides = {}) {
  return Object.freeze({...baseDefinition, ...overrides});
}

test("AITOOLMEM-DEF-CUR-001 exact referenced ACTIVE ToolDefinition matches", () => {
  assert.equal(
    matchesAIToolSetMemberDefinitionBindingFloors(member(), definition()),
    true,
  );
});

test("AITOOLMEM-DEF-CUR-002 wrong ToolDefinition identity fails closed", () => {
  assert.equal(
    matchesAIToolSetMemberDefinitionBindingFloors(
      member(),
      definition({id: ids.otherToolDefinition}),
    ),
    false,
  );
});

test("AITOOLMEM-DEF-CUR-003 malformed member id fails closed", () => {
  assert.equal(
    matchesAIToolSetMemberDefinitionBindingFloors(
      member({id: "not-a-uuid"}),
      definition(),
    ),
    false,
  );
});

test("AITOOLMEM-DEF-CUR-004 malformed member ToolSet or ToolDefinition id fails closed", () => {
  assert.equal(
    matchesAIToolSetMemberDefinitionBindingFloors(
      member({toolSetId: "not-a-uuid"}),
      definition(),
    ),
    false,
  );
  assert.equal(
    matchesAIToolSetMemberDefinitionBindingFloors(
      member({toolDefinitionId: "not-a-uuid"}),
      definition(),
    ),
    false,
  );
});

test("AITOOLMEM-DEF-CUR-005 malformed ToolDefinition id fails closed", () => {
  assert.equal(
    matchesAIToolSetMemberDefinitionBindingFloors(
      member(),
      definition({id: "not-a-uuid"}),
    ),
    false,
  );
});

test("AITOOLMEM-DEF-CUR-006 non-ACTIVE raw statuses fail", () => {
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED", "DISABLED", ""]) {
    assert.equal(
      matchesAIToolSetMemberDefinitionBindingFloors(
        member(),
        definition({status}),
      ),
      false,
      status,
    );
  }
});

test("AITOOLMEM-DEF-CUR-007 unrelated member/tool semantics remain uninterpreted without mutation", () => {
  const candidateMember = member({
    enabled: false,
    constraint: Object.freeze({
      nested: Object.freeze({anything: true}),
      list: Object.freeze([1, "two", false]),
    }),
    createdAt: "not-interpreted",
  });
  const candidateDefinition = definition({
    toolId: "",
    capabilityCode: "",
    operationContractId: "",
    scopeClass: "EXPLICIT_CROSS_CONTEXT",
    requiredPermission: "",
    requiredEntitlement: null,
    inputSchemaVersion: 999,
    outputSchemaVersion: 999,
    sideEffectClass: "HIGH",
    approvalPolicyId: null,
    idempotencyRequired: false,
    auditClass: "",
    version: 999,
    createdAt: "not-interpreted",
    updatedAt: "also-not-interpreted",
  });

  const beforeMember = JSON.stringify(candidateMember);
  const beforeDefinition = JSON.stringify(candidateDefinition);

  assert.equal(
    matchesAIToolSetMemberDefinitionBindingFloors(
      candidateMember,
      candidateDefinition,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateMember), beforeMember);
  assert.equal(JSON.stringify(candidateDefinition), beforeDefinition);
});
