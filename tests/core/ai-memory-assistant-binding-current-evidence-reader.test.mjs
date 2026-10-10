import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIMemoryAssistantBindingCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  foreignTenant: "12121212-1212-4212-8212-121212121212",
  industry: "22222222-2222-4222-8222-222222222222",
  otherIndustry: "23232323-2323-4232-8232-232323232323",
  memory: "33333333-3333-4333-8333-333333333333",
  assistant: "44444444-4444-4444-8444-444444444444",
  otherAssistant: "45454545-4545-4545-8545-454545454545",
  principal: "66666666-6666-4666-8666-666666666666",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "memory-request", correlationId: "memory-correlation",
    tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.principal, principalType: "HUMAN",
    scopeClass: "TENANT_INDUSTRY", orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]), permissionVersion: 1,
    entitlementSnapshotVersion: 1, dataHomeId: "home", regionCode: "IN-CENTRAL",
    ...overrides,
  });
}

function memory(overrides = {}) {
  return Object.freeze({
    id: ids.memory, tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.principal, assistantDefinitionId: ids.assistant,
    memoryClass: "USER_PREFERENCE",
    contentRefOrEncryptedContent: "encrypted-ref", sourceRef: "raw-source",
    sensitivityClass: "REGULATED", retentionClass: "raw-retention",
    aclPolicyRef: "raw-acl", status: "ERASED",
    createdAt: "2026-10-08T10:00:00.000Z",
    expiresAt: "2026-10-09T10:00:00.000Z",
    supersedesId: ids.otherAssistant, ...overrides,
  });
}

function assistant(overrides = {}) {
  return Object.freeze({
    id: ids.assistant, ownerScope: "INDUSTRY",
    tenantId: ids.tenant, industryContextId: ids.industry,
    code: "assistant.raw", allowedCapabilities: Object.freeze(["raw.capability"]),
    ragScopeRules: Object.freeze({raw: true}),
    promptTemplateId: ids.otherAssistant,
    toolSetId: ids.otherAssistant, modelPolicyId: ids.otherAssistant,
    retentionPolicyId: ids.otherAssistant, version: 3,
    status: "ACTIVE", createdAt: "2026-10-07T10:00:00.000Z",
    updatedAt: "2026-10-08T10:00:00.000Z", ...overrides,
  });
}

function fixture(overrides = {}) {
  const value = {
    memory: Object.hasOwn(overrides, "memory") ? overrides.memory : memory(),
    assistant: Object.hasOwn(overrides, "assistant")
      ? overrides.assistant : assistant(),
  };
  const order = [], memoryCalls = [], assistantCalls = [];
  return {
    value, order, memoryCalls, assistantCalls,
    memoryReader: {
      async loadForContext(input) {
        order.push("memory");
        memoryCalls.push(input);
        if (overrides.memoryError) throw overrides.memoryError;
        return value.memory;
      },
    },
    assistantReader: {
      async loadForContext(input) {
        order.push("assistant");
        assistantCalls.push(input);
        if (overrides.assistantError) throw overrides.assistantError;
        return value.assistant;
      },
    },
  };
}

async function load(f, overrides = {}) {
  return loadAIMemoryAssistantBindingCurrentEvidence(
    {requestContext: context(), memoryRecordId: ids.memory, ...overrides},
    f.memoryReader, f.assistantReader,
  );
}

test("AIMEM-ASTREAD-BASE-001 exact memory is loaded first with original RequestContext and id", async () => {
  const f = fixture();
  const ctx = context();
  const result = await load(f, {requestContext: ctx});
  assert.ok(result);
  assert.deepEqual(f.order, ["memory", "assistant"]);
  assert.equal(f.memoryCalls.length, 1);
  assert.equal(f.memoryCalls[0].requestContext, ctx);
  assert.equal(f.memoryCalls[0].memoryRecordId, ids.memory);
  assert.equal(f.assistantCalls.length, 1);
});

