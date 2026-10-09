import test from "node:test";
import assert from "node:assert/strict";
import {
  loadAIConversationAssistantReferencesCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  conversation: "11111111-1111-4111-8111-111111111111",
  assistant: "22222222-2222-4222-8222-222222222222",
  otherAssistant: "23232323-2323-4232-8232-232323232323",
  prompt: "33333333-3333-4333-8333-333333333333",
  otherPrompt: "34343434-3434-4434-8434-343434343434",
  toolSet: "44444444-4444-4444-8444-444444444444",
  otherToolSet: "45454545-4545-4454-8454-454545454545",
  tenant: "55555555-5555-4555-8555-555555555555",
  foreignTenant: "56565656-5656-4656-8656-565656565656",
  industry: "66666666-6666-4666-8666-666666666666",
  siblingIndustry: "67676767-6767-4767-8767-676767676767",
  principal: "77777777-7777-4777-8777-777777777777",
});
function context(overrides = {}) {
  return Object.freeze({
    requestId: "conversation-references-request",
    correlationId: "conversation-references-correlation",
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
    status: "OPAQUE_STATUS", createdAt: "2026-10-09T10:00:00Z",
    lastActivityAt: "2026-10-08T10:00:00Z", ...overrides,
  });
}
function assistant(overrides = {}) {
  return Object.freeze({
    id: ids.assistant, ownerScope: "INDUSTRY", tenantId: ids.tenant,
    industryContextId: ids.industry, code: "opaque.assistant",
    allowedCapabilities: Object.freeze(["opaque.capability"]),
    ragScopeRules: Object.freeze({raw: true}),
    promptTemplateId: ids.prompt, toolSetId: ids.toolSet,
    modelPolicyId: "opaque-model-policy", retentionPolicyId: "opaque-retention",
    version: 7, status: "ACTIVE", createdAt: "2026-10-09T11:00:00Z",
    updatedAt: "2026-10-08T11:00:00Z", ...overrides,
  });
}
function promptTemplate(overrides = {}) {
  return Object.freeze({
    id: ids.prompt, ownerScope: "INDUSTRY", tenantId: ids.tenant,
    industryContextId: ids.industry, code: "opaque.prompt", version: 3,
    systemTemplate: "opaque-text-not-for-disclosure",
    variableSchema: Object.freeze({raw: true}), groundingRequired: false,
    allowedOverrideFields: Object.freeze(["raw-field"]),
    status: "ACTIVE", createdBy: ids.principal, approvedBy: ids.principal,
    createdAt: "2026-10-09T12:00:00Z",
    updatedAt: "2026-10-08T12:00:00Z", ...overrides,
  });
}
function toolSet(overrides = {}) {
  return Object.freeze({
    id: ids.toolSet, ownerScope: "INDUSTRY", tenantId: ids.tenant,
    industryContextId: ids.industry, code: "opaque.tools", version: 13,
    status: "ACTIVE", createdAt: "2026-10-09T13:00:00Z",
    updatedAt: "2026-10-08T13:00:00Z", ...overrides,
  });
}
function fixture(overrides = {}) {
  const values = {
    conversation: Object.hasOwn(overrides, "conversation") ? overrides.conversation : conversation(),
    assistant: Object.hasOwn(overrides, "assistant") ? overrides.assistant : assistant(),
    prompt: Object.hasOwn(overrides, "prompt") ? overrides.prompt : promptTemplate(),
    toolSet: Object.hasOwn(overrides, "toolSet") ? overrides.toolSet : toolSet(),
  };
  const calls = {conversation: [], assistant: [], prompt: [], toolSet: []};
  const order = [];
  const create = (kind, errorName) => ({
    async loadForContext(input) {
      order.push(kind);
      calls[kind].push(input);
      if (overrides[errorName]) throw overrides[errorName];
      return values[kind];
    },
  });
  return {
    values, calls, order,
    conversationReader: create("conversation", "conversationError"),
    assistantReader: create("assistant", "assistantError"),
    promptTemplateReader: create("prompt", "promptError"),
    toolSetReader: create("toolSet", "toolSetError"),
  };
}
function load(f, requestContext = context()) {
  return loadAIConversationAssistantReferencesCurrentEvidence(
    {requestContext, conversationId: ids.conversation},
    f.conversationReader, f.assistantReader,
    f.promptTemplateReader, f.toolSetReader,
  );
}

