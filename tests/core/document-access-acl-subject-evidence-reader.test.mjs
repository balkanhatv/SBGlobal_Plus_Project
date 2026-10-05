import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAccessCandidateError,
  DocumentAclSubjectMatchError,
  DocumentAclSubjectMatcher,
  loadDocumentAccessAclSubjectEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  document: "33333333-3333-4333-8333-333333333333",
  otherDocument: "34343434-3434-4434-8434-343434343434",
  storage: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
  role: "66666666-6666-4666-8666-666666666666",
  orgRoot: "77777777-7777-4777-8777-777777777777",
  orgLeaf: "88888888-8888-4888-8888-888888888888",
  correlation: "99999999-9999-4999-8999-999999999999",
  acl1: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  acl2: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
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
    membershipId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
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
  const calls = {metadata: [], acl: [], match: []};
  const metadataValue = Object.hasOwn(overrides, "metadata")
    ? overrides.metadata
    : metadata();
  const aclEntries = Object.hasOwn(overrides, "aclEntries")
    ? overrides.aclEntries
    : Object.freeze([acl()]);

  const metadataReader = {
    async loadForContext(input) {
      order.push("metadata");
      calls.metadata.push(input);
      if (overrides.metadataError) throw overrides.metadataError;
      return metadataValue;
    },
  };

  const aclReader = {
    async loadForDocument(input) {
      order.push("acl");
      calls.acl.push(input);
      if (overrides.aclError) throw overrides.aclError;
      return aclEntries;
    },
  };

  const delegate = new DocumentAclSubjectMatcher();
  const matcher = {
    match(input) {
      order.push("match");
      calls.match.push(input);
      if (overrides.matchError) throw overrides.matchError;
      return delegate.match(input);
    },
  };

  return {order, calls, metadataReader, aclReader, matcher, metadataValue, aclEntries};
}

async function load(f, inputOverrides = {}) {
  return loadDocumentAccessAclSubjectEvidence(
    {
      requestContext: context(),
      documentId: ids.document,
      permission: "DOWNLOAD",
      ...inputOverrides,
    },
    f.metadataReader,
    f.aclReader,
    f.matcher,
  );
}

test("DOC-ACLEVID-BASE-001 exact DD-082 candidate executes first with exact context/document/metadata dependency", async () => {
  const f = fixture();
  const ctx = context();
  const result = await load(f, {requestContext: ctx});

  assert.deepEqual(f.order, ["metadata", "acl", "match"]);
  assert.equal(f.calls.metadata.length, 1);
  assert.equal(f.calls.metadata[0].requestContext, ctx);
  assert.equal(f.calls.metadata[0].documentId, ids.document);
  assert.equal(result.candidate.documentId, ids.document);
});

test("DOC-ACLEVID-BASE-002 DD-082 governed error propagates and ACL reader/matcher are not invoked", async () => {
  const f = fixture({metadata: metadata({status: "QUARANTINED"})});
  await assert.rejects(
    load(f),
    error => error instanceof DocumentAccessCandidateError
      && error.code === "RESOURCE_STATE_INVALID",
  );
  assert.deepEqual(f.order, ["metadata"]);
  assert.equal(f.calls.acl.length, 0);
  assert.equal(f.calls.match.length, 0);
});

test("DOC-ACLEVID-READ-001 candidate success causes one exact DD-084 ACL read", async () => {
  const f = fixture();
  const ctx = context();
  await load(f, {requestContext: ctx});

  assert.equal(f.calls.acl.length, 1);
  assert.equal(f.calls.acl[0].requestContext, ctx);
  assert.equal(f.calls.acl[0].documentId, ids.document);
});

test("DOC-ACLEVID-READ-002 ACL dependency error propagates unchanged without retry/fallback/authorization synthesis", async () => {
  const expected = new Error("acl-unavailable");
  const f = fixture({aclError: expected});
  await assert.rejects(load(f), error => error === expected);
  assert.deepEqual(f.order, ["metadata", "acl"]);
  assert.equal(f.calls.acl.length, 1);
  assert.equal(f.calls.match.length, 0);
});

test("DOC-ACLEVID-MATCH-001 exact explicit permission and raw ACL array are delegated to DD-085 once", async () => {
  const entries = Object.freeze([
    acl(),
    acl({
      id: ids.acl2,
      subjectType: "ROLE",
      subjectId: ids.role,
      effect: "DENY",
    }),
  ]);
  const f = fixture({aclEntries: entries});
  const ctx = context();
  const result = await load(f, {requestContext: ctx, permission: "DOWNLOAD"});

  assert.equal(f.calls.match.length, 1);
  assert.equal(f.calls.match[0].requestContext, ctx);
  assert.equal(f.calls.match[0].documentId, ids.document);
  assert.equal(f.calls.match[0].permission, "DOWNLOAD");
  assert.equal(f.calls.match[0].entries, entries);
  assert.equal(result.matchedEntries.length, 2);
});

test("DOC-ACLEVID-MATCH-002 DD-085 cross-document/malformed evidence error propagates unchanged", async () => {
  const f = fixture({
    aclEntries: Object.freeze([acl({documentId: ids.otherDocument})]),
  });
  await assert.rejects(
    load(f),
    error => error instanceof DocumentAclSubjectMatchError
      && error.code === "ACL_MATCH_INPUT_INVALID",
  );
  assert.deepEqual(f.order, ["metadata", "acl", "match"]);
});

test("DOC-ACLEVID-EVID-001 empty matched set succeeds and preserves exact candidate/raw ACL evidence without deny synthesis", async () => {
  const entries = Object.freeze([
    acl({subjectId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd"}),
  ]);
  const f = fixture({aclEntries: entries});
  const result = await load(f);

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.candidate), true);
  assert.equal(result.rawAclEntries, entries);
  assert.equal(result.matchedEntries.length, 0);
  assert.equal(result.permission, "DOWNLOAD");
  assert.equal("authorized" in result, false);
  assert.equal("denied" in result, false);
});

test("DOC-ACLEVID-EVID-002 matched evidence preserves raw ALLOW/DENY validUntil facts and input order", async () => {
  const entries = Object.freeze([
    acl({
      id: ids.acl1,
      effect: "DENY",
      validUntil: "2026-10-06T00:00:00.000Z",
    }),
    acl({
      id: ids.acl2,
      subjectType: "ROLE",
      subjectId: ids.role,
      effect: "ALLOW",
      validUntil: "2020-01-01T00:00:00.000Z",
    }),
  ]);
  const f = fixture({aclEntries: entries});
  const before = JSON.stringify(entries);
  const result = await load(f);

  assert.equal(result.rawAclEntries, entries);
  assert.deepEqual(result.matchedEntries.map(x => x.id), [ids.acl1, ids.acl2]);
  assert.deepEqual(result.matchedEntries.map(x => x.effect), ["DENY", "ALLOW"]);
  assert.deepEqual(
    result.matchedEntries.map(x => x.validUntil),
    ["2026-10-06T00:00:00.000Z", "2020-01-01T00:00:00.000Z"],
  );
  assert.equal(JSON.stringify(entries), before);
});

test("DOC-ACLEVID-BOUND-001 output grants no effect/expiry/final authorization/signing/operation authority", async () => {
  const result = await load(fixture());
  for (const forbidden of [
    "authorized",
    "denied",
    "effectiveEntries",
    "expiredEntries",
    "decision",
    "authorizationDecision",
    "stepUpRequired",
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
