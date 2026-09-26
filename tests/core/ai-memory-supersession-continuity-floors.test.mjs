import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIMemorySupersessionContinuityFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  child: "11111111-1111-4111-8111-111111111111",
  parent: "22222222-2222-4222-8222-222222222222",
  otherParent: "33333333-3333-4333-8333-333333333333",
  tenantA: "44444444-4444-4444-8444-444444444444",
  tenantB: "55555555-5555-4555-8555-555555555555",
  industryA: "66666666-6666-4666-8666-666666666666",
  industryB: "77777777-7777-4777-8777-777777777777",
  principalA: "88888888-8888-4888-8888-888888888888",
  principalB: "99999999-9999-4999-8999-999999999999",
  assistant: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

const baseChild = Object.freeze({
  id: ids.child,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  principalId: ids.principalA,
  assistantDefinitionId: ids.assistant,
  memoryClass: "WORKING_CONTEXT",
  contentRefOrEncryptedContent: "opaque-child",
  sourceRef: "opaque-source-child",
  sensitivityClass: "CONFIDENTIAL",
  retentionClass: "opaque-retention",
  aclPolicyRef: "opaque-acl",
  status: "ACTIVE",
  createdAt: "2026-09-24T12:00:00.000Z",
  expiresAt: "2026-10-24T12:00:00.000Z",
  supersedesId: ids.parent,
});

const baseParent = Object.freeze({
  id: ids.parent,
  tenantId: ids.tenantA,
  industryContextId: ids.industryA,
  principalId: ids.principalA,
  assistantDefinitionId: ids.assistant,
  memoryClass: "WORKING_CONTEXT",
  contentRefOrEncryptedContent: "opaque-parent",
  sourceRef: "opaque-source-parent",
  sensitivityClass: "CONFIDENTIAL",
  retentionClass: "opaque-retention",
  aclPolicyRef: "opaque-acl",
  status: "SUPERSEDED",
  createdAt: "2026-09-23T12:00:00.000Z",
  expiresAt: "2026-10-23T12:00:00.000Z",
});

function child(overrides = {}) {
  return Object.freeze({...baseChild, ...overrides});
}

function parent(overrides = {}) {
  return Object.freeze({...baseParent, ...overrides});
}

test("AIMEM-SUP-CUR-001 unbound memory requires no superseded-parent evidence", () => {
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child({supersedesId: undefined}),
      undefined,
    ),
    true,
  );
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child({supersedesId: undefined}),
      parent(),
    ),
    false,
  );
});

test("AIMEM-SUP-CUR-002 exact direct parent preserves Tenant/Industry/principal/class continuity", () => {
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(child(), parent()),
    true,
  );

  const tenantCoreChild = child({industryContextId: undefined});
  const tenantCoreParent = parent({industryContextId: undefined});
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      tenantCoreChild,
      tenantCoreParent,
    ),
    true,
  );
});

test("AIMEM-SUP-CUR-003 self-reference, missing parent or wrong parent id fails closed", () => {
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child({supersedesId: ids.child}),
      parent({id: ids.child}),
    ),
    false,
  );
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(child(), undefined),
    false,
  );
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child(),
      parent({id: ids.otherParent}),
    ),
    false,
  );
});

test("AIMEM-SUP-CUR-004 Tenant or null-safe Industry mismatch fails closed", () => {
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child(),
      parent({tenantId: ids.tenantB}),
    ),
    false,
  );
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child(),
      parent({industryContextId: ids.industryB}),
    ),
    false,
  );
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child({industryContextId: undefined}),
      parent(),
    ),
    false,
  );
});

test("AIMEM-SUP-CUR-005 principal mismatch uses null-safe exact continuity", () => {
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child(),
      parent({principalId: ids.principalB}),
    ),
    false,
  );
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child({principalId: undefined}),
      parent(),
    ),
    false,
  );
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child({principalId: undefined}),
      parent({principalId: undefined}),
    ),
    true,
  );
});

test("AIMEM-SUP-CUR-006 class mismatch or malformed relevant continuity evidence fails closed", () => {
  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      child(),
      parent({memoryClass: "SESSION"}),
    ),
    false,
  );

  for (const candidate of [
    child({id: "not-a-uuid"}),
    child({tenantId: "not-a-uuid"}),
    child({industryContextId: "not-a-uuid"}),
    child({principalId: "not-a-uuid"}),
    child({supersedesId: "not-a-uuid"}),
    child({memoryClass: "NOT_A_MEMORY_CLASS"}),
  ]) {
    assert.equal(
      matchesAIMemorySupersessionContinuityFloors(candidate, parent()),
      false,
    );
  }

  for (const candidateParent of [
    parent({id: "not-a-uuid"}),
    parent({tenantId: "not-a-uuid"}),
    parent({industryContextId: "not-a-uuid"}),
    parent({principalId: "not-a-uuid"}),
    parent({memoryClass: "NOT_A_MEMORY_CLASS"}),
  ]) {
    assert.equal(
      matchesAIMemorySupersessionContinuityFloors(child(), candidateParent),
      false,
    );
  }
});

test("AIMEM-SUP-CUR-007 lifecycle/policy/deeper-chain semantics remain uninterpreted without mutation", () => {
  const candidateChild = child({
    assistantDefinitionId: "not-interpreted",
    contentRefOrEncryptedContent: "",
    sourceRef: "",
    sensitivityClass: "REGULATED",
    retentionClass: "",
    aclPolicyRef: "",
    status: "ERASED",
    createdAt: "not-interpreted",
    expiresAt: "also-not-interpreted",
  });
  const candidateParent = parent({
    assistantDefinitionId: "also-not-interpreted",
    contentRefOrEncryptedContent: "",
    sourceRef: "",
    sensitivityClass: "PUBLIC",
    retentionClass: "different-and-uninterpreted",
    aclPolicyRef: "",
    status: "ACTIVE",
    createdAt: "later-than-child-but-uninterpreted",
    expiresAt: "not-interpreted",
    supersedesId: "deeper-chain-not-interpreted",
  });

  const beforeChild = JSON.stringify(candidateChild);
  const beforeParent = JSON.stringify(candidateParent);

  assert.equal(
    matchesAIMemorySupersessionContinuityFloors(
      candidateChild,
      candidateParent,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateChild), beforeChild);
  assert.equal(JSON.stringify(candidateParent), beforeParent);
});
