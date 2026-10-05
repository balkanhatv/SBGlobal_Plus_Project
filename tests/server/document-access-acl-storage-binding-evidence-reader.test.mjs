import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAccessCandidateError,
  DocumentAclSubjectMatcher,
} from "../../dist/core/index.js";
import {
  loadDocumentAccessAclStorageBindingEvidence,
} from "../../dist/server/document/document-access-acl-storage-binding-evidence-reader.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  document: "33333333-3333-4333-8333-333333333333",
  storageObject: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
  role: "66666666-6666-4666-8666-666666666666",
  correlation: "77777777-7777-4777-8777-777777777777",
  dataHome: "88888888-8888-4888-8888-888888888888",
  acl1: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  acl2: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "99999999-9999-4999-8999-999999999999",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: ids.dataHome,
    regionCode: "IN-CENTRAL",
    principalId: ids.principal,
    principalType: "HUMAN",
    membershipId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    orgUnitPath: Object.freeze([]),
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
    sourceModule: "Documents",
    sourceResourceType: "CaseFile",
    sourceResourceId: "case-42",
    filenameDisplay: "evidence.pdf",
    mediaType: "application/pdf",
    storageObjectId: ids.storageObject,
    ownerPrincipalId: ids.principal,
    sensitivityClass: "CONFIDENTIAL",
    residencyRegion: "IN-CENTRAL",
    status: "ACTIVE",
    virusScanStatus: "CLEAN",
    versionNo: 3,
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

