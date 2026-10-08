import test from "node:test";
import assert from "node:assert/strict";
import {
  loadAIConversationAssistantBindingCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  foreignTenant: "12121212-1212-4212-8212-121212121212",
  industry: "22222222-2222-4222-8222-222222222222",
  siblingIndustry: "23232323-2323-4232-8232-232323232323",
  conversation: "33333333-3333-4333-8333-333333333333",
  assistant: "44444444-4444-4444-8444-444444444444",
  otherAssistant: "45454545-4545-4545-8545-454545454545",
  principal: "66666666-6666-4666-8666-666666666666",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "conversation-request", correlationId: "conversation-correlation",
    tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.principal, principalType: "HUMAN",
    scopeClass: "TENANT_INDUSTRY", orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]), permissionVersion: 1,
    entitlementSnapshotVersion: 1, dataHomeId: "home", regionCode: "IN-CENTRAL",
    ...overrides,
  });
}

function conversation(overrides = {}) {
  return Object.freeze({
    id: ids.conversation, tenantId: ids.tenant,
    industryContextId: ids.industry, scopeClass: "TENANT_INDUSTRY",
    ownerPrincipalId: ids.principal, assistantDefinitionId: ids.assistant,
    sensitivityClass: "REGULATED", retentionClass: "opaque-retention",
    status: "OPAQUE_STATUS", createdAt: "2026-10-08T10:00:00.000Z",
    lastActivityAt: "2026-10-07T10:00:00.000Z", ...overrides,
  });
}

function assistant(overrides = {}) {
  return Object.freeze({
    id: ids.assistant, ownerScope: "INDUSTRY", tenantId: ids.tenant,
    industryContextId: ids.industry, code: "opaque.assistant",
    allowedCapabilities: Object.freeze(["opaque.capability"]),
    ragScopeRules: Object.freeze({raw: true}),
    promptTemplateId: ids.otherAssistant, toolSetId: ids.otherAssistant,
    modelPolicyId: "opaque-model-policy", retentionPolicyId: "opaque-retention",
    version: 7, status: "ACTIVE", createdAt: "2026-10-06T10:00:00.000Z",
    updatedAt: "2026-10-08T10:00:00.000Z", ...overrides,
  });
}

function fixture(overrides = {}) {
  const value = {
    conversation: Object.hasOwn(overrides, "conversation")
      ? overrides.conversation : conversation(),
    assistant: Object.hasOwn(overrides, "assistant")
      ? overrides.assistant : assistant(),
  };
  const order = [], conversationCalls = [], assistantCalls = [];
  return {
    value, order, conversationCalls, assistantCalls,
    conversationReader: {
      async loadForContext(input) {
        order.push("conversation"); conversationCalls.push(input);
        if (overrides.conversationError) throw overrides.conversationError;
        return value.conversation;
      },
    },
    assistantReader: {
      async loadForContext(input) {
        order.push("assistant"); assistantCalls.push(input);
        if (overrides.assistantError) throw overrides.assistantError;
        return value.assistant;
      },
    },
  };
}

function load(f, requestContext = context()) {
  return loadAIConversationAssistantBindingCurrentEvidence(
    {requestContext, conversationId: ids.conversation},
    f.conversationReader, f.assistantReader,
  );
}

const malformedShapes = [
  {id: "invalid"}, {tenantId: "invalid"},
  {scopeClass: "PLATFORM_GLOBAL"},
  {scopeClass: "TENANT_CORE", industryContextId: ids.industry},
  {scopeClass: "TENANT_INDUSTRY", industryContextId: undefined},
  {scopeClass: "TENANT_INDUSTRY", industryContextId: "invalid"},
];

test("AICONV-ASTREAD-BASE-001 exact conversation read comes first with unchanged id and context", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["conversation", "assistant"]);
  assert.equal(f.conversationCalls.length, 1);
  assert.equal(f.conversationCalls[0].conversationId, ids.conversation);
  assert.equal(f.conversationCalls[0].requestContext, ctx);
});

test("AICONV-ASTREAD-BASE-002 missing conversation and dependency errors prevent assistant access", async () => {
  const missing = fixture({conversation: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["conversation"]);
  const error = new Error("conversation unavailable");
  const broken = fixture({conversationError: error});
  await assert.rejects(load(broken), candidate => candidate === error);
  assert.deepEqual(broken.order, ["conversation"]);
});

test("AICONV-ASTREAD-UNBOUND-001 valid Core and Industry unbound rows need no assistant read", async () => {
  for (const shape of [
    {}, {scopeClass: "TENANT_CORE", industryContextId: undefined},
  ]) {
    const row = conversation({...shape, assistantDefinitionId: undefined});
    const f = fixture({conversation: row});
    const result = await load(f);
    assert.ok(result);
    assert.equal(result.conversation, row);
    assert.equal(Object.isFrozen(result), true);
    assert.deepEqual(Object.keys(result), ["conversation"]);
    assert.deepEqual(f.order, ["conversation"]);
  }
});

test("AICONV-ASTREAD-UNBOUND-002 malformed unbound identity and scope fail closed without dependency access", async () => {
  for (const shape of malformedShapes) {
    const f = fixture({conversation: conversation({...shape, assistantDefinitionId: undefined})});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["conversation"]);
  }
});

