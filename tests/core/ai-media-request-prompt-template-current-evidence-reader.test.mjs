import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIMediaRequestPromptTemplateCurrentEvidence,
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
  membership: "89898989-8989-4989-8989-898989898989",
  creator: "99999999-9999-4999-8999-999999999999",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-1",
    correlationId: "correlation-1",
    tenantId: ids.tenantA,
    industryContextId: ids.industryA,
    dataHomeId: "home-1",
    regionCode: "IN-CENTRAL",
    principalId: ids.principal,
    principalType: "HUMAN",
    membershipId: ids.membership,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    permissionVersion: 7,
    entitlementSnapshotVersion: 11,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function request(overrides = {}) {
  return Object.freeze({
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
    createdAt: "2026-10-06T00:00:00.000Z",
    ...overrides,
  });
}

function prompt(overrides = {}) {
  return Object.freeze({
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
    createdAt: "2026-10-05T00:00:00.000Z",
    updatedAt: "2026-10-05T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const requestCalls = [];
  const promptCalls = [];
  const values = {
    request: Object.hasOwn(overrides, "request")
      ? overrides.request
      : request(),
    prompt: Object.hasOwn(overrides, "prompt")
      ? overrides.prompt
      : prompt(),
  };

  return {
    order,
    requestCalls,
    promptCalls,
    values,
    requestReader: {
      async loadForContext(input) {
        order.push("request");
        requestCalls.push(input);
        if (overrides.requestError) throw overrides.requestError;
        return values.request;
      },
    },
    promptReader: {
      async loadForContext(input) {
        order.push("prompt");
        promptCalls.push(input);
        if (overrides.promptError) throw overrides.promptError;
        return values.prompt;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadAIMediaRequestPromptTemplateCurrentEvidence(
    {
      requestContext: context(),
      mediaRequestId: ids.request,
      ...inputOverrides,
    },
    f.requestReader,
    f.promptReader,
  );
}

test("AIMEDIA-PROMPTREAD-BASE-001 exact AIMediaRequest read executes first with exact input", async () => {
  const f = fixture();
  const requestContext = context();
  const result = await load(f, {requestContext});
  assert.ok(result);
  assert.deepEqual(f.order, ["request", "prompt"]);
  assert.equal(f.requestCalls.length, 1);
  assert.equal(f.requestCalls[0].requestContext, requestContext);
  assert.equal(f.requestCalls[0].mediaRequestId, ids.request);
});

test("AIMEDIA-PROMPTREAD-BASE-002 request null or dependency error precedes any prompt read", async () => {
  const hidden = fixture({request: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["request"]);
  assert.equal(hidden.promptCalls.length, 0);

  const expected = new Error("request-unavailable");
  const broken = fixture({requestError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["request"]);
  assert.equal(broken.promptCalls.length, 0);
});

test("AIMEDIA-PROMPTREAD-BRANCH-001 unbound valid request performs zero prompt reads and requires absent version", async () => {
  const valid = fixture({
    request: request({promptTemplateId: undefined, promptVersion: undefined}),
  });
  const result = await load(valid);
  assert.ok(result);
  assert.equal(valid.promptCalls.length, 0);
  assert.equal("promptTemplate" in result, false);
  assert.equal(result.request, valid.values.request);
  assert.equal(Object.isFrozen(result), true);

  const invalid = fixture({
    request: request({promptTemplateId: undefined, promptVersion: 7}),
  });
  assert.equal(await load(invalid), null);
  assert.equal(invalid.promptCalls.length, 0);
});

test("AIMEDIA-PROMPTREAD-READ-001 bound request reads exact persisted prompt id once in same context", async () => {
  const f = fixture();
  const requestContext = context();
  const result = await load(f, {requestContext});
  assert.ok(result);
  assert.equal(f.promptCalls.length, 1);
  assert.equal(f.promptCalls[0].requestContext, requestContext);
  assert.equal(f.promptCalls[0].promptTemplateId, ids.prompt);
});

test("AIMEDIA-PROMPTREAD-READ-002 prompt null returns null and prompt errors propagate without fallback", async () => {
  const missing = fixture({prompt: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["request", "prompt"]);
  assert.equal(missing.promptCalls.length, 1);

  const expected = new Error("prompt-unavailable");
  const broken = fixture({promptError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["request", "prompt"]);
  assert.equal(broken.promptCalls.length, 1);
});

test("AIMEDIA-PROMPTREAD-FLOOR-001 exact ACTIVE applicable PLATFORM TENANT INDUSTRY evidence passes", async () => {
  const cases = [
    {
      request: request(),
      prompt: prompt({
        ownerScope: "PLATFORM",
        tenantId: undefined,
        industryContextId: undefined,
      }),
    },
    {
      request: request({industryContextId: undefined}),
      prompt: prompt({
        ownerScope: "TENANT",
        tenantId: ids.tenantA,
        industryContextId: undefined,
      }),
    },
    {
      request: request(),
      prompt: prompt(),
    },
  ];

  for (const candidate of cases) {
    const f = fixture(candidate);
    const result = await load(f);
    assert.ok(result);
    assert.equal(result.request, candidate.request);
    assert.equal(result.promptTemplate, candidate.prompt);
  }
});

test("AIMEDIA-PROMPTREAD-FLOOR-002 id version status or owner applicability mismatch fails closed", async () => {
  const cases = [
    fixture({prompt: prompt({id: ids.otherPrompt})}),
    fixture({request: request({promptVersion: 8})}),
    fixture({prompt: prompt({status: "RETIRED"})}),
    fixture({prompt: prompt({tenantId: ids.tenantB})}),
    fixture({prompt: prompt({industryContextId: ids.industryB})}),
  ];
  for (const f of cases) {
    assert.equal(await load(f), null);
    assert.equal(f.promptCalls.length, 1);
  }
});

test("AIMEDIA-PROMPTREAD-EVID-001 success preserves exact immutable request and prompt references", async () => {
  const requestEvidence = request();
  const promptEvidence = prompt();
  const f = fixture({request: requestEvidence, prompt: promptEvidence});
  const before = JSON.stringify([requestEvidence, promptEvidence]);

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.request, requestEvidence);
  assert.equal(result.promptTemplate, promptEvidence);
  assert.equal(JSON.stringify([requestEvidence, promptEvidence]), before);
});

test("AIMEDIA-PROMPTREAD-BOUND-001 result exposes no selection rendering approval authorization routing or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  for (const forbidden of [
    "selectedPrompt",
    "renderedPrompt",
    "renderedSystemTemplate",
    "approvalSatisfied",
    "overrideAllowed",
    "groundingSatisfied",
    "principalCurrent",
    "documentAuthorized",
    "entitlementAllowed",
    "moderationAllowed",
    "providerAuthorized",
    "modelAuthorized",
    "toolAuthorized",
    "executionAuthorized",
    "publicationAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