function binding(overrides = {}) {
  return Object.freeze({
    storageObjectId: ids.storageObject,
    dataHomeId: ids.dataHome,
    providerRefEncrypted: "ciphertext-provider-ref",
    bucketClass: "PRIVATE_DOCUMENT",
    objectKey: "tenant/private/evidence.pdf",
    objectVersion: "v-3",
    sizeBytes: "64",
    checksumSha256: "checksum-exact",
    encryptionKeyRef: "kms:key:document",
    status: "ACTIVE",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {metadata: [], acl: [], match: [], binding: []};
  const metadataValue = Object.hasOwn(overrides, "metadata")
    ? overrides.metadata
    : metadata();
  const aclEntries = Object.hasOwn(overrides, "aclEntries")
    ? overrides.aclEntries
    : Object.freeze([acl()]);
  const bindingValue = Object.hasOwn(overrides, "binding")
    ? overrides.binding
    : binding();

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
  let lastMatched;
  const matcher = {
    match(input) {
      order.push("match");
      calls.match.push(input);
      if (overrides.matchError) throw overrides.matchError;
      lastMatched = delegate.match(input);
      return lastMatched;
    },
  };

  const bindingReader = {
    async load(input) {
      order.push("binding");
      calls.binding.push(input);
      if (overrides.bindingError) throw overrides.bindingError;
      return bindingValue;
    },
  };

  return {
    order,
    calls,
    metadataReader,
    aclReader,
    matcher,
    bindingReader,
    metadataValue,
    aclEntries,
    bindingValue,
    get lastMatched() { return lastMatched; },
  };
}

async function load(f, inputOverrides = {}) {
  return loadDocumentAccessAclStorageBindingEvidence(
    {
      requestContext: context(),
      documentId: ids.document,
      permission: "DOWNLOAD",
      ...inputOverrides,
    },
    f.metadataReader,
    f.aclReader,
    f.bindingReader,
    f.matcher,
  );
}

test("DOC-ACLSTO-BASE-001 exact DD-542 parent executes first with exact context/document/permission and dependencies", async () => {
  const f = fixture();
  const requestContext = context();
  const result = await load(f, {requestContext});

  assert.ok(result);
  assert.deepEqual(f.order, ["metadata", "acl", "match", "binding"]);
  assert.equal(f.calls.metadata.length, 1);
  assert.equal(f.calls.metadata[0].requestContext, requestContext);
  assert.equal(f.calls.metadata[0].documentId, ids.document);
  assert.equal(f.calls.match[0].permission, "DOWNLOAD");
  assert.equal(result.parent.permission, "DOWNLOAD");
});

test("DOC-ACLSTO-BASE-002 DD-542 error propagates unchanged and binding reader is not invoked", async () => {
  const f = fixture({
    metadata: metadata({
      status: "QUARANTINED",
      virusScanStatus: "INFECTED",
    }),
  });

  await assert.rejects(
    load(f),
    error => error instanceof DocumentAccessCandidateError
      && error.code === "RESOURCE_STATE_INVALID",
  );
  assert.deepEqual(f.order, ["metadata"]);
  assert.equal(f.calls.binding.length, 0);
});

test("DOC-ACLSTO-READ-001 parent success reads exact candidate-linked DD-086 binding once with no duplicate candidate read", async () => {
  const f = fixture();
  const requestContext = context();
  const result = await load(f, {requestContext});

  assert.ok(result);
  assert.equal(f.calls.metadata.length, 1);
  assert.equal(f.calls.binding.length, 1);
  assert.equal(f.calls.binding[0].requestContext, requestContext);
  assert.equal(f.calls.binding[0].documentId, result.parent.candidate.documentId);
  assert.equal(f.calls.binding[0].storageObjectId, result.parent.candidate.storageObjectId);
  assert.equal(f.calls.binding[0].documentId, ids.document);
  assert.equal(f.calls.binding[0].storageObjectId, ids.storageObject);
});

test("DOC-ACLSTO-READ-002 binding dependency error propagates unchanged with no retry or fallback", async () => {
  const expected = new Error("physical-binding-unavailable");
  const f = fixture({bindingError: expected});

  await assert.rejects(load(f), error => error === expected);
  assert.deepEqual(f.order, ["metadata", "acl", "match", "binding"]);
  assert.equal(f.calls.metadata.length, 1);
  assert.equal(f.calls.binding.length, 1);
});

test("DOC-ACLSTO-NULL-001 missing exact DD-086 binding returns null without authorization synthesis or alternate locator fallback", async () => {
  const f = fixture({binding: null});

  assert.equal(await load(f), null);
  assert.deepEqual(f.order, ["metadata", "acl", "match", "binding"]);
  assert.equal(f.calls.binding.length, 1);
  assert.deepEqual(
    Object.keys(f.calls.binding[0]).sort(),
    ["documentId", "requestContext", "storageObjectId"],
  );
});

test("DOC-ACLSTO-EVID-001 success is frozen and preserves exact nested ACL evidence plus exact binding reference", async () => {
  const entries = Object.freeze([acl()]);
  const exactBinding = binding();
  const f = fixture({aclEntries: entries, binding: exactBinding});

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(result.parent.rawAclEntries, entries);
  assert.equal(result.parent.matchedEntries, f.lastMatched);
  assert.equal(result.binding, exactBinding);
});

test("DOC-ACLSTO-EVID-002 empty/non-empty ACL evidence and private physical facts remain raw and uninterpreted", async () => {
  const entries = Object.freeze([
    acl({
      id: ids.acl1,
      subjectId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      effect: "DENY",
      validUntil: "2020-01-01T00:00:00.000Z",
    }),
  ]);
  const exactBinding = binding();
  const before = JSON.stringify([entries, exactBinding]);
  const f = fixture({aclEntries: entries, binding: exactBinding});

  const result = await load(f);
  assert.ok(result);
  assert.equal(result.parent.rawAclEntries, entries);
  assert.equal(result.parent.matchedEntries.length, 0);
  assert.equal(result.binding.providerRefEncrypted, "ciphertext-provider-ref");
  assert.equal(result.binding.objectKey, "tenant/private/evidence.pdf");
  assert.equal(JSON.stringify([entries, exactBinding]), before);
});

test("DOC-ACLSTO-BOUND-001 output grants no ACL-effect authorization signing provider route dispatch or mutation authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "effectiveEntries",
    "expiredEntries",
    "authorized",
    "denied",
    "decision",
    "authorizationDecision",
    "providerSelected",
    "provider",
    "signedUrl",
    "signedToken",
    "signedGrant",
    "expiresAt",
    "downloadAuthorized",
    "shareAuthorized",
    "deleteAuthorized",
    "dispatchAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
