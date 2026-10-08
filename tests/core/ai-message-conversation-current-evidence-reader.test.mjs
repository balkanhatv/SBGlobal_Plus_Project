import test from "node:test";
import assert from "node:assert/strict";
import { loadAIMessageConversationCurrentEvidence } from "../../dist/core/index.js";

const ids = Object.freeze({
  message: "11111111-1111-4111-8111-111111111111",
  conversation: "22222222-2222-4222-8222-222222222222",
  otherConversation: "23232323-2323-4232-8232-232323232323",
  tenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "message-request", correlationId: "message-correlation",
    tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.principal, principalType: "HUMAN",
    scopeClass: "TENANT_INDUSTRY", orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]), permissionVersion: 1,
    entitlementSnapshotVersion: 1, dataHomeId: "home", regionCode: "IN-CENTRAL",
    ...overrides,
  });
}
function message(overrides = {}) {
  return Object.freeze({
    id: ids.message, conversationId: ids.conversation,
    role: "", contentRefOrEncryptedContent: "opaque-ciphertext-ref",
    sourceRefs: Object.freeze({ raw: ["opaque-source"] }),
    modelRouteId: ids.otherConversation,
    createdAt: "2026-10-08T12:00:00.000Z",
    deletedAt: "2026-10-07T12:00:00.000Z", ...overrides,
  });
}
function conversation(overrides = {}) {
  return Object.freeze({
    id: ids.conversation, tenantId: ids.tenant,
    industryContextId: ids.industry, scopeClass: "TENANT_INDUSTRY",
    ownerPrincipalId: ids.principal, assistantDefinitionId: ids.otherConversation,
    sensitivityClass: "REGULATED", retentionClass: "", status: "OPAQUE_STATUS",
    createdAt: "2026-10-08T12:00:00.000Z",
    lastActivityAt: "2026-10-07T12:00:00.000Z", ...overrides,
  });
}
function fixture(overrides = {}) {
  const value = {
    message: Object.hasOwn(overrides, "message") ? overrides.message : message(),
    conversation: Object.hasOwn(overrides, "conversation") ? overrides.conversation : conversation(),
  };
  const order = [], messageCalls = [], conversationCalls = [];
  return {
    value, order, messageCalls, conversationCalls,
    messageReader: {
      async loadForContext(input) {
        order.push("message"); messageCalls.push(input);
        if (overrides.messageError) throw overrides.messageError;
        return value.message;
      },
    },
    conversationReader: {
      async loadForContext(input) {
        order.push("conversation"); conversationCalls.push(input);
        if (overrides.conversationError) throw overrides.conversationError;
        return value.conversation;
      },
    },
  };
}
function load(f, requestContext = context()) {
  return loadAIMessageConversationCurrentEvidence(
    { requestContext, messageId: ids.message },
    f.messageReader, f.conversationReader,
  );
}

test("AIMSG-CONVREAD-BASE-001 exact message read first preserves id and context", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["message", "conversation"]);
  assert.equal(f.messageCalls.length, 1);
  assert.equal(f.messageCalls[0].messageId, ids.message);
  assert.equal(f.messageCalls[0].requestContext, ctx);
});

test("AIMSG-CONVREAD-BASE-002 absent child and child error prevent parent access", async () => {
  const missing = fixture({ message: null });
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["message"]);
  const error = new Error("message unavailable");
  const broken = fixture({ messageError: error });
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["message"]);
});

test("AIMSG-CONVREAD-CHILD-001 malformed child identity and FK deny before parent read", async () => {
  for (const row of [
    message({ id: "invalid" }), message({ id: null }),
    message({ conversationId: "invalid" }), message({ conversationId: null }),
    message({ conversationId: undefined }), {},
  ]) {
    const f = fixture({ message: row });
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["message"]);
  }
});

test("AIMSG-CONVREAD-READ-001 exact persisted conversation id read once with same context", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.deepEqual(f.order, ["message", "conversation"]);
  assert.equal(f.conversationCalls.length, 1);
  assert.equal(f.conversationCalls[0].conversationId, ids.conversation);
  assert.equal(f.conversationCalls[0].requestContext, ctx);
});

test("AIMSG-CONVREAD-READ-002 invisible parent and errors deny without fallback", async () => {
  const hidden = fixture({ conversation: null }), ctx = context();
  assert.equal(await load(hidden, ctx), null);
  assert.deepEqual(hidden.order, ["message", "conversation"]);
  assert.equal(hidden.conversationCalls[0].requestContext, ctx);
  const error = new Error("conversation unavailable");
  const broken = fixture({ conversationError: error });
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["message", "conversation"]);
});

test("AIMSG-CONVREAD-FLOOR-001 DD-199 exact FK parity and invalid parent reject", async () => {
  assert.ok(await load(fixture()));
  for (const row of [
    conversation({ id: ids.otherConversation }),
    conversation({ id: "invalid" }), conversation({ id: null }), {},
  ]) {
    const f = fixture({ conversation: row });
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["message", "conversation"]);
  }
});

test("AIMSG-CONVREAD-EVID-001 frozen envelope preserves uninterpreted raw references", async () => {
  const f = fixture(), before = JSON.stringify(f.value);
  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.message, f.value.message);
  assert.equal(result.conversation, f.value.conversation);
  assert.deepEqual(Object.keys(result).sort(), ["conversation", "message"]);
  assert.equal(result.message.role, "");
  assert.equal(result.message.deletedAt, "2026-10-07T12:00:00.000Z");
  assert.equal(result.conversation.retentionClass, "");
  assert.equal(result.conversation.status, "OPAQUE_STATUS");
  assert.equal(JSON.stringify(f.value), before);
});

test("AIMSG-CONVREAD-BOUND-001 direct relation conveys no history/content/AI authority", async () => {
  const result = await load(fixture({ conversation: conversation({
    scopeClass: "TENANT_CORE", industryContextId: undefined,
    ownerPrincipalId: ids.otherConversation, status: "ERASED",
  }) }));
  assert.ok(result);
  for (const flag of [
    "ownerAuthorized", "principalCurrent", "conversationAuthorized",
    "history", "messages", "contentAuthorized", "decryptedContent",
    "sourceAuthorized", "retentionAllowed", "erasureAllowed",
    "assistantSelected", "crossContextAllowed", "promptIncluded",
    "ragAuthorized", "modelRouteAuthorized", "providerAuthorized",
    "toolAuthorized", "agentAuthorized", "inferenceAuthorized",
    "executionAuthorized", "mutation",
  ]) assert.equal(flag in result, false);
  assert.equal(result.conversation.status, "ERASED");
  assert.equal(result.conversation.ownerPrincipalId, ids.otherConversation);
});
