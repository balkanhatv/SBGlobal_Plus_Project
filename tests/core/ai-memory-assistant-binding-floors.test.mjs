import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIMemoryAssistantBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  memory: "11111111-1111-4111-8111-111111111111",
  tenantA: "22222222-2222-4222-8222-222222222222",
  tenantB: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  assistant: "66666666-6666-4666-8666-666666666666",
  otherAssistant: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
  prompt: "99999999-9999-4999-8999-999999999999",
  toolSet: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  supersedes: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

const baseMemory = Object.freeze({
  id: ids.memory,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  principalId: ids.principal,
  assistantDefinitionId: ids.assistant,
  memoryClass: "WORKING_CONTEXT",
  contentRefOrEncryptedContent: "opaque",
  sourceRef: "opaque-source",
  sensitivityClass: "CONFIDENTIAL",
  retentionClass: "opaque-retention",
  aclPolicyRef: "opaque-acl",
  status: "ACTIVE",
  createdAt: "2026-09-24T12:00:00.000Z",
  expiresAt: "2026-10-24T12:00:00.000Z",
  supersedesId: ids.supersedes,
});

const baseAssistant = Object.freeze({
  id: ids.assistant,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "opaque",
  allowedCapabilities: Object.freeze(["opaque.capability"]),
  ragScopeRules: Object.freeze({opaque: true}),
  promptTemplateId: ids.prompt,
  toolSetId: ids.toolSet,
  modelPolicyId: "opaque-model-policy",
  retentionPolicyId: "opaque-retention-policy",
  version: 7,
  status: "ACTIVE",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

function memory(overrides = {}) {
  return Object.freeze({...baseMemory, ...overrides});
}

function assistant(overrides = {}) {
  return Object.freeze({...baseAssistant, ...overrides});
}

test("AIMEM-AST-CUR-001 unbound memory with no assistant evidence matches", () => {
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory({assistantDefinitionId: undefined}),
      undefined,
    ),
    true,
  );
});

test("AIMEM-AST-CUR-002 ACTIVE PLATFORM assistant applies to Core and Industry memory", () => {
  const platform = assistant({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory({industryContextId: undefined}),
      platform,
    ),
    true,
  );
  assert.equal(matchesAIMemoryAssistantBindingFloors(memory(), platform), true);
});

test("AIMEM-AST-CUR-003 same-Tenant TENANT assistant applies within Tenant and foreign Tenant fails", () => {
  const tenantAssistant = assistant({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory({industryContextId: undefined}),
      tenantAssistant,
    ),
    true,
  );
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(memory(), tenantAssistant),
    true,
  );
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory(),
      assistant({ownerScope: "TENANT", tenantId: ids.tenantB, industryContextId: undefined}),
    ),
    false,
  );
});

test("AIMEM-AST-CUR-004 INDUSTRY assistant requires exact same-Tenant Industry", () => {
  assert.equal(matchesAIMemoryAssistantBindingFloors(memory(), assistant()), true);
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory({industryContextId: ids.industryB}),
      assistant(),
    ),
    false,
  );
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory({industryContextId: undefined}),
      assistant(),
    ),
    false,
  );
});

test("AIMEM-AST-CUR-005 wrong assistant id or non-ACTIVE status fails closed", () => {
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory(),
      assistant({id: ids.otherAssistant}),
    ),
    false,
  );
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED", "DISABLED"]) {
    assert.equal(
      matchesAIMemoryAssistantBindingFloors(memory(), assistant({status})),
      false,
      status,
    );
  }
});

test("AIMEM-AST-CUR-006 malformed ownership or unexpected evidence fails closed", () => {
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory({id: "not-a-uuid"}),
      assistant(),
    ),
    false,
  );
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory({industryContextId: "not-a-uuid"}),
      assistant(),
    ),
    false,
  );
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory(),
      assistant({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAIMemoryAssistantBindingFloors(
      memory({assistantDefinitionId: undefined}),
      assistant(),
    ),
    false,
  );
});

test("AIMEM-AST-CUR-007 memory and nested Assistant semantics remain uninterpreted without mutation", () => {
  const candidateMemory = memory({
    principalId: "not-interpreted",
    memoryClass: "SESSION",
    contentRefOrEncryptedContent: "",
    sourceRef: "",
    sensitivityClass: "REGULATED",
    retentionClass: "",
    aclPolicyRef: "",
    status: "ERASED",
    createdAt: "not-interpreted",
    expiresAt: "also-not-interpreted",
    supersedesId: "not-interpreted",
  });
  const candidateAssistant = assistant({
    code: "",
    allowedCapabilities: Object.freeze([]),
    ragScopeRules: Object.freeze({anything: true}),
    promptTemplateId: "not-interpreted",
    toolSetId: "not-interpreted",
    modelPolicyId: "not-interpreted",
    retentionPolicyId: "",
    version: -99,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  const beforeMemory = JSON.stringify(candidateMemory);
  const beforeAssistant = JSON.stringify(candidateAssistant);

  assert.equal(
    matchesAIMemoryAssistantBindingFloors(candidateMemory, candidateAssistant),
    true,
  );
  assert.equal(JSON.stringify(candidateMemory), beforeMemory);
  assert.equal(JSON.stringify(candidateAssistant), beforeAssistant);
});
