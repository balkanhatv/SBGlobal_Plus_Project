import test from "node:test";
import assert from "node:assert/strict";

import {
  loadDocumentDerivativeParentRawAclEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  derivative: "33333333-3333-4333-8333-333333333333",
  parent: "44444444-4444-4444-8444-444444444444",
  other: "55555555-5555-4555-8555-555555555555",
  principal: "66666666-6666-4666-8666-666666666666",
  aclDerivative: "77777777-7777-4777-8777-777777777777",
  aclParent: "88888888-8888-4888-8888-888888888888",
  subject: "99999999-9999-4999-8999-999999999999",
  correlation: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

function requestContext(overrides = {}) {
  return Object.freeze({
    requestId: "request-1",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-in",
    regionCode: "IN-CENTRAL",
    principalId: ids.principal,
    principalType: "HUMAN",
    membershipId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    permissionVersion: 7,
    entitlementSnapshotVersion: 11,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function relationship(overrides = {}) {
  const derivativeOverrides = overrides.derivative ?? {};
  const parentOverrides = overrides.parent ?? {};
  return Object.freeze({
    derivative: Object.freeze({
      id: ids.derivative,
      tenantId: ids.tenant,
      industryContextId: ids.industry,
      scopeClass: "TENANT_INDUSTRY",
      parentDocumentId: ids.parent,
      derivativeType: "OCR_EXTRACT",
      sensitivityClass: "CONFIDENTIAL",
      residencyRegion: "IN-CENTRAL",
      status: "ACTIVE",
      virusScanStatus: "CLEAN",
      ...derivativeOverrides,
    }),
    parent: Object.freeze({
      id: ids.parent,
      tenantId: ids.tenant,
      industryContextId: ids.industry,
      scopeClass: "TENANT_INDUSTRY",
      sensitivityClass: "CONFIDENTIAL",
      residencyRegion: "IN-CENTRAL",
      status: "ACTIVE",
      virusScanStatus: "CLEAN",
      ...parentOverrides,
    }),
  });
}

function aclEntry(id, documentId, overrides = {}) {
  return Object.freeze({
    id,
    documentId,
    subjectType: "PRINCIPAL",
    subjectId: ids.subject,
    permission: "VIEW",
    effect: "ALLOW",
    createdAt: "2026-10-06T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const relationshipCalls = [];
  const aclCalls = [];
  const relation = Object.hasOwn(overrides, "relationship")
    ? overrides.relationship
    : relationship();
  const derivativeAclEntries = Object.hasOwn(overrides, "derivativeAclEntries")
    ? overrides.derivativeAclEntries
    : Object.freeze([aclEntry(ids.aclDerivative, ids.derivative)]);
  const parentAclEntries = Object.hasOwn(overrides, "parentAclEntries")
    ? overrides.parentAclEntries
    : Object.freeze([aclEntry(ids.aclParent, ids.parent)]);

  return {
    order,
    relationshipCalls,
    aclCalls,
    relation,
    derivativeAclEntries,
    parentAclEntries,
    relationshipReader: {
      async load(input) {
        order.push("relationship");
        relationshipCalls.push(input);
        if (overrides.relationshipError) throw overrides.relationshipError;
        return relation;
      },
    },
    aclReader: {
      async loadForDocument(input) {
        order.push(`acl:${input.documentId}`);
        aclCalls.push(input);
        if (
          overrides.derivativeAclError
          && input.documentId === ids.derivative
        ) {
          throw overrides.derivativeAclError;
        }
        if (overrides.parentAclError && input.documentId === ids.parent) {
          throw overrides.parentAclError;
        }
        if (input.documentId === ids.derivative) return derivativeAclEntries;
        if (input.documentId === ids.parent) return parentAclEntries;
        throw new Error("unexpected-document-id");
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadDocumentDerivativeParentRawAclEvidence(
    {
      requestContext: requestContext(),
      derivativeDocumentId: ids.derivative,
      parentDocumentId: ids.parent,
      ...inputOverrides,
    },
    f.relationshipReader,
    f.aclReader,
  );
}

test("DOC-DERIVACL-BASE-001 exact DD-582 parent is established before ACL reads", async () => {
  const f = fixture();
  const ctx = requestContext();
  const result = await load(f, {requestContext: ctx});

  assert.ok(result);
  assert.deepEqual(f.order, [
    "relationship",
    `acl:${ids.derivative}`,
    `acl:${ids.parent}`,
  ]);
  assert.equal(f.relationshipCalls.length, 1);
  assert.equal(f.relationshipCalls[0].requestContext, ctx);
  assert.equal(f.relationshipCalls[0].derivativeDocumentId, ids.derivative);
  assert.equal(f.relationshipCalls[0].parentDocumentId, ids.parent);
});

test("DOC-DERIVACL-BASE-002 DD-582 null/error precedes all ACL access", async () => {
  const hidden = fixture({relationship: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["relationship"]);
  assert.equal(hidden.aclCalls.length, 0);

  const expected = new Error("relationship-unavailable");
  const broken = fixture({relationshipError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["relationship"]);
  assert.equal(broken.aclCalls.length, 0);
});

test("DOC-DERIVACL-READ-001 exact derivative then parent ACL reads use same context and persisted ids once", async () => {
  const f = fixture();
  const ctx = requestContext();
  const result = await load(f, {requestContext: ctx});

  assert.ok(result);
  assert.equal(f.aclCalls.length, 2);
  assert.equal(f.aclCalls[0].requestContext, ctx);
  assert.equal(f.aclCalls[0].documentId, ids.derivative);
  assert.equal(f.aclCalls[1].requestContext, ctx);
  assert.equal(f.aclCalls[1].documentId, ids.parent);
});

test("DOC-DERIVACL-READ-002 ACL dependency errors propagate unchanged with no retry or fallback", async () => {
  const derivativeError = new Error("derivative-acl-unavailable");
  const derivativeBroken = fixture({derivativeAclError: derivativeError});
  await assert.rejects(
    load(derivativeBroken),
    error => error === derivativeError,
  );
  assert.deepEqual(derivativeBroken.order, [
    "relationship",
    `acl:${ids.derivative}`,
  ]);
  assert.equal(derivativeBroken.aclCalls.length, 1);

  const parentError = new Error("parent-acl-unavailable");
  const parentBroken = fixture({parentAclError: parentError});
  await assert.rejects(load(parentBroken), error => error === parentError);
  assert.deepEqual(parentBroken.order, [
    "relationship",
    `acl:${ids.derivative}`,
    `acl:${ids.parent}`,
  ]);
  assert.equal(parentBroken.aclCalls.length, 2);
});

test("DOC-DERIVACL-BIND-001 empty or exact document-bound ACL arrays pass unchanged", async () => {
  const emptyDerivative = Object.freeze([]);
  const emptyParent = Object.freeze([]);
  const empty = fixture({
    derivativeAclEntries: emptyDerivative,
    parentAclEntries: emptyParent,
  });
  const emptyResult = await load(empty);
  assert.ok(emptyResult);
  assert.equal(emptyResult.derivativeAclEntries, emptyDerivative);
  assert.equal(emptyResult.parentAclEntries, emptyParent);

  const exact = fixture();
  const exactResult = await load(exact);
  assert.ok(exactResult);
  assert.equal(
    exactResult.derivativeAclEntries[0].documentId,
    ids.derivative,
  );
  assert.equal(exactResult.parentAclEntries[0].documentId, ids.parent);
});

test("DOC-DERIVACL-BIND-002 any ACL row bound to another document fails closed", async () => {
  const badDerivative = fixture({
    derivativeAclEntries: Object.freeze([
      aclEntry(ids.aclDerivative, ids.other),
    ]),
  });
  assert.equal(await load(badDerivative), null);
  assert.deepEqual(badDerivative.order, [
    "relationship",
    `acl:${ids.derivative}`,
  ]);

  const badParent = fixture({
    parentAclEntries: Object.freeze([
      aclEntry(ids.aclParent, ids.other),
    ]),
  });
  assert.equal(await load(badParent), null);
  assert.deepEqual(badParent.order, [
    "relationship",
    `acl:${ids.derivative}`,
    `acl:${ids.parent}`,
  ]);
});

test("DOC-DERIVACL-EVID-001 success preserves exact parent and ACL array/entry references unchanged", async () => {
  const f = fixture();
  const before = JSON.stringify([
    f.relation,
    f.derivativeAclEntries,
    f.parentAclEntries,
  ]);
  const result = await load(f);

  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.relationship, f.relation);
  assert.equal(result.derivativeAclEntries, f.derivativeAclEntries);
  assert.equal(result.parentAclEntries, f.parentAclEntries);
  assert.equal(
    result.derivativeAclEntries[0],
    f.derivativeAclEntries[0],
  );
  assert.equal(result.parentAclEntries[0], f.parentAclEntries[0]);
  assert.equal(
    JSON.stringify([
      f.relation,
      f.derivativeAclEntries,
      f.parentAclEntries,
    ]),
    before,
  );
});

test("DOC-DERIVACL-BOUND-001 result exposes no ACL comparison/non-widening/final access or mutation authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "aclNonWidening",
    "aclComparison",
    "aclRelation",
    "effectiveAcl",
    "inheritedAcl",
    "reducedAcl",
    "currentEntries",
    "expiredEntries",
    "effectEvidence",
    "subjectMatches",
    "authorizationDecision",
    "accessDecision",
    "sourceResourceAuthorized",
    "signedGrant",
    "downloadAuthorized",
    "shareAuthorized",
    "deleteAuthorized",
    "storageDispatch",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
