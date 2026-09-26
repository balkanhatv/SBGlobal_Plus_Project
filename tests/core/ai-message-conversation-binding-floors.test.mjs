import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIMessageConversationBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  message: "11111111-1111-4111-8111-111111111111",
  conversation: "22222222-2222-4222-8222-222222222222",
  otherConversation: "33333333-3333-4333-8333-333333333333",
  tenant: "44444444-4444-4444-8444-444444444444",
  industry: "55555555-5555-4555-8555-555555555555",
  owner: "66666666-6666-4666-8666-666666666666",
  assistant: "77777777-7777-4777-8777-777777777777",
  route: "88888888-8888-4888-8888-888888888888",
});

const baseMessage = Object.freeze({
  id: ids.message,
  conversationId: ids.conversation,
  role: "USER",
  contentRefOrEncryptedContent: "opaque://message",
  sourceRefs: Object.freeze({raw: true}),
  modelRouteId: ids.route,
  createdAt: "2026-09-25T00:00:00.000Z",
  deletedAt: undefined,
});

const baseConversation = Object.freeze({
  id: ids.conversation,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  scopeClass: "TENANT_INDUSTRY",
  ownerPrincipalId: ids.owner,
  assistantDefinitionId: ids.assistant,
  sensitivityClass: "CONFIDENTIAL",
  retentionClass: "STANDARD",
  status: "ACTIVE",
  createdAt: "2026-09-25T00:00:00.000Z",
  lastActivityAt: "2026-09-25T00:01:00.000Z",
});

function message(overrides = {}) {
  return Object.freeze({...baseMessage, ...overrides});
}

function conversation(overrides = {}) {
  return Object.freeze({...baseConversation, ...overrides});
}

test("AIMSG-CONV-CUR-001 exact message conversation id and Conversation id pass", () => {
  assert.equal(
    matchesAIMessageConversationBindingFloors(message(), conversation()),
    true,
  );
});

test("AIMSG-CONV-CUR-002 missing Conversation evidence or mismatched parent id fails closed", () => {
  assert.equal(matchesAIMessageConversationBindingFloors(message()), false);
  assert.equal(
    matchesAIMessageConversationBindingFloors(
      message(),
      conversation({id: ids.otherConversation}),
    ),
    false,
  );
});

test("AIMSG-CONV-CUR-003 malformed Message or Conversation relevant ids fail closed", () => {
  assert.equal(
    matchesAIMessageConversationBindingFloors(
      message({id: "bad"}),
      conversation(),
    ),
    false,
  );
  assert.equal(
    matchesAIMessageConversationBindingFloors(
      message({conversationId: "bad"}),
      conversation(),
    ),
    false,
  );
  assert.equal(
    matchesAIMessageConversationBindingFloors(
      message(),
      conversation({id: "bad"}),
    ),
    false,
  );
});

test("AIMSG-CONV-CUR-004 Message role/content/source/model-route/time evidence is uninterpreted", () => {
  const raw = message({
    role: "",
    contentRefOrEncryptedContent: "",
    sourceRefs: Object.freeze(["raw"]),
    modelRouteId: "not-interpreted",
    createdAt: "not-interpreted",
    deletedAt: "not-interpreted",
  });
  assert.equal(
    matchesAIMessageConversationBindingFloors(raw, conversation()),
    true,
  );
});

test("AIMSG-CONV-CUR-005 Conversation scope/principal/assistant/security/lifecycle/time evidence is uninterpreted", () => {
  const raw = conversation({
    tenantId: "not-interpreted",
    industryContextId: "not-interpreted",
    scopeClass: "UNKNOWN",
    ownerPrincipalId: "not-interpreted",
    assistantDefinitionId: "not-interpreted",
    sensitivityClass: "UNKNOWN",
    retentionClass: "",
    status: "RETIRED",
    createdAt: "not-interpreted",
    lastActivityAt: "not-interpreted",
  });
  assert.equal(
    matchesAIMessageConversationBindingFloors(message(), raw),
    true,
  );
});

test("AIMSG-CONV-CUR-006 inputs remain unchanged and true grants no authorization/execution authority", () => {
  const candidateMessage = message();
  const candidateConversation = conversation();
  const beforeMessage = JSON.stringify(candidateMessage);
  const beforeConversation = JSON.stringify(candidateConversation);

  assert.equal(
    matchesAIMessageConversationBindingFloors(
      candidateMessage,
      candidateConversation,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateMessage), beforeMessage);
  assert.equal(JSON.stringify(candidateConversation), beforeConversation);
  assert.equal("authorized" in candidateConversation, false);
  assert.equal("routeEligible" in candidateMessage, false);
  assert.equal("executable" in candidateMessage, false);
});
