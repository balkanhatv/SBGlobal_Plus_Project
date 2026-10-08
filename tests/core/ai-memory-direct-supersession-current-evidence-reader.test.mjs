import test from "node:test";
import assert from "node:assert/strict";
import {
  loadAIMemoryDirectSupersessionCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  foreignTenant: "12121212-1212-4212-8212-121212121212",
  industry: "22222222-2222-4222-8222-222222222222",
  otherIndustry: "23232323-2323-4232-8232-232323232323",
  child: "33333333-3333-4333-8333-333333333333",
  parent: "44444444-4444-4444-8444-444444444444",
  otherParent: "45454545-4545-4545-8545-454545454545",
  principal: "66666666-6666-4666-8666-666666666666",
  otherPrincipal: "67676767-6767-4767-8767-676767676767",
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

function record(overrides = {}) {
  return Object.freeze({
    id: ids.child, tenantId: ids.tenant, industryContextId: ids.industry,
    principalId: ids.principal, memoryClass: "USER_PREFERENCE",
    contentRefOrEncryptedContent: "ciphertext-ref",
    sourceRef: "raw-source-ref", sensitivityClass: "INTERNAL",
    retentionClass: "raw-retention", aclPolicyRef: "raw-policy",
    status: "ERASED", createdAt: "2026-10-08T10:00:00.000Z",
    expiresAt: "2026-10-09T10:00:00.000Z", supersedesId: ids.parent,
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const memory = Object.hasOwn(overrides, "memory") ? overrides.memory : record();
  const parent = Object.hasOwn(overrides, "parent") ? overrides.parent
    : record({id: ids.parent, supersedesId: undefined, status: "ACTIVE"});
  const calls = [];
  const reader = {
    async loadForContext(input) {
      calls.push(input);
      if (calls.length === 1 && overrides.childError) throw overrides.childError;
      if (calls.length === 2 && overrides.parentError) throw overrides.parentError;
      return calls.length === 1 ? memory : parent;
    },
  };
  return {reader, calls, memory, parent};
}

async function load(f, overrides = {}) {
  return loadAIMemoryDirectSupersessionCurrentEvidence(
    {requestContext: context(), memoryRecordId: ids.child, ...overrides},
    f.reader,
  );
}

test("AIMEM-SUPREAD-BASE-001 child is read exactly first with identical caller input", async () => {
  const f = fixture(); const ctx = context();
  const evidence = await load(f, {requestContext: ctx});
  assert.ok(evidence);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0].requestContext, ctx);
  assert.equal(f.calls[0].memoryRecordId, ids.child);
});

test("AIMEM-SUPREAD-BASE-002 child null short-circuits and child errors propagate untouched", async () => {
  const absent = fixture({memory: null});
  assert.equal(await load(absent), null);
  assert.equal(absent.calls.length, 1);
  const error = new Error("child-read-failed");
  const broken = fixture({childError: error});
  await assert.rejects(load(broken), e => e === error);
  assert.equal(broken.calls.length, 1);
});

test("AIMEM-SUPREAD-UNBOUND-001 no supersession returns frozen exact child-only evidence with one read", async () => {
  const child = record({supersedesId: undefined, status: "EXPIRED"});
  const f = fixture({memory: child});
  const evidence = await load(f);
  assert.ok(evidence);
  assert.equal(f.calls.length, 1);
  assert.equal(evidence.memory, child);
  assert.deepEqual(Object.keys(evidence), ["memory"]);
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal("current" in evidence, false);
});

test("AIMEM-SUPREAD-UNBOUND-002 malformed unbound child fails closed before parent read", async () => {
  const broken = [
    record({id: "not-a-uuid", supersedesId: undefined}),
    record({tenantId: "not-a-uuid", supersedesId: undefined}),
    record({memoryClass: "INVALID", supersedesId: undefined}),
    record({industryContextId: "invalid", supersedesId: undefined}),
  ];
  for (const child of broken) {
    const f = fixture({memory: child});
    assert.equal(await load(f), null);
    assert.equal(f.calls.length, 1);
  }
});

test("AIMEM-SUPREAD-BOUND-001 bound branch reads persisted id exactly under same RequestContext", async () => {
  const f = fixture();
  const ctx = context();
  const evidence = await load(f, {requestContext: ctx});
  assert.ok(evidence);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].memoryRecordId, ids.parent);
  assert.equal(f.calls[0].requestContext, ctx);
  assert.equal(f.calls[1].requestContext, ctx);
  assert.equal(evidence.supersededMemory, f.parent);
});

test("AIMEM-SUPREAD-BOUND-002 parent invisible/null and dependency errors fail closed without fallback", async () => {
  const missing = fixture({parent: null});
  assert.equal(await load(missing), null);
  assert.equal(missing.calls.length, 2);
  const error = new Error("parent-inaccessible");
  const broken = fixture({parentError: error});
  await assert.rejects(load(broken), e => e === error);
  assert.equal(broken.calls.length, 2);
});

test("AIMEM-SUPREAD-FLOOR-001 exact DD-187 continuity passes and mismatches fail closed", async () => {
  const success = fixture();
  assert.ok(await load(success));
  const cases = [
    {parent: record({id: ids.otherParent, supersedesId: undefined})},
    {parent: record({id: ids.parent, tenantId: ids.foreignTenant, supersedesId: undefined})},
    {parent: record({id: ids.parent, industryContextId: ids.otherIndustry, supersedesId: undefined})},
    {parent: record({id: ids.parent, principalId: ids.otherPrincipal, supersedesId: undefined})},
    {parent: record({id: ids.parent, memoryClass: "SESSION", supersedesId: undefined})},
    {parent: record({id: "invalid", supersedesId: undefined})},
    {memory: record({supersedesId: ids.child})},
    {memory: record({supersedesId: "invalid"})},
  ];
  for (const changes of cases) {
    const f = fixture(changes);
    assert.equal(await load(f), null);
    assert.equal(f.calls.length, 2);
  }
});

test("AIMEM-SUPREAD-EVID-001 immutable envelope preserves exact raw refs and never mutates records", async () => {
  const f = fixture();
  const before = JSON.stringify([f.memory, f.parent]);
  const evidence = await load(f);
  assert.ok(evidence);
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal(evidence.memory, f.memory);
  assert.equal(evidence.supersededMemory, f.parent);
  assert.equal(f.memory.status, "ERASED");
  assert.equal(f.parent.status, "ACTIVE");
  assert.equal(JSON.stringify([f.memory, f.parent]), before);
});

test("AIMEM-SUPREAD-BOUNDARY-001 no current memory, ACL, retention, history or execution authority", async () => {
  const evidence = await load(fixture());
  assert.ok(evidence);
  for (const forbidden of [
    "currentMemory", "effectiveMemory", "selectedMemory", "supersessionChain",
    "aclAuthorized", "principalAuthorized", "retentionAllowed", "expiryValid",
    "erasureAllowed", "contentDecrypted", "sourceResolved", "crossContextAllowed",
    "clientMemory", "promptIncluded", "retrievalAllowed", "ragAuthorized",
    "providerAuthorized", "inferenceAuthorized", "executionAuthorized",
  ]) assert.equal(forbidden in evidence, false);
});