test("AICONV-ASTREAD-READ-001 bound row reads its exact assistant once under identical RequestContext", async () => {
  const f = fixture(), ctx = context();
  const result = await load(f, ctx);
  assert.ok(result);
  assert.equal(f.assistantCalls.length, 1);
  assert.equal(f.assistantCalls[0].requestContext, ctx);
  assert.equal(f.assistantCalls[0].assistantDefinitionId, ids.assistant);
  assert.equal(result.assistant, f.value.assistant);
});

test("AICONV-ASTREAD-READ-002 malformed binding null visibility and errors never cause privileged fallback", async () => {
  for (const shape of [...malformedShapes,
    {assistantDefinitionId: "invalid"}, {assistantDefinitionId: null},
  ]) {
    const f = fixture({conversation: conversation(shape)});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["conversation"]);
  }
  const ctx = context();
  const hidden = fixture({assistant: null});
  assert.equal(await load(hidden, ctx), null);
  assert.deepEqual(hidden.order, ["conversation", "assistant"]);
  assert.equal(hidden.assistantCalls[0].requestContext, ctx);
  const error = new Error("assistant unavailable");
  const broken = fixture({assistantError: error});
  await assert.rejects(load(broken), candidate => candidate === error);
  assert.deepEqual(broken.order, ["conversation", "assistant"]);
});

test("AICONV-ASTREAD-FLOOR-001 existing owner applicability passes without changing conversation or request scope", async () => {
  const platform = assistant({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined});
  const tenant = assistant({ownerScope: "TENANT", industryContextId: undefined});
  const core = conversation({scopeClass: "TENANT_CORE", industryContextId: undefined});
  // Supplied PLATFORM evidence exercises only DD-185 applicability. Actual
  // scoped-port invisibility is a null result, tested above without fallback.
  for (const [row, definition] of [
    [conversation(), assistant()], [conversation(), tenant],
    [core, tenant], [conversation(), platform], [core, platform],
  ]) {
    const f = fixture({conversation: row, assistant: definition}), ctx = context();
    const result = await load(f, ctx);
    assert.ok(result);
    assert.equal(result.conversation, row);
    assert.equal(result.assistant, definition);
    assert.equal(f.assistantCalls[0].requestContext, ctx);
    assert.equal(result.conversation.scopeClass, row.scopeClass);
  }
});

test("AICONV-ASTREAD-FLOOR-002 mismatched id status owner Tenant or Industry denies relationship evidence", async () => {
  for (const definition of [
    assistant({id: ids.otherAssistant}), assistant({id: "invalid"}),
    assistant({status: "INACTIVE"}), assistant({status: "active"}),
    assistant({ownerScope: "INVALID"}), assistant({tenantId: ids.foreignTenant}),
    assistant({industryContextId: ids.siblingIndustry}),
    assistant({industryContextId: "invalid"}),
    assistant({ownerScope: "PLATFORM", industryContextId: undefined}),
    assistant({ownerScope: "TENANT"}),
    assistant({ownerScope: "TENANT", tenantId: ids.foreignTenant, industryContextId: undefined}),
  ]) {
    assert.equal(await load(fixture({assistant: definition})), null);
  }
  const core = conversation({scopeClass: "TENANT_CORE", industryContextId: undefined});
  assert.equal(await load(fixture({conversation: core})), null);
});

test("AICONV-ASTREAD-EVID-001 frozen envelope preserves raw identities status policies and unordered timestamps", async () => {
  const f = fixture(), ctx = context();
  const before = JSON.stringify([f.value, ctx]);
  const result = await load(f, ctx);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.conversation, f.value.conversation);
  assert.equal(result.assistant, f.value.assistant);
  assert.equal(result.conversation.status, "OPAQUE_STATUS");
  assert.equal(result.conversation.sensitivityClass, "REGULATED");
  assert.equal(result.conversation.retentionClass, "opaque-retention");
  assert.equal(result.assistant.version, 7);
  assert.equal(JSON.stringify([f.value, ctx]), before);
});

test("AICONV-ASTREAD-BOUND-001 binding evidence confers no owner history retention selection or execution authority", async () => {
  for (const result of [
    await load(fixture()),
    await load(fixture({conversation: conversation({assistantDefinitionId: undefined})})),
  ]) {
    assert.ok(result);
    for (const flag of [
      "ownerAuthorized", "principalCurrent", "conversationAuthorized",
      "history", "messages", "historyAuthorized", "retentionAllowed",
      "erasureAllowed", "assistantSelected", "assistantAuthorized",
      "effectiveAssistant", "crossContextAllowed", "promptIncluded",
      "ragAuthorized", "providerAuthorized", "toolAuthorized",
      "agentAuthorized", "inferenceAuthorized", "executionAuthorized", "mutation",
    ]) assert.equal(flag in result, false);
    assert.deepEqual(Object.keys(result).sort(), result.assistant
      ? ["assistant", "conversation"] : ["conversation"]);
  }
});
