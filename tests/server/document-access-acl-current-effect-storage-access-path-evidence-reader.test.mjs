import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAccessAclCurrentEffectEvidenceError,
  DocumentAclSubjectMatcher,
} from "../../dist/core/index.js";
import {
  loadDocumentAccessAclCurrentEffectStorageAccessPathEvidence,
} from "../../dist/server/document/document-access-acl-current-effect-storage-access-path-evidence-reader.js";

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
  const metadataValue = Object.hasOwn(overrides, "metadata") ? overrides.metadata : metadata();
  const aclEntries = Object.hasOwn(overrides, "aclEntries")
    ? overrides.aclEntries
    : Object.freeze([acl()]);
  const bindingValue = Object.hasOwn(overrides, "binding") ? overrides.binding : binding();

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
  return loadDocumentAccessAclCurrentEffectStorageAccessPathEvidence(
    {
      requestContext: context(),
      documentId: ids.document,
      permission: "DOWNLOAD",
      currentTimeIso: "2026-10-06T03:00:00.000Z",
      ...inputOverrides,
    },
    f.metadataReader,
    f.aclReader,
    f.bindingReader,
    f.matcher,
  );
}

test("DOC-ACLPATH-BASE-001 exact DD-567 parent executes first and access-path classification performs zero additional reads", async () => {
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
  assert.equal(result.parent.parent.parent.permission, "DOWNLOAD");
});

test("DOC-ACLPATH-BASE-002 DD-567 null remains null and parent errors propagate unchanged", async () => {
  const missing = fixture({binding: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["metadata", "acl", "match", "binding"]);

  const broken = fixture();
  await assert.rejects(
    load(broken, {currentTimeIso: "not-a-time"}),
    error => error instanceof DocumentAccessAclCurrentEffectEvidenceError
      && error.code === "ACL_EFFECT_TIME_INVALID",
  );
  assert.deepEqual(broken.order, ["metadata", "acl", "match"]);
});

test("DOC-ACLPATH-DENY-001 current explicit DENY maps only to EXPLICIT_ACL_DENY with no source-resource fallback authority", async () => {
  const entries = Object.freeze([
    acl({effect: "ALLOW"}),
    acl({
      id: ids.acl2,
      subjectType: "ROLE",
      subjectId: ids.role,
      effect: "DENY",
    }),
  ]);
  const f = fixture({aclEntries: entries});
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.parent.parent.effectEvidence, "DENY");
  assert.equal(result.accessPathEvidence, "EXPLICIT_ACL_DENY");
  assert.equal("sourceResourceAuthorization" in result, false);
});

test("DOC-ACLPATH-ALLOW-001 current explicit ALLOW maps only to EXPLICIT_ACL_ALLOW without final authorization", async () => {
  const f = fixture({aclEntries: Object.freeze([acl({effect: "ALLOW"})])});
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.parent.parent.effectEvidence, "ALLOW");
  assert.equal(result.accessPathEvidence, "EXPLICIT_ACL_ALLOW");
  assert.equal("authorized" in result, false);
  assert.equal("authorizationDecision" in result, false);
});

test("DOC-ACLPATH-NONE-001 NONE maps only to SOURCE_RESOURCE_AUTHORIZATION_REQUIRED without executing or synthesizing source authorization", async () => {
  const f = fixture({aclEntries: Object.freeze([])});
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.parent.parent.effectEvidence, "NONE");
  assert.equal(result.accessPathEvidence, "SOURCE_RESOURCE_AUTHORIZATION_REQUIRED");
  assert.deepEqual(f.order, ["metadata", "acl", "match", "binding"]);
  assert.equal(result.parent.parent.parent.candidate.sourceResourceId, "case-42");
  assert.equal("sourceResourceDecision" in result, false);
});

test("DOC-ACLPATH-EVID-001 success is frozen and preserves exact nested ACL candidate and binding evidence references unchanged", async () => {
  const entries = Object.freeze([acl()]);
  const exactBinding = binding();
  const before = JSON.stringify([entries, exactBinding]);
  const f = fixture({aclEntries: entries, binding: exactBinding});

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(result.parent.parent.parent.rawAclEntries, entries);
  assert.equal(result.parent.parent.parent.matchedEntries, f.lastMatched);
  assert.equal(result.parent.binding, exactBinding);
  assert.equal(result.parent.parent.currentEntries[0], f.lastMatched[0]);
  assert.equal(JSON.stringify([entries, exactBinding]), before);
});

test("DOC-ACLPATH-BOUND-001 output grants no mapping authorization policy signing storage-dispatch or mutation authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "operationContract",
    "operationPermission",
    "aclPermissionMapped",
    "authorized",
    "authorizationDecision",
    "accessDecision",
    "guardResult",
    "rbacAllowed",
    "abacSatisfied",
    "entitlementAllowed",
    "commercialAllowed",
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
