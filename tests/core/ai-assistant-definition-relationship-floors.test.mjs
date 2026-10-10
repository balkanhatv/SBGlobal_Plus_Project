import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIAssistantDefinitionRelationshipFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  assistant: "11111111-1111-4111-8111-111111111111",
  prompt: "22222222-2222-4222-8222-222222222222",
  otherPrompt: "33333333-3333-4333-8333-333333333333",
  toolSet: "44444444-4444-4444-8444-444444444444",
  otherToolSet: "55555555-5555-4555-8555-555555555555",
  tenantA: "66666666-6666-4666-8666-666666666666",
  tenantB: "77777777-7777-4777-8777-777777777777",
  industryA: "88888888-8888-4888-8888-888888888888",
  industryB: "99999999-9999-4999-8999-999999999999",
  policy: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  retention: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  principal: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
});

const baseAssistant = Object.freeze({
  id: ids.assistant,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "assistant",
  allowedCapabilities: Object.freeze(["chat"]),
  ragScopeRules: Object.freeze({opaque: true}),
  promptTemplateId: ids.prompt,
  modelPolicyId: ids.policy,
  retentionPolicyId: ids.retention,
  version: 7,
  status: "ACTIVE",
  createdAt: "2026-09-24T06:00:00.000Z",
  updatedAt: "2026-09-24T06:00:00.000Z",
});

const basePrompt = Object.freeze({
  id: ids.prompt,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "prompt",
  version: 4,
  systemTemplate: "opaque",
  variableSchema: Object.freeze({type: "object"}),
  groundingRequired: true,
  allowedOverrideFields: Object.freeze(["opaque"]),
  status: "ACTIVE",
  createdBy: ids.principal,
  approvedBy: ids.principal,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

const baseToolSet = Object.freeze({
  id: ids.toolSet,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "tools",
  version: 3,
  status: "ACTIVE",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
});

function assistant(overrides = {}) {
  return Object.freeze({...baseAssistant, ...overrides});
}
function prompt(overrides = {}) {
  return Object.freeze({...basePrompt, ...overrides});
}
function toolSet(overrides = {}) {
  return Object.freeze({...baseToolSet, ...overrides});
}

test("AIASSIST-REL-CUR-001 PLATFORM prompt contains valid PLATFORM/TENANT/INDUSTRY assistants", () => {
  const platformPrompt = prompt({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
      platformPrompt,
    ),
    true,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({ownerScope: "TENANT", industryContextId: undefined}),
      platformPrompt,
    ),
    true,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(assistant(), platformPrompt),
    true,
  );
});

test("AIASSIST-REL-CUR-002 TENANT prompt contains same-Tenant TENANT/INDUSTRY but not foreign or PLATFORM", () => {
  const tenantPrompt = prompt({
    ownerScope: "TENANT",
    industryContextId: undefined,
  });

  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({ownerScope: "TENANT", industryContextId: undefined}),
      tenantPrompt,
    ),
    true,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(assistant(), tenantPrompt),
    true,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({tenantId: ids.tenantB}),
      tenantPrompt,
    ),
    false,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
      tenantPrompt,
    ),
    false,
  );
});

test("AIASSIST-REL-CUR-003 INDUSTRY prompt contains only exact same-Tenant Industry assistant", () => {
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(assistant(), prompt()),
    true,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({industryContextId: ids.industryB}),
      prompt(),
    ),
    false,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({ownerScope: "TENANT", industryContextId: undefined}),
      prompt(),
    ),
    false,
  );
});

test("AIASSIST-REL-CUR-004 optional ToolSet must exact-match, be ACTIVE, contain scope, and extra evidence is rejected", () => {
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({toolSetId: ids.toolSet}),
      prompt(),
      toolSet(),
    ),
    true,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({toolSetId: ids.toolSet}),
      prompt(),
      toolSet({id: ids.otherToolSet}),
    ),
    false,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({toolSetId: ids.toolSet}),
      prompt(),
      toolSet({ownerScope: "INDUSTRY", industryContextId: ids.industryB}),
    ),
    false,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant(),
      prompt(),
      toolSet(),
    ),
    false,
  );
});

test("AIASSIST-REL-CUR-005 wrong prompt identity or non-ACTIVE prompt/tool set fails closed", () => {
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant(),
      prompt({id: ids.otherPrompt}),
    ),
    false,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant(),
      prompt({status: "RETIRED"}),
    ),
    false,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({toolSetId: ids.toolSet}),
      prompt(),
      toolSet({status: "DRAFT"}),
    ),
    false,
  );
});

test("AIASSIST-REL-CUR-006 malformed identity or owner shape fails closed", () => {
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({id: "not-a-uuid"}),
      prompt(),
    ),
    false,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant({ownerScope: "TENANT", tenantId: undefined, industryContextId: undefined}),
      prompt({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      assistant(),
      prompt({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
    ),
    false,
  );
});

test("AIASSIST-REL-CUR-007 capability/RAG/policy/content/version/status semantics remain uninterpreted without mutation", () => {
  const candidateAssistant = assistant({
    allowedCapabilities: Object.freeze([]),
    ragScopeRules: Object.freeze({anything: Object.freeze({goes: true})}),
    modelPolicyId: undefined,
    retentionPolicyId: ids.otherPrompt,
    version: -99,
    status: "RETIRED",
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });
  const candidatePrompt = prompt({
    code: "",
    version: -1,
    systemTemplate: "",
    variableSchema: Object.freeze(null),
    groundingRequired: false,
    allowedOverrideFields: Object.freeze(["", ""]),
    createdBy: "",
    approvedBy: undefined,
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });

  const beforeAssistant = JSON.stringify(candidateAssistant);
  const beforePrompt = JSON.stringify(candidatePrompt);

  assert.equal(
    matchesAIAssistantDefinitionRelationshipFloors(
      candidateAssistant,
      candidatePrompt,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateAssistant), beforeAssistant);
  assert.equal(JSON.stringify(candidatePrompt), beforePrompt);
});