test("AICONV-ASTREF-BASE-001 exact Conversation first, same original RequestContext and no reread", async () => {
  const f = fixture(), ctx = context();
  const result = await load(f, ctx);
  assert.ok(result);
  assert.deepEqual(f.order, ["conversation", "assistant", "prompt", "toolSet"]);
  assert.equal(f.calls.conversation.length, 1);
  assert.equal(f.calls.conversation[0].conversationId, ids.conversation);
  for (const kind of f.order) {
    assert.equal(f.calls[kind].length, 1);
    assert.equal(f.calls[kind][0].requestContext, ctx);
  }
});
test("AICONV-ASTREF-BASE-002 null/failed Conversation prevents dependent access", async () => {
  const missing = fixture({conversation: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["conversation"]);
  const error = new Error("conversation failure"), bad = fixture({conversationError: error});
  await assert.rejects(load(bad), e => e === error);
  assert.deepEqual(bad.order, ["conversation"]);
});
test("AICONV-ASTREF-UNBOUND-001 Core/Industry unbound returns frozen raw Conversation alone", async () => {
  for (const shape of [{}, {scopeClass: "TENANT_CORE", industryContextId: undefined}]) {
    const f = fixture({conversation: conversation({...shape, assistantDefinitionId: undefined})});
    const result = await load(f);
    assert.ok(result);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(result.conversation, f.values.conversation);
    assert.deepEqual(Object.keys(result), ["conversation"]);
    assert.deepEqual(f.order, ["conversation"]);
  }
});
test("AICONV-ASTREF-UNBOUND-002 malformed Conversation/Assistant FK fails before dependency read", async () => {
  for (const shape of [
    {id: "invalid"}, {tenantId: "invalid"}, {scopeClass: "PLATFORM_GLOBAL"},
    {scopeClass: "TENANT_CORE", industryContextId: ids.industry},
    {scopeClass: "TENANT_INDUSTRY", industryContextId: undefined},
    {scopeClass: "TENANT_INDUSTRY", industryContextId: "invalid"},
    {assistantDefinitionId: "invalid"}, {assistantDefinitionId: null},
  ]) {
    const f = fixture({conversation: conversation(shape)});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["conversation"]);
  }
});
test("AICONV-ASTREF-AST-001 exact bound Assistant uses DD-185 and original context", async () => {
  const f = fixture(), ctx = context();
  assert.ok(await load(f, ctx));
  assert.equal(f.calls.assistant[0].assistantDefinitionId, ids.assistant);
  assert.equal(f.calls.assistant[0].requestContext, ctx);
  const platform = fixture({
    assistant: assistant({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    prompt: promptTemplate({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
    toolSet: toolSet({ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined}),
  });
  assert.ok(await load(platform)); // Only if scoped ports supply these raw rows.
  const tenant = fixture({
    assistant: assistant({ownerScope: "TENANT", industryContextId: undefined}),
    prompt: promptTemplate({ownerScope: "TENANT", industryContextId: undefined}),
    toolSet: toolSet({ownerScope: "TENANT", industryContextId: undefined}),
  });
  assert.ok(await load(tenant));
});
test("AICONV-ASTREF-AST-002 wrong/inactive/foreign/invisible Assistant or reader failure never reads prompt", async () => {
  for (const row of [
    null, {}, assistant({id: ids.otherAssistant}),
    assistant({status: "DRAFT"}), assistant({tenantId: ids.foreignTenant}),
    assistant({industryContextId: ids.siblingIndustry}),
    assistant({ownerScope: "TENANT", industryContextId: ids.industry}),
    assistant({ownerScope: "PLATFORM", industryContextId: ids.industry}),
    assistant({promptTemplateId: "invalid"}), assistant({toolSetId: "invalid"}),
  ]) {
    const f = fixture({assistant: row});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["conversation", "assistant"]);
  }
  const error = new Error("assistant failure"), bad = fixture({assistantError: error});
  await assert.rejects(load(bad), e => e === error);
  assert.deepEqual(bad.order, ["conversation", "assistant"]);
});
test("AICONV-ASTREF-PROMPT-001 required PromptTemplate exact id, ACTIVE, applicable owner and same context", async () => {
  for (const scope of [
    {ownerScope: "INDUSTRY", tenantId: ids.tenant, industryContextId: ids.industry},
    {ownerScope: "TENANT", tenantId: ids.tenant, industryContextId: undefined},
    {ownerScope: "PLATFORM", tenantId: undefined, industryContextId: undefined},
  ]) {
    const f = fixture({prompt: promptTemplate(scope)}), ctx = context();
    const result = await load(f, ctx);
    assert.ok(result);
    assert.equal(result.promptTemplate, f.values.prompt);
    assert.equal(f.calls.prompt.length, 1);
    assert.equal(f.calls.prompt[0].promptTemplateId, ids.prompt);
    assert.equal(f.calls.prompt[0].requestContext, ctx);
  }
});
test("AICONV-ASTREF-PROMPT-002 invalid/missing/hidden/non-ACTIVE/foreign Prompt denies before ToolSet access", async () => {
  for (const p of [
    null, {}, promptTemplate({id: ids.otherPrompt}),
    promptTemplate({status: "RETIRED"}),
    promptTemplate({tenantId: ids.foreignTenant}),
    promptTemplate({industryContextId: ids.siblingIndustry}),
    promptTemplate({ownerScope: "PLATFORM", tenantId: ids.tenant, industryContextId: undefined}),
    promptTemplate({ownerScope: "TENANT", industryContextId: ids.industry}),
  ]) {
    const f = fixture({prompt: p});
    assert.equal(await load(f), null);
    assert.deepEqual(f.order, ["conversation", "assistant", "prompt"]);
  }
  const error = new Error("prompt failure"), broken = fixture({promptError: error});
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["conversation", "assistant", "prompt"]);
});
test("AICONV-ASTREF-TOOL-001 absent ToolSet makes no read; present exact scoped ACTIVE ToolSet only", async () => {
  const unboundTools = fixture({assistant: assistant({toolSetId: undefined})});
  const noTools = await load(unboundTools);
  assert.ok(noTools);
  assert.deepEqual(unboundTools.order, ["conversation", "assistant", "prompt"]);
  assert.equal(noTools.toolSet, undefined);
  assert.deepEqual(Object.keys(noTools).sort(), ["assistant", "conversation", "promptTemplate"]);
  const full = fixture();
  const result = await load(full);
  assert.ok(result);
  assert.equal(result.toolSet, full.values.toolSet);
  assert.equal(Object.isFrozen(result), true);
  for (const t of [
    null, {}, toolSet({id: ids.otherToolSet}), toolSet({status: "DRAFT"}),
    toolSet({tenantId: ids.foreignTenant}), toolSet({industryContextId: ids.siblingIndustry}),
    toolSet({ownerScope: "PLATFORM", tenantId: ids.tenant, industryContextId: undefined}),
  ]) assert.equal(await load(fixture({toolSet: t})), null);
  const error = new Error("toolset failure"), broken = fixture({toolSetError: error});
  await assert.rejects(load(broken), e => e === error);
  assert.deepEqual(broken.order, ["conversation", "assistant", "prompt", "toolSet"]);
});
test("AICONV-ASTREF-BOUND-001 unchanged raw evidence and no execution/content/history authorization", async () => {
  const f = fixture({assistant: assistant({version: -1}), prompt: promptTemplate({
    systemTemplate: "opaque-stays-opaque", version: -2,
  }), toolSet: toolSet({version: -3})});
  const ctx = context(), before = JSON.stringify([f.values, ctx]);
  for (const output of [
    await load(f, ctx),
    await load(fixture({assistant: assistant({toolSetId: undefined})})),
    await load(fixture({conversation: conversation({assistantDefinitionId: undefined})})),
  ]) {
    assert.ok(output);
    assert.equal(Object.isFrozen(output), true);
    for (const forbidden of [
      "ownerAuthorized", "principalCurrent", "historyAuthorized", "history",
      "messages", "contentAuthorized", "promptRendered", "promptApproved",
      "effectiveAssistant", "assistantSelected", "toolMembers", "toolAuthorized",
      "modelAuthorized", "providerAuthorized", "ragAuthorized", "inferenceAuthorized",
      "executionAuthorized", "crossContextAllowed", "retentionAllowed",
      "erasureAllowed", "mutation", "atomicSnapshot",
    ]) assert.equal(forbidden in output, false);
  }
  const result = await load(f, ctx);
  assert.equal(result.conversation, f.values.conversation);
  assert.equal(result.assistant, f.values.assistant);
  assert.equal(result.promptTemplate, f.values.prompt);
  assert.equal(result.toolSet, f.values.toolSet);
  assert.equal(JSON.stringify([f.values, ctx]), before);
});
