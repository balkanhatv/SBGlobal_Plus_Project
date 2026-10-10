import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAccessAclCurrentEffectEvidenceError,
  DocumentAclSubjectMatcher,
} from "../../dist/core/index.js";
import {
  loadDocumentAccessAclCurrentEffectStorageBindingEvidence,
} from "../../dist/server/document/document-access-acl-current-effect-storage-binding-evidence-reader.js";

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
    : Object.freeze([
      acl(),
      acl({
        id: ids.acl2,
        subjectType: "ROLE",
        subjectId: ids.role,
        effect: "DENY",
        validUntil: "2026-10-04T00:00:00.000Z",
      }),
    ]);
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
  return loadDocumentAccessAclCurrentEffectStorageBindingEvidence(
    {
      requestContext: context(),
      documentId: ids.document,
      permission: "DOWNLOAD",
      currentTimeIso: "2026-10-05T12:00:00.000Z",
      ...inputOverrides,
    },
    f.metadataReader,
    f.aclReader,
    f.bindingReader,
    f.matcher,
  );
}

test("DOC-ACLEFFSTO-BASE-001 exact DD-562 parent executes first with exact context/document/permission/time and dependencies", async () => {
  const f = fixture();
  const requestContext = context();
  const result = await load(f, {requestContext});

  assert.ok(result);
  assert.deepEqual(f.order, ["metadata", "acl", "match", "binding"]);
  assert.equal(f.calls.metadata.length, 1);
  assert.equal(f.calls.acl.length, 1);
  assert.equal(f.calls.match.length, 1);
  assert.equal(f.calls.binding.length, 1);
  assert.equal(f.calls.metadata[0].requestContext, requestContext);
  assert.equal(result.parent.currentTimeIso, "2026-10-05T12:00:00.000Z");
  assert.equal(result.parent.parent.permission, "DOWNLOAD");
});

test("DOC-ACLEFFSTO-BASE-002 DD-562 error propagates unchanged and binding reader is not invoked", async () => {
  const f = fixture();
  await assert.rejects(
    load(f, {currentTimeIso: "not-a-time"}),
    error => error instanceof DocumentAccessAclCurrentEffectEvidenceError
      && error.code === "ACL_EFFECT_TIME_INVALID",
  );
  assert.deepEqual(f.order, ["metadata", "acl", "match"]);
  assert.equal(f.calls.binding.length, 0);
});

test("DOC-ACLEFFSTO-READ-001 parent success reads exact candidate-linked binding once with zero duplicate candidate/ACL read", async () => {
  const f = fixture();
  const requestContext = context();
  const result = await load(f, {requestContext});

  assert.ok(result);
  assert.equal(f.calls.metadata.length, 1);
  assert.equal(f.calls.acl.length, 1);
  assert.equal(f.calls.binding.length, 1);
  assert.equal(f.calls.binding[0].requestContext, requestContext);
  assert.equal(f.calls.binding[0].documentId, result.parent.parent.candidate.documentId);
  assert.equal(f.calls.binding[0].storageObjectId, result.parent.parent.candidate.storageObjectId);
  assert.equal(f.calls.binding[0].documentId, ids.document);
  assert.equal(f.calls.binding[0].storageObjectId, ids.storageObject);
});

test("DOC-ACLEFFSTO-READ-002 binding dependency error propagates unchanged with no retry/search/fallback", async () => {
  const expected = new Error("binding-unavailable");
  const f = fixture({bindingError: expected});

  await assert.rejects(load(f), error => error === expected);
  assert.deepEqual(f.order, ["metadata", "acl", "match", "binding"]);
  assert.equal(f.calls.binding.length, 1);
});

test("DOC-ACLEFFSTO-NULL-001 missing exact binding returns null without fallback or authorization synthesis", async () => {
  const f = fixture({binding: null});

  assert.equal(await load(f), null);
  assert.deepEqual(f.order, ["metadata", "acl", "match", "binding"]);
  assert.equal(f.calls.binding.length, 1);
  assert.deepEqual(
    Object.keys(f.calls.binding[0]).sort(),
    ["documentId", "requestContext", "storageObjectId"],
  );
});

test("DOC-ACLEFFSTO-EVID-001 success is frozen and preserves exact DD-562 parent plus exact binding reference", async () => {
  const entries = Object.freeze([acl()]);
  const exactBinding = binding();
  const f = fixture({aclEntries: entries, binding: exactBinding});

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(result.parent.parent.rawAclEntries, entries);
  assert.equal(result.parent.parent.matchedEntries, f.lastMatched);
  assert.equal(result.parent.currentEntries[0], f.lastMatched[0]);
  assert.equal(result.binding, exactBinding);
});

test("DOC-ACLEFFSTO-EVID-002 ACL current/effect evidence and private storage facts remain exact and unchanged", async () => {
  const entries = Object.freeze([
    acl({effect: "ALLOW"}),
    acl({
      id: ids.acl2,
      subjectType: "ROLE",
      subjectId: ids.role,
      effect: "DENY",
      validUntil: "2026-10-06T00:00:00.000Z",
    }),
  ]);
  const exactBinding = binding();
  const before = JSON.stringify([entries, exactBinding]);
  const f = fixture({aclEntries: entries, binding: exactBinding});

  const result = await load(f);
  assert.ok(result);
  assert.equal(result.parent.effectEvidence, "DENY");
  assert.equal(result.parent.currentEntries[0], result.parent.parent.matchedEntries[0]);
  assert.equal(result.parent.currentEntries[1], result.parent.parent.matchedEntries[1]);
  assert.equal(result.binding.providerRefEncrypted, "ciphertext-provider-ref");
  assert.equal(result.binding.objectKey, "tenant/private/evidence.pdf");
  assert.equal(JSON.stringify([entries, exactBinding]), before);
});

test("DOC-ACLEFFSTO-BOUND-001 output grants no final authorization fallback signing provider route dispatch or mutation authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

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
