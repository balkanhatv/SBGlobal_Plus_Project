import test from "node:test";
import assert from "node:assert/strict";
import { loadAIMessageConversationAssistantCurrentEvidence } from "../../dist/core/index.js";

const ids = Object.freeze({
  message: "11111111-1111-4111-8111-111111111111",
  conversation: "22222222-2222-4222-8222-222222222222",
  otherConversation: "23232323-2323-4232-8232-232323232323",
  assistant: "33333333-3333-4333-8333-333333333333",
  otherAssistant: "34343434-3434-4434-8434-343434343434",
  tenant: "44444444-4444-4444-8444-444444444444",
  foreignTenant: "45454545-4545-4545-8545-454545454545",
  industry: "55555555-5555-4555-8555-555555555555",
  siblingIndustry: "56565656-5656-4656-8656-565656565656",
  principal: "66666666-6666-4666-8666-666666666666",
});
function context(overrides = {}) {
  return Object.freeze({
    requestId: "message-assistant-request", correlationId: "message-assistant-correlation",
    tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.principal, principalType: "HUMAN", scopeClass: "TENANT_INDUSTRY",
    orgUnitPath: Object.freeze([]), roleIds: Object.freeze([]),
    permissionVersion: 1, entitlementSnapshotVersion: 1,
    dataHomeId: "home", regionCode: "IN-CENTRAL", ...overrides,
  });
}
function message(overrides = {}) {
  return Object.freeze({
    id: ids.message, conversationId: ids.conversation, role: "OPAQUE_ROLE",
    contentRefOrEncryptedContent: "opaque-ref", sourceRefs: Object.freeze({raw: ["source"]}),
    modelRouteId: ids.otherAssistant, createdAt: "2026-10-08T12:00:00Z",
    deletedAt: "2026-10-07T12:00:00Z", ...overrides,
  });
}
function conversation(overrides = {}) {
  return Object.freeze({
    id: ids.conversation, tenantId: ids.tenant,
    industryContextId: ids.industry, scopeClass: "TENANT_INDUSTRY",
    ownerPrincipalId: ids.principal, assistantDefinitionId: ids.assistant,
    sensitivityClass: "REGULATED", retentionClass: "opaque-retention",
    status: "ERASED", createdAt: "2026-10-08T12:00:00Z",
    lastActivityAt: "2026-10-07T12:00:00Z", ...overrides,
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
    version: 7, status: "ACTIVE", createdAt: "2026-10-08T12:00:00Z",
    updatedAt: "2026-10-07T12:00:00Z", ...overrides,
  });
}
function fixture(overrides = {}) {
  const value = {
    message: Object.hasOwn(overrides, "message") ? overrides.message : message(),
    conversation: Object.hasOwn(overrides, "conversation") ? overrides.conversation : conversation(),
    assistant: Object.hasOwn(overrides, "assistant") ? overrides.assistant : assistant(),
  };
  const calls = {message: [], conversation: [], assistant: []};
  const order = [];
  return {
    value, calls, order,
    messageReader: {
      async loadForContext(input) {
        order.push("message"); calls.message.push(input);
        if (overrides.messageError) throw overrides.messageError;
        return value.message;
      },
    },
    conversationReader: {
      async loadForContext(input) {
        order.push("conversation"); calls.conversation.push(input);
        if (overrides.conversationError) throw overrides.conversationError;
        return value.conversation;
      },
    },
    assistantReader: {
      async loadForContext(input) {
        order.push("assistant"); calls.assistant.push(input);
        if (overrides.assistantError) throw overrides.assistantError;
        return value.assistant;
      },
    },
  };
}
function load(f, requestContext = context()) {
  return loadAIMessageConversationAssistantCurrentEvidence(
    {requestContext, messageId: ids.message},
    f.messageReader, f.conversationReader, f.assistantReader,
  );
}

