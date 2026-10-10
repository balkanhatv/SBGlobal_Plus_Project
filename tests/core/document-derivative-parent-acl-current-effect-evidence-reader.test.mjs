import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAccessAclCurrentEffectEvidenceError,
  DocumentAclSubjectMatchError,
  DocumentAclSubjectMatcher,
  loadDocumentDerivativeParentAclCurrentEffectEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  derivative: "33333333-3333-4333-8333-333333333333",
  parent: "44444444-4444-4444-8444-444444444444",
  other: "55555555-5555-4555-8555-555555555555",
  principal: "66666666-6666-4666-8666-666666666666",
  role: "77777777-7777-4777-8777-777777777777",
  orgRoot: "88888888-8888-4888-8888-888888888888",
  orgLeaf: "99999999-9999-4999-8999-999999999999",
  aclD1: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  aclD2: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  aclD3: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  aclP1: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  aclP2: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  aclP3: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  correlation: "12121212-1212-4212-8212-121212121212",
});

const NOW = "2026-10-06T12:00:00.000Z";

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
    membershipId: "13131313-1313-4313-8313-131313131313",
    orgUnitId: ids.orgLeaf,
    orgUnitPath: Object.freeze([ids.orgRoot, ids.orgLeaf]),
    roleIds: Object.freeze([ids.role]),
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
    subjectId: ids.principal,
    permission: "DOWNLOAD",
    effect: "ALLOW",
    createdAt: "2026-10-06T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const relationshipCalls = [];
  const aclCalls = [];
  const matchCalls = [];
  const matchResults = [];

  const relation = Object.hasOwn(overrides, "relationship")
    ? overrides.relationship
    : relationship();
  const derivativeAclEntries = Object.hasOwn(overrides, "derivativeAclEntries")
    ? overrides.derivativeAclEntries
    : Object.freeze([aclEntry(ids.aclD1, ids.derivative)]);
  const parentAclEntries = Object.hasOwn(overrides, "parentAclEntries")
    ? overrides.parentAclEntries
    : Object.freeze([aclEntry(ids.aclP1, ids.parent)]);

  const delegate = new DocumentAclSubjectMatcher();
  const matcher = {
    match(input) {
      order.push(`match:${input.documentId}`);
      matchCalls.push(input);
      const result = delegate.match(input);
      matchResults.push(result);
      return result;
    },
  };

  return {
    order,
    relationshipCalls,
    aclCalls,
    matchCalls,
    matchResults,
    relation,
    derivativeAclEntries,
    parentAclEntries,
    matcher,
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
        if (overrides.derivativeAclError && input.documentId === ids.derivative) {
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
  return loadDocumentDerivativeParentAclCurrentEffectEvidence(
    {
      requestContext: requestContext(),
      derivativeDocumentId: ids.derivative,
      parentDocumentId: ids.parent,
      permission: "DOWNLOAD",
      currentTimeIso: NOW,
      ...inputOverrides,
    },
    f.relationshipReader,
    f.aclReader,
    f.matcher,
  );
}

test("DOC-DERIVEFFECT-BASE-001 exact DD-587 parent evidence executes before subject/current-effect interpretation", async () => {
  const f = fixture();
  const ctx = requestContext();
  const result = await load(f, {requestContext: ctx});

  assert.ok(result);
  assert.deepEqual(f.order, [
    "relationship",
    `acl:${ids.derivative}`,
    `acl:${ids.parent}`,
    `match:${ids.derivative}`,
    `match:${ids.parent}`,
  ]);
  assert.equal(f.relationshipCalls[0].requestContext, ctx);
  assert.equal(f.relationshipCalls[0].derivativeDocumentId, ids.derivative);
  assert.equal(f.relationshipCalls[0].parentDocumentId, ids.parent);
});

test("DOC-DERIVEFFECT-BASE-002 DD-587 null/error precedes matcher and effect interpretation", async () => {
  const hidden = fixture({relationship: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["relationship"]);
  assert.equal(hidden.matchCalls.length, 0);

  const expected = new Error("relationship-unavailable");
  const broken = fixture({relationshipError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["relationship"]);
  assert.equal(broken.matchCalls.length, 0);
});

test("DOC-DERIVEFFECT-MATCH-001 derivative then parent matching use identical context/permission and persisted side ids", async () => {
  const f = fixture();
  const ctx = requestContext();
  const result = await load(f, {requestContext: ctx});

  assert.ok(result);
  assert.equal(f.matchCalls.length, 2);
  assert.equal(f.matchCalls[0].requestContext, ctx);
  assert.equal(f.matchCalls[0].documentId, ids.derivative);
  assert.equal(f.matchCalls[0].permission, "DOWNLOAD");
  assert.equal(f.matchCalls[0].entries, f.derivativeAclEntries);
  assert.equal(f.matchCalls[1].requestContext, ctx);
  assert.equal(f.matchCalls[1].documentId, ids.parent);
  assert.equal(f.matchCalls[1].permission, "DOWNLOAD");
  assert.equal(f.matchCalls[1].entries, f.parentAclEntries);
});

test("DOC-DERIVEFFECT-MATCH-002 matcher validation and DD-587 cross-binding failures fail closed without alternate permission or fallback", async () => {
  const malformed = fixture({
    derivativeAclEntries: Object.freeze([
      aclEntry(ids.aclD1, ids.derivative, {subjectId: "not-a-uuid"}),
    ]),
  });
  await assert.rejects(
    load(malformed),
    error => error instanceof DocumentAclSubjectMatchError
      && error.code === "ACL_MATCH_INPUT_INVALID",
  );
  assert.equal(malformed.matchCalls.length, 1);

  const invalidPermission = fixture();
  await assert.rejects(
    load(invalidPermission, {permission: "NOT_A_PERMISSION"}),
    error => error instanceof DocumentAclSubjectMatchError
      && error.code === "ACL_MATCH_INPUT_INVALID",
  );
  assert.equal(invalidPermission.matchCalls.length, 1);

  const crossBound = fixture({
    parentAclEntries: Object.freeze([
      aclEntry(ids.aclP1, ids.other),
    ]),
  });
  assert.equal(await load(crossBound), null);
  assert.equal(crossBound.matchCalls.length, 0);
});

test("DOC-DERIVEFFECT-TIME-001 derivative and parent use one exact trusted instant with DD-558…DD-561 current/expired boundaries", async () => {
  const f = fixture({
    derivativeAclEntries: Object.freeze([
      aclEntry(ids.aclD1, ids.derivative),
      aclEntry(ids.aclD2, ids.derivative, {
        subjectType: "ROLE",
        subjectId: ids.role,
        validUntil: "2026-10-06T12:00:00.001Z",
      }),
      aclEntry(ids.aclD3, ids.derivative, {
        subjectType: "ORG_UNIT",
        subjectId: ids.orgLeaf,
        validUntil: NOW,
      }),
    ]),
    parentAclEntries: Object.freeze([
      aclEntry(ids.aclP1, ids.parent, {
        validUntil: "2026-10-06T11:59:59.999Z",
      }),
      aclEntry(ids.aclP2, ids.parent, {
        subjectType: "ROLE",
        subjectId: ids.role,
        validUntil: "2026-10-06T12:00:00.001Z",
      }),
    ]),
  });
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.currentTimeIso, NOW);
  assert.deepEqual(
    result.derivativeEvidence.currentEntries.map(x => x.id),
    [ids.aclD1, ids.aclD2],
  );
  assert.deepEqual(
    result.derivativeEvidence.expiredEntries.map(x => x.id),
    [ids.aclD3],
  );
  assert.deepEqual(
    result.parentEvidence.currentEntries.map(x => x.id),
    [ids.aclP2],
  );
  assert.deepEqual(
    result.parentEvidence.expiredEntries.map(x => x.id),
    [ids.aclP1],
  );
});

test("DOC-DERIVEFFECT-EFFECT-001 each side independently applies current DENY then ALLOW else NONE", async () => {
  const mixed = fixture({
    derivativeAclEntries: Object.freeze([
      aclEntry(ids.aclD1, ids.derivative, {effect: "ALLOW"}),
      aclEntry(ids.aclD2, ids.derivative, {
        subjectType: "ROLE",
        subjectId: ids.role,
        effect: "DENY",
      }),
    ]),
    parentAclEntries: Object.freeze([
      aclEntry(ids.aclP1, ids.parent, {effect: "ALLOW"}),
    ]),
  });
  const mixedResult = await load(mixed);
  assert.ok(mixedResult);
  assert.equal(mixedResult.derivativeEvidence.effectEvidence, "DENY");
  assert.equal(mixedResult.parentEvidence.effectEvidence, "ALLOW");

  const none = fixture({
    derivativeAclEntries: Object.freeze([
      aclEntry(ids.aclD1, ids.derivative, {validUntil: "2026-10-05T00:00:00.000Z"}),
    ]),
    parentAclEntries: Object.freeze([
      aclEntry(ids.aclP1, ids.parent, {validUntil: "2026-10-05T00:00:00.000Z"}),
    ]),
  });
  const noneResult = await load(none);
  assert.ok(noneResult);
  assert.equal(noneResult.derivativeEvidence.effectEvidence, "NONE");
  assert.equal(noneResult.parentEvidence.effectEvidence, "NONE");
});

test("DOC-DERIVEFFECT-EFFECT-002 malformed trusted time or matched validUntil fails closed with shared DD-558…DD-561 errors", async () => {
  const invalidNow = fixture();
  await assert.rejects(
    load(invalidNow, {currentTimeIso: "not-a-time"}),
    error => error instanceof DocumentAccessAclCurrentEffectEvidenceError
      && error.code === "ACL_EFFECT_TIME_INVALID",
  );
  assert.equal(invalidNow.matchCalls.length, 2);

  const invalidDerivative = fixture({
    derivativeAclEntries: Object.freeze([
      aclEntry(ids.aclD1, ids.derivative, {validUntil: "not-a-time"}),
    ]),
  });
  await assert.rejects(
    load(invalidDerivative),
    error => error instanceof DocumentAccessAclCurrentEffectEvidenceError
      && error.code === "ACL_EFFECT_EVIDENCE_INVALID",
  );

  const invalidParent = fixture({
    parentAclEntries: Object.freeze([
      aclEntry(ids.aclP1, ids.parent, {validUntil: "not-a-time"}),
    ]),
  });
  await assert.rejects(
    load(invalidParent),
    error => error instanceof DocumentAccessAclCurrentEffectEvidenceError
      && error.code === "ACL_EFFECT_EVIDENCE_INVALID",
  );
});

test("DOC-DERIVEFFECT-EVID-001 success preserves exact DD-587/raw/matcher references and immutable branch evidence", async () => {
  const f = fixture({
    derivativeAclEntries: Object.freeze([
      aclEntry(ids.aclD1, ids.derivative, {effect: "ALLOW"}),
    ]),
    parentAclEntries: Object.freeze([
      aclEntry(ids.aclP1, ids.parent, {effect: "DENY"}),
    ]),
  });
  const before = JSON.stringify([
    f.relation,
    f.derivativeAclEntries,
    f.parentAclEntries,
  ]);
  const result = await load(f);

  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.derivativeEvidence), true);
  assert.equal(Object.isFrozen(result.parentEvidence), true);
  assert.equal(result.parent.parent.relationship, f.relation);
  assert.equal(result.parent.derivativeAclEntries, f.derivativeAclEntries);
  assert.equal(result.parent.parentAclEntries, f.parentAclEntries);
  assert.equal(result.derivativeEvidence.matchedEntries, f.matchResults[0]);
  assert.equal(result.parentEvidence.matchedEntries, f.matchResults[1]);
  assert.equal(
    result.derivativeEvidence.currentEntries[0],
    result.derivativeEvidence.matchedEntries[0],
  );
  assert.equal(
    result.parentEvidence.currentEntries[0],
    result.parentEvidence.matchedEntries[0],
  );
  assert.equal(
    JSON.stringify([f.relation, f.derivativeAclEntries, f.parentAclEntries]),
    before,
  );
});

test("DOC-DERIVEFFECT-BOUND-001 result exposes no ACL comparison/non-widening/final authorization/signing/storage or mutation authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "aclNonWidening",
    "aclComparison",
    "aclRelation",
    "broader",
    "equal",
    "narrower",
    "compliant",
    "effectiveAcl",
    "inheritedAcl",
    "sourceResourceFallback",
    "authorizationDecision",
    "accessDecision",
    "authorized",
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
