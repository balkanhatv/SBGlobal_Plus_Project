import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAccessAclCurrentEffectEvidenceError,
  DocumentAccessCandidateError,
  loadDocumentAccessAclCurrentEffectEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  document: "33333333-3333-4333-8333-333333333333",
  storage: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
  role: "66666666-6666-4666-8666-666666666666",
  orgRoot: "77777777-7777-4777-8777-777777777777",
  orgLeaf: "88888888-8888-4888-8888-888888888888",
  correlation: "99999999-9999-4999-8999-999999999999",
  acl1: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  acl2: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  acl3: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-1",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "data-home-1",
    regionCode: "IN-CENTRAL",
    principalId: ids.principal,
    principalType: "HUMAN",
    membershipId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    orgUnitId: ids.orgLeaf,
    orgUnitPath: Object.freeze([ids.orgRoot, ids.orgLeaf]),
    roleIds: Object.freeze([ids.role]),
    permissionVersion: 1,
    entitlementSnapshotVersion: 1,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function metadata(overrides = {}) {
  return Object.freeze({
    id: ids.document,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    sourceModule: "RawModule",
    sourceResourceType: "RawResource",
    sourceResourceId: "raw-resource-id",
    filenameDisplay: "evidence.pdf",
    mediaType: "application/pdf",
    storageObjectId: ids.storage,
    ownerPrincipalId: ids.principal,
    sensitivityClass: "CONFIDENTIAL",
    residencyRegion: "IN-CENTRAL",
    status: "ACTIVE",
    virusScanStatus: "CLEAN",
    versionNo: 1,
    ...overrides,
  });
}

