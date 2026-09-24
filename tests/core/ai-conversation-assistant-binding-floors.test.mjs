import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIConversationAssistantBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  conversation: "11111111-1111-4111-8111-111111111111",
  tenantA: "22222222-2222-4222-8222-222222222222",
  tenantB: "33333333-3333-4333-8333-333333333333",
  industryA: "44444444-4444-4444-8444-444444444444",
  industryB: "55555555-5555-4555-8555-555555555555",
  assistant: "66666666-6666-4666-8666-666666666666",
  otherAssistant: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
  prompt: "99999999-9999-4999-8999-999999999999",
  toolSet: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

const baseConversation = Object.freeze({
  id: ids.conversation,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  scopeClass: "TENANT_INDUSTRY",
  ownerPrincipalId: ids.principal,
  assistantDefinitionId: ids.assistant,
  sensitivityClass: "CONFIDENTIAL",
  retentionClass: "opaque",
  status: "OPEN",
  createdAt: "2026-09-24T12:00:00.000Z",
  lastActivityAt: "2026-09-24T12:01:00.000Z",
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

function conversation(overrides = {}) {
  return Object.freeze({...baseConversation, ...overrides});
}

function assistant(overrides = {}) {
  return Object.freeze({...baseAssistant, ...overrides});
}

test("AICONV-AST-CUR-001 unbound conversation with no assistant evidence matches", () => {
  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation({assistantDefinitionId: undefined}),
      undefined,
    ),
    true,
  );
});

test("AICONV-AST-CUR-002 ACTIVE PLATFORM assistant applies to Core and Industry conversations", () => {
  const platform = assistant({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      platform,
    ),
    true,
  );
  assert.equal(
    matchesAIConversationAssistantBindingFloors(conversation(), platform),
    true,
  );
});

test("AICONV-AST-CUR-003 same-Tenant TENANT assistant applies within Tenant and foreign Tenant fails", () => {
  const tenantAssistant = assistant({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      tenantAssistant,
    ),
    true,
  );
  assert.equal(
    matchesAIConversationAssistantBindingFloors(conversation(), tenantAssistant),
    true,
  );
  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation(),
      assistant({ownerScope: "TENANT", tenantId: ids.tenantB, industryContextId: undefined}),
    ),
    false,
  );
});

test("AICONV-AST-CUR-004 INDUSTRY assistant requires exact same-Tenant Industry", () => {
  assert.equal(
    matchesAIConversationAssistantBindingFloors(conversation(), assistant()),
    true,
  );
  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation({industryContextId: ids.industryB}),
      assistant(),
    ),
    false,
  );
  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation({scopeClass: "TENANT_CORE", industryContextId: undefined}),
      assistant(),
    ),
    false,
  );
});

test("AICONV-AST-CUR-005 wrong assistant id or non-ACTIVE status fails closed", () => {
  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation(),
      assistant({id: ids.otherAssistant}),
    ),
    false,
  );
  for (const status of ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED", "DISABLED"]) {
    assert.equal(
      matchesAIConversationAssistantBindingFloors(
        conversation(),
        assistant({status}),
      ),
      false,
      status,
    );
  }
});

test("AICONV-AST-CUR-006 malformed scope/owner or unexpected evidence fails closed", () => {
  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation({id: "not-a-uuid"}),
      assistant(),
    ),
    false,
  );
  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation({scopeClass: "TENANT_CORE"}),
      assistant({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation(),
      assistant({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      conversation({assistantDefinitionId: undefined}),
      assistant(),
    ),
    false,
  );
});

test("AICONV-AST-CUR-007 conversation and nested Assistant semantics remain uninterpreted without mutation", () => {
  const candidateConversation = conversation({
    ownerPrincipalId: "not-interpreted",
    sensitivityClass: "REGULATED",
    retentionClass: "",
    status: "",
    createdAt: "not-interpreted",
    lastActivityAt: "also-not-interpreted",
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

  const beforeConversation = JSON.stringify(candidateConversation);
  const beforeAssistant = JSON.stringify(candidateAssistant);

  assert.equal(
    matchesAIConversationAssistantBindingFloors(
      candidateConversation,
      candidateAssistant,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateConversation), beforeConversation);
  assert.equal(JSON.stringify(candidateAssistant), beforeAssistant);
});
