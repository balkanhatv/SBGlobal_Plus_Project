import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIMediaRequestPromptTemplateBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  request: "11111111-1111-4111-8111-111111111111",
  prompt: "22222222-2222-4222-8222-222222222222",
  otherPrompt: "33333333-3333-4333-8333-333333333333",
  tenantA: "44444444-4444-4444-8444-444444444444",
  tenantB: "55555555-5555-4555-8555-555555555555",
  industryA: "66666666-6666-4666-8666-666666666666",
  industryB: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
  creator: "99999999-9999-4999-8999-999999999999",
});

const baseRequest = Object.freeze({
  id: ids.request,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  principalId: ids.principal,
  capabilityCode: "media.generate",
  mediaType: "IMAGE",
  promptTemplateId: ids.prompt,
  promptVersion: 7,
  brandConfigVersion: "12",
  localizationProfileRef: "en-IN",
  inputDocumentRefs: Object.freeze([]),
  sensitivityClass: "INTERNAL",
  residencyRequirement: "IN",
  moderationPolicyRef: "default",
  status: "QUEUED",
  createdAt: "2026-09-25T09:00:00.000Z",
});

const basePrompt = Object.freeze({
  id: ids.prompt,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  code: "media.default",
  version: 7,
  systemTemplate: "opaque",
  variableSchema: Object.freeze({type: "object"}),
  groundingRequired: false,
  allowedOverrideFields: Object.freeze([]),
  status: "ACTIVE",
  createdBy: ids.creator,
  createdAt: "2026-09-20T09:00:00.000Z",
  updatedAt: "2026-09-20T09:00:00.000Z",
});

function request(overrides = {}) {
  return Object.freeze({...baseRequest, ...overrides});
}

function prompt(overrides = {}) {
  return Object.freeze({...basePrompt, ...overrides});
}

test("AIMEDIA-PROMPT-CUR-001 unbound request requires neither prompt version nor prompt evidence", () => {
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request({promptTemplateId: undefined, promptVersion: undefined}),
      undefined,
    ),
    true,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request({promptTemplateId: undefined, promptVersion: 7}),
      undefined,
    ),
    false,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request({promptTemplateId: undefined, promptVersion: undefined}),
      prompt(),
    ),
    false,
  );
});

test("AIMEDIA-PROMPT-CUR-002 exact ACTIVE PLATFORM prompt applies to Tenant Core and Industry requests", () => {
  const platformPrompt = prompt({
    ownerScope: "PLATFORM",
    tenantId: undefined,
    industryContextId: undefined,
  });
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(request(), platformPrompt),
    true,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request({industryContextId: undefined}),
      platformPrompt,
    ),
    true,
  );
});

test("AIMEDIA-PROMPT-CUR-003 exact ACTIVE TENANT prompt applies only within same Tenant", () => {
  const tenantPrompt = prompt({
    ownerScope: "TENANT",
    tenantId: ids.tenantA,
    industryContextId: undefined,
  });
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(request(), tenantPrompt),
    true,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request({industryContextId: undefined}),
      tenantPrompt,
    ),
    true,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request({tenantId: ids.tenantB}),
      tenantPrompt,
    ),
    false,
  );
});

test("AIMEDIA-PROMPT-CUR-004 INDUSTRY prompt requires exact same-Tenant Industry target", () => {
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(request(), prompt()),
    true,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request({industryContextId: ids.industryB}),
      prompt(),
    ),
    false,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request({industryContextId: undefined}),
      prompt(),
    ),
    false,
  );
});

test("AIMEDIA-PROMPT-CUR-005 id, version or status mismatch and missing bound evidence fail closed", () => {
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(request(), undefined),
    false,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request(),
      prompt({id: ids.otherPrompt}),
    ),
    false,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request({promptVersion: 8}),
      prompt(),
    ),
    false,
  );
  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      request(),
      prompt({status: "RETIRED"}),
    ),
    false,
  );
});

test("AIMEDIA-PROMPT-CUR-006 malformed request/prompt ownership fails closed", () => {
  for (const candidate of [
    request({id: "not-a-uuid"}),
    request({tenantId: "not-a-uuid"}),
    request({industryContextId: "not-a-uuid"}),
    request({promptTemplateId: "not-a-uuid"}),
    request({promptVersion: Number.NaN}),
  ]) {
    assert.equal(
      matchesAIMediaRequestPromptTemplateBindingFloors(candidate, prompt()),
      false,
    );
  }

  for (const candidatePrompt of [
    prompt({id: "not-a-uuid"}),
    prompt({version: 0}),
    prompt({ownerScope: "PLATFORM", tenantId: ids.tenantA, industryContextId: undefined}),
    prompt({ownerScope: "TENANT", tenantId: undefined, industryContextId: undefined}),
    prompt({ownerScope: "INDUSTRY", tenantId: ids.tenantA, industryContextId: undefined}),
  ]) {
    assert.equal(
      matchesAIMediaRequestPromptTemplateBindingFloors(request(), candidatePrompt),
      false,
    );
  }
});

test("AIMEDIA-PROMPT-CUR-007 unrelated media/prompt semantics remain uninterpreted without mutation", () => {
  const candidateRequest = request({
    principalId: "not-interpreted",
    capabilityCode: "",
    brandConfigVersion: "-1",
    localizationProfileRef: "",
    sensitivityClass: "REGULATED",
    residencyRequirement: "",
    moderationPolicyRef: "",
    status: "",
    completedAt: "not-interpreted",
  });
  const candidatePrompt = prompt({
    code: "",
    systemTemplate: "",
    variableSchema: Object.freeze({unexpected: true}),
    groundingRequired: true,
    allowedOverrideFields: Object.freeze(["", "x"]),
    createdBy: "not-interpreted",
    approvedBy: "also-not-interpreted",
    createdAt: "not-interpreted",
    updatedAt: "also-not-interpreted",
  });

  const beforeRequest = JSON.stringify(candidateRequest);
  const beforePrompt = JSON.stringify(candidatePrompt);

  assert.equal(
    matchesAIMediaRequestPromptTemplateBindingFloors(
      candidateRequest,
      candidatePrompt,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateRequest), beforeRequest);
  assert.equal(JSON.stringify(candidatePrompt), beforePrompt);
});