function acl(overrides = {}) {
  return Object.freeze({
    id: ids.acl1,
    documentId: ids.document,
    subjectType: "PRINCIPAL",
    subjectId: ids.principal,
    permission: "DOWNLOAD",
    effect: "ALLOW",
    createdAt: "2026-10-05T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {metadata: [], acl: []};
  const metadataValue = Object.hasOwn(overrides, "metadata") ? overrides.metadata : metadata();
  const aclEntries = Object.hasOwn(overrides, "aclEntries")
    ? overrides.aclEntries
    : Object.freeze([acl()]);

  return {
    order,
    calls,
    metadataValue,
    aclEntries,
    metadataReader: {
      async loadForContext(input) {
        order.push("metadata");
        calls.metadata.push(input);
        if (overrides.metadataError) throw overrides.metadataError;
        return metadataValue;
      },
    },
    aclReader: {
      async loadForDocument(input) {
        order.push("acl");
        calls.acl.push(input);
        if (overrides.aclError) throw overrides.aclError;
        return aclEntries;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadDocumentAccessAclCurrentEffectEvidence(
    {
      requestContext: context(),
      documentId: ids.document,
      permission: "DOWNLOAD",
      currentTimeIso: "2026-10-05T12:00:00.000Z",
      ...inputOverrides,
    },
    f.metadataReader,
    f.aclReader,
  );
}

test("DOC-ACLEFFECT-BASE-001 exact DD-542 parent executes first with exact inputs/dependencies", async () => {
  const f = fixture();
  const ctx = context();
  const result = await load(f, {requestContext: ctx});

  assert.deepEqual(f.order, ["metadata", "acl"]);
  assert.equal(f.calls.metadata.length, 1);
  assert.equal(f.calls.metadata[0].requestContext, ctx);
  assert.equal(f.calls.metadata[0].documentId, ids.document);
  assert.equal(f.calls.acl.length, 1);
  assert.equal(f.calls.acl[0].requestContext, ctx);
  assert.equal(result.parent.candidate.documentId, ids.document);
  assert.equal(result.parent.permission, "DOWNLOAD");
});

test("DOC-ACLEFFECT-BASE-002 DD-542 governed/dependency errors propagate before time/effect interpretation", async () => {
  const invalidState = fixture({metadata: metadata({status: "QUARANTINED"})});
  await assert.rejects(
    load(invalidState, {currentTimeIso: "not-a-time"}),
    error => error instanceof DocumentAccessCandidateError
      && error.code === "RESOURCE_STATE_INVALID",
  );
  assert.deepEqual(invalidState.order, ["metadata"]);

  const expected = new Error("acl-unavailable");
  const dependency = fixture({aclError: expected});
  await assert.rejects(
    load(dependency, {currentTimeIso: "not-a-time"}),
    error => error === expected,
  );
  assert.deepEqual(dependency.order, ["metadata", "acl"]);
});

test("DOC-ACLEFFECT-TIME-001 no-expiry/future rows are current while equal/past rows are expired", async () => {
  const entries = Object.freeze([
    acl({id: ids.acl1, validUntil: undefined}),
    acl({
      id: ids.acl2,
      subjectType: "ROLE",
      subjectId: ids.role,
      validUntil: "2026-10-05T12:00:00.001Z",
    }),
    acl({
      id: ids.acl3,
      subjectType: "ORG_UNIT",
      subjectId: ids.orgLeaf,
      validUntil: "2026-10-05T12:00:00.000Z",
    }),
  ]);
  const f = fixture({aclEntries: entries});
  const result = await load(f);

  assert.deepEqual(result.currentEntries.map(x => x.id), [ids.acl1, ids.acl2]);
  assert.deepEqual(result.expiredEntries.map(x => x.id), [ids.acl3]);

  const past = fixture({aclEntries: Object.freeze([
    acl({validUntil: "2026-10-05T11:59:59.999Z"}),
  ])});
  const pastResult = await load(past);
  assert.equal(pastResult.currentEntries.length, 0);
  assert.equal(pastResult.expiredEntries.length, 1);
});

test("DOC-ACLEFFECT-TIME-002 malformed current time or matched validUntil fails closed", async () => {
  await assert.rejects(
    load(fixture(), {currentTimeIso: "not-a-time"}),
    error => error instanceof DocumentAccessAclCurrentEffectEvidenceError
      && error.code === "ACL_EFFECT_TIME_INVALID",
  );

  const badEvidence = fixture({aclEntries: Object.freeze([
    acl({validUntil: "not-a-time"}),
  ])});
  await assert.rejects(
    load(badEvidence),
    error => error instanceof DocumentAccessAclCurrentEffectEvidenceError
      && error.code === "ACL_EFFECT_EVIDENCE_INVALID",
  );
});

test("DOC-ACLEFFECT-PART-001 current/expired partitions preserve exact DD-542 references/order and are frozen", async () => {
  const entries = Object.freeze([
    acl({id: ids.acl1, validUntil: "2026-10-06T00:00:00.000Z"}),
    acl({
      id: ids.acl2,
      subjectType: "ROLE",
      subjectId: ids.role,
      validUntil: "2026-10-04T00:00:00.000Z",
    }),
  ]);
  const f = fixture({aclEntries: entries});
  const result = await load(f);

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.currentEntries), true);
  assert.equal(Object.isFrozen(result.expiredEntries), true);
  assert.equal(result.currentEntries[0], result.parent.matchedEntries[0]);
  assert.equal(result.expiredEntries[0], result.parent.matchedEntries[1]);
});

test("DOC-ACLEFFECT-DENY-001 any current DENY wins inside ACL-layer effect evidence", async () => {
  const f = fixture({aclEntries: Object.freeze([
    acl({id: ids.acl1, effect: "ALLOW"}),
    acl({
      id: ids.acl2,
      subjectType: "ROLE",
      subjectId: ids.role,
      effect: "DENY",
      validUntil: "2026-10-06T00:00:00.000Z",
    }),
  ])});
  const result = await load(f);
  assert.equal(result.effectEvidence, "DENY");
});

test("DOC-ACLEFFECT-DENY-002 current ALLOW without current DENY yields ALLOW and no current rows yields NONE", async () => {
  const allow = await load(fixture({aclEntries: Object.freeze([
    acl({effect: "ALLOW"}),
    acl({
      id: ids.acl2,
      subjectType: "ROLE",
      subjectId: ids.role,
      effect: "DENY",
      validUntil: "2026-10-04T00:00:00.000Z",
    }),
  ])}));
  assert.equal(allow.effectEvidence, "ALLOW");

  const none = await load(fixture({aclEntries: Object.freeze([
    acl({validUntil: "2026-10-04T00:00:00.000Z"}),
  ])}));
  assert.equal(none.effectEvidence, "NONE");
});

test("DOC-ACLEFFECT-EVID-001 exact parent/raw ACL/candidate/permission evidence remains unchanged", async () => {
  const entries = Object.freeze([
    acl({id: ids.acl1, effect: "DENY", validUntil: "2026-10-06T00:00:00.000Z"}),
    acl({
      id: ids.acl2,
      subjectType: "ROLE",
      subjectId: ids.role,
      effect: "ALLOW",
      validUntil: "2026-10-04T00:00:00.000Z",
    }),
  ]);
  const f = fixture({aclEntries: entries});
  const before = JSON.stringify([f.metadataValue, entries]);
  const result = await load(f);

  assert.equal(result.parent.rawAclEntries, entries);
  assert.equal(result.parent.candidate.documentId, ids.document);
  assert.equal(result.parent.permission, "DOWNLOAD");
  assert.equal(result.currentTimeIso, "2026-10-05T12:00:00.000Z");
  assert.equal(JSON.stringify([f.metadataValue, entries]), before);
});

test("DOC-ACLEFFECT-BOUND-001 output grants no fallback/final authorization/signing/operation authority", async () => {
  const result = await load(fixture());
  for (const forbidden of [
    "authorized",
    "authorizationDecision",
    "accessDecision",
    "sourceResourceFallback",
    "rbacAllowed",
    "abacSatisfied",
    "entitlementAllowed",
    "sensitivityAllowed",
    "residencyAllowed",
    "stepUpSatisfied",
    "storageBinding",
    "signedUrl",
    "signedToken",
    "grant",
    "downloadAuthorized",
    "shareAuthorized",
    "deleteAuthorized",
    "mutation",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