test("AIMEM-ASTREAD-BASE-002 missing memory and memory errors prevent assistant access", async () => {
  const missing = fixture({memory: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["memory"]);
  const error = new Error("memory-unavailable");
  const broken = fixture({memoryError: error});
  await assert.rejects(load(broken), candidate => candidate === error);
  assert.deepEqual(broken.order, ["memory"]);
});

test("AIMEM-ASTREAD-UNBOUND-001 valid unbound memory returns frozen exact parent-only evidence", async () => {
  const row = memory({assistantDefinitionId: undefined});
  const f = fixture({memory: row});
  const result = await load(f);
  assert.ok(result);
  assert.deepEqual(f.order, ["memory"]);
  assert.deepEqual(Object.keys(result), ["memory"]);
  assert.equal(result.memory, row);
  assert.equal(Object.isFrozen(result), true);
  assert.equal("assistant" in result, false);
  assert.equal("memoryAuthorized" in result, false);
});

test("AIMEM-ASTREAD-UNBOUND-002 malformed unbound memory identity or scope fails closed before assistant access", async () => {
  for (const row of [
    memory({id: "invalid", assistantDefinitionId: undefined}),
    memory({tenantId: "invalid", assistantDefinitionId: undefined}),
    memory({industryContextId: "invalid", assistantDefinitionId: undefined}),
  ]) {
    const f = fixture({memory: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["memory"]);
  }
});

test("AIMEM-ASTREAD-READ-001 bound memory loads exact persisted assistant once under same RequestContext", async () => {
  const f = fixture();
  const ctx = context();
  const result = await load(f, {requestContext: ctx});
  assert.ok(result);
  assert.equal(f.assistantCalls.length, 1);
  assert.equal(f.assistantCalls[0].requestContext, ctx);
  assert.equal(f.assistantCalls[0].assistantDefinitionId, ids.assistant);
  assert.equal(result.assistant, f.value.assistant);
});

test("AIMEM-ASTREAD-READ-002 malformed bound id, absent assistant and dependency errors fail closed without fallback", async () => {
  for (const row of [
    memory({assistantDefinitionId: "not-a-uuid"}),
    memory({id: "bad-id"}),
    memory({tenantId: "bad-tenant"}),
    memory({industryContextId: "bad-industry"}),
  ]) {
    const f = fixture({memory: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["memory"]);
  }
  const hidden = fixture({assistant: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["memory", "assistant"]);
  const error = new Error("assistant-not-visible");
  const broken = fixture({assistantError: error});
  await assert.rejects(load(broken), candidate => candidate === error);
  assert.deepEqual(broken.order, ["memory", "assistant"]);
});

test("AIMEM-ASTREAD-FLOOR-001 ACTIVE PLATFORM TENANT INDUSTRY exact applicable relationships pass", async () => {
  const valid = [
    {row: memory(), definition: assistant()},
    {row: memory({industryContextId: undefined}),
      definition: assistant({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined})},
    {row: memory(),
      definition: assistant({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined})},
    {row: memory({industryContextId: undefined}),
      definition: assistant({ownerScope: "TENANT", industryContextId: undefined})},
    {row: memory(), definition: assistant({ownerScope: "TENANT", industryContextId: undefined})},
  ];
  for (const candidate of valid) {
    const f = fixture({memory: candidate.row, assistant: candidate.definition});
    const result = await load(f);
    assert.ok(result);
    assert.equal(result.memory, candidate.row);
    assert.equal(result.assistant, candidate.definition);
    assert.equal(f.assistantCalls.length, 1);
  }
});

test("AIMEM-ASTREAD-FLOOR-002 wrong id status malformed owner foreign Tenant or sibling Industry fails closed", async () => {
  const bad = [
    {definition: assistant({id: ids.otherAssistant})},
    {definition: assistant({status: "INACTIVE"})},
    {definition: assistant({ownerScope: "INVALID"})},
    {definition: assistant({tenantId: ids.foreignTenant})},
    {definition: assistant({industryContextId: ids.otherIndustry})},
    {definition: assistant({industryContextId: "not-a-uuid"})},
    {definition: assistant({ownerScope: "PLATFORM", tenantId: ids.tenant, industryContextId: undefined})},
    {definition: assistant({ownerScope: "TENANT", tenantId: ids.tenant, industryContextId: ids.industry})},
    {row: memory({industryContextId: undefined}), definition: assistant()},
  ];
  for (const candidate of bad) {
    const f = fixture({memory: candidate.row ?? memory(), assistant: candidate.definition});
    assert.equal(await load(f), null);
    assert.equal(f.assistantCalls.length, 1);
  }
});

test("AIMEM-ASTREAD-EVID-001 frozen envelope preserves exact raw records and all input metadata", async () => {
  const f = fixture();
  const ctx = context();
  const before = JSON.stringify([f.value.memory, f.value.assistant, ctx]);
  const result = await load(f, {requestContext: ctx});
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.memory, f.value.memory);
  assert.equal(result.assistant, f.value.assistant);
  assert.equal(result.memory.status, "ERASED");
  assert.equal(result.memory.aclPolicyRef, "raw-acl");
  assert.equal(result.assistant.version, 3);
  assert.equal(JSON.stringify([f.value.memory, f.value.assistant, ctx]), before);
});

test("AIMEM-ASTREAD-BOUND-001 no memory authorization currentness disclosure retention or AI execution authority", async () => {
  for (const result of [
    await load(fixture()),
    await load(fixture({memory: memory({assistantDefinitionId: undefined})})),
  ]) {
    assert.ok(result);
    for (const forbidden of [
      "principalAuthorized", "aclAuthorized", "currentMemory",
      "effectiveMemory", "selectedMemory", "supersessionChain",
      "retentionAllowed", "expiryValid", "erasureAllowed",
      "contentDecrypted", "sourceResolved", "crossContextAllowed",
      "assistantSelected", "assistantAuthorized", "promptIncluded",
      "ragAuthorized", "providerAuthorized", "toolAuthorized",
      "inferenceAuthorized", "executionAuthorized", "mutation",
    ]) assert.equal(forbidden in result, false);
  }
});