test("AIMSG-CONVASTREAD-BASE-001 exact Message read first and only once", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["message", "conversation", "assistant"]);
  assert.equal(f.calls.message.length, 1);
  assert.equal(f.calls.message[0].requestContext, ctx);
  assert.equal(f.calls.message[0].messageId, ids.message);
});
test("AIMSG-CONVASTREAD-BASE-002 null/error child prevents both parent reads", async () => {
  const absent = fixture({message: null});
  assert.equal(await load(absent), null);
  assert.deepEqual(absent.order, ["message"]);
  const error = new Error("message dependency");
  const broken = fixture({messageError: error});
  await assert.rejects(load(broken), candidate => candidate === error);
  assert.deepEqual(broken.order, ["message"]);
});
test("AIMSG-CONVASTREAD-CHILD-001 malformed Message necessary linkage rejects before parent", async () => {
  for (const row of [
    {}, null, message({id: null}), message({id: "invalid"}),
    message({conversationId: null}), message({conversationId: undefined}),
    message({conversationId: "invalid"}),
  ]) {
    const f = fixture({message: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["message"]);
  }
});
test("AIMSG-CONVASTREAD-CONV-001 exact persisted Conversation read and DD-199 equality", async () => {
  const f = fixture(), ctx = context({scopeClass: "TENANT_INDUSTRY"});
  const result = await load(f, ctx);
  assert.ok(result);
  assert.deepEqual(f.order, ["message", "conversation", "assistant"]);
  assert.equal(f.calls.conversation.length, 1);
  assert.equal(f.calls.conversation[0].conversationId, ids.conversation);
  assert.equal(f.calls.conversation[0].requestContext, ctx);
});
test("AIMSG-CONVASTREAD-CONV-002 invisible/wrong/malformed Conversation or error short circuits Assistant", async () => {
  for (const row of [
    null, {}, conversation({id: ids.otherConversation}),
    conversation({id: "invalid"}), conversation({id: null}),
  ]) {
    const f = fixture({conversation: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["message", "conversation"]);
  }
  const err = new Error("conversation dependency");
  const f = fixture({conversationError: err});
  await assert.rejects(load(f), e => e === err);
  assert.deepEqual(f.order, ["message", "conversation"]);
});
test("AIMSG-CONVASTREAD-UNBOUND-001 valid unbound Core/Industry pass; malformed scope denies", async () => {
  for (const scope of [
    {}, {scopeClass: "TENANT_CORE", industryContextId: undefined},
  ]) {
    const f = fixture({conversation: conversation({...scope, assistantDefinitionId: undefined})});
    const result = await load(f);
    assert.ok(result);
    assert.equal(result.message, f.value.message);
    assert.equal(result.conversation, f.value.conversation);
    assert.deepEqual(Object.keys(result).sort(), ["conversation", "message"]);
    assert.equal(Object.isFrozen(result), true);
    assert.deepEqual(f.order, ["message", "conversation"]);
  }
  for (const invalid of [
    {id: "invalid"}, {tenantId: "invalid"}, {scopeClass: "INVALID"},
    {scopeClass: "TENANT_CORE", industryContextId: ids.industry},
    {scopeClass: "TENANT_INDUSTRY", industryContextId: undefined},
    {scopeClass: "TENANT_INDUSTRY", industryContextId: "invalid"},
  ]) {
    const f = fixture({conversation: conversation({...invalid, assistantDefinitionId: undefined})});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["message", "conversation"]);
  }
});
test("AIMSG-CONVASTREAD-AST-001 bound assistant read uses persisted id and same context; malformed shape before access", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.equal(f.calls.assistant.length, 1);
  assert.equal(f.calls.assistant[0].requestContext, ctx);
  assert.equal(f.calls.assistant[0].assistantDefinitionId, ids.assistant);
  for (const invalid of [
    {id: "invalid"}, {tenantId: "invalid"},
    {scopeClass: "TENANT_CORE", industryContextId: ids.industry},
    {scopeClass: "TENANT_INDUSTRY", industryContextId: undefined},
    {scopeClass: "TENANT_INDUSTRY", industryContextId: "invalid"},
    {assistantDefinitionId: "invalid"}, {assistantDefinitionId: null},
  ]) {
    const item = fixture({conversation: conversation(invalid)});
    assert.equal(await load(item), null);
    assert.deepEqual(item.order, ["message", "conversation"]);
  }
});
test("AIMSG-CONVASTREAD-AST-002 missing/error/invalid Assistant denied; applicable owners remain port-scoped", async () => {
  const absent = fixture({assistant: null}), ctx = context();
  assert.equal(await load(absent, ctx), null);
  assert.deepEqual(absent.order, ["message", "conversation", "assistant"]);
  assert.equal(absent.calls.assistant[0].requestContext, ctx);
  const err = new Error("assistant dependency");
  const broken = fixture({assistantError: err});
  await assert.rejects(load(broken), e => e === err);
  assert.deepEqual(broken.order, ["message", "conversation", "assistant"]);
  for (const row of [
    {}, assistant({id: ids.otherAssistant}), assistant({id: null}),
    assistant({status: "INACTIVE"}), assistant({status: "active"}),
    assistant({ownerScope: "INVALID"}), assistant({tenantId: ids.foreignTenant}),
    assistant({industryContextId: ids.siblingIndustry}),
    assistant({ownerScope: "TENANT", industryContextId: ids.industry}),
    assistant({ownerScope: "PLATFORM", tenantId: ids.tenant, industryContextId: undefined}),
  ]) assert.equal(await load(fixture({assistant: row})), null);
  for (const owner of [
    assistant(), assistant({ownerScope: "TENANT", industryContextId: undefined}),
    assistant({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
  ]) {
    const eligible = fixture({assistant: owner});
    const result = await load(eligible);
    assert.ok(result);
    assert.equal(result.assistant, owner);
  }
  const core = fixture({
    conversation: conversation({scopeClass: "TENANT_CORE", industryContextId: undefined}),
    assistant: assistant({ownerScope: "TENANT", industryContextId: undefined}),
  });
  assert.ok(await load(core));
  assert.equal(await load(fixture({conversation: conversation({
    scopeClass: "TENANT_CORE", industryContextId: undefined,
  })})), null);
});
test("AIMSG-CONVASTREAD-EVID-001 both envelopes frozen with exact raw identities and opaque metadata", async () => {
  const f = fixture(), ctx = context();
  const before = JSON.stringify([f.value, ctx]);
  const result = await load(f, ctx);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.message, f.value.message);
  assert.equal(result.conversation, f.value.conversation);
  assert.equal(result.assistant, f.value.assistant);
  assert.equal(result.message.deletedAt, "2026-10-07T12:00:00Z");
  assert.equal(result.conversation.status, "ERASED");
  assert.equal(result.conversation.sensitivityClass, "REGULATED");
  assert.equal(result.assistant.version, 7);
  assert.equal(JSON.stringify([f.value, ctx]), before);
});
test("AIMSG-CONVASTREAD-BOUND-001 relationships grant no content/history/current Assistant or execution authority", async () => {
  for (const result of [
    await load(fixture()),
    await load(fixture({conversation: conversation({assistantDefinitionId: undefined})})),
  ]) {
    assert.ok(result);
    for (const key of [
      "principalCurrent", "ownerAuthorized", "conversationAuthorized",
      "messages", "history", "contentAuthorized", "decryptedContent",
      "sourceAuthorized", "retentionAllowed", "erasureAllowed",
      "assistantSelected", "effectiveAssistant", "crossContextAllowed",
      "promptIncluded", "ragAuthorized", "providerAuthorized",
      "modelRouteAuthorized", "toolAuthorized", "agentAuthorized",
      "inferenceAuthorized", "executionAuthorized", "mutation",
    ]) assert.equal(key in result, false);
    assert.deepEqual(Object.keys(result).sort(), result.assistant
      ? ["assistant", "conversation", "message"] : ["conversation", "message"]);
  }
});
