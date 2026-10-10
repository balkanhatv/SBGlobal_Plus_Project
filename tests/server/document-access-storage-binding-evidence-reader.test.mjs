import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAccessCandidateError,
} from "../../dist/core/index.js";
import {
  loadDocumentAccessStorageBindingEvidence,
} from "../../dist/server/document/document-access-storage-binding-evidence-reader.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  principal: "33333333-3333-4333-8333-333333333333",
  document: "44444444-4444-4444-8444-444444444444",
  storageObject: "55555555-5555-4555-8555-555555555555",
  owner: "66666666-6666-4666-8666-666666666666",
  correlation: "77777777-7777-4777-8777-777777777777",
  dataHome: "88888888-8888-4888-8888-888888888888",
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
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
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
    ownerPrincipalId: ids.owner,
    sensitivityClass: "CONFIDENTIAL",
    residencyRegion: "IN-CENTRAL",
    status: "ACTIVE",
    virusScanStatus: "CLEAN",
    versionNo: 3,
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
  const metadataCalls = [];
  const bindingCalls = [];
  const values = {
    metadata: Object.hasOwn(overrides, "metadata")
      ? overrides.metadata
      : metadata(),
    binding: Object.hasOwn(overrides, "binding")
      ? overrides.binding
      : binding(),
  };

  return {
    order,
    metadataCalls,
    bindingCalls,
    values,
    metadataReader: {
      async loadForContext(input) {
        order.push("metadata");
        metadataCalls.push(input);
        if (overrides.metadataError) throw overrides.metadataError;
        return values.metadata;
      },
    },
    bindingReader: {
      async load(input) {
        order.push("binding");
        bindingCalls.push(input);
        if (overrides.bindingError) throw overrides.bindingError;
        return values.binding;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadDocumentAccessStorageBindingEvidence(
    {
      requestContext: context(),
      documentId: ids.document,
      ...inputOverrides,
    },
    f.metadataReader,
    f.bindingReader,
  );
}

test("DOC-STOEVID-BASE-001 exact DD-082 candidate executes first with exact input/dependency", async () => {
  const f = fixture();
  const requestContext = context();

  const result = await load(f, {requestContext});

  assert.ok(result);
  assert.deepEqual(f.order, ["metadata", "binding"]);
  assert.equal(f.metadataCalls.length, 1);
  assert.equal(f.metadataCalls[0].requestContext, requestContext);
  assert.equal(f.metadataCalls[0].documentId, ids.document);
  assert.equal(result.candidate.documentId, ids.document);
  assert.equal(result.candidate.storageObjectId, ids.storageObject);
});

test("DOC-STOEVID-BASE-002 DD-082 governed failure precedes physical binding access", async () => {
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
  assert.equal(f.bindingCalls.length, 0);
});

test("DOC-STOEVID-READ-001 candidate success reads exact linked binding once", async () => {
  const f = fixture();
  const requestContext = context();
  const result = await load(f, {requestContext});

  assert.ok(result);
  assert.equal(f.bindingCalls.length, 1);
  assert.equal(f.bindingCalls[0].requestContext, requestContext);
  assert.equal(f.bindingCalls[0].documentId, ids.document);
  assert.equal(f.bindingCalls[0].storageObjectId, ids.storageObject);
});

test("DOC-STOEVID-READ-002 binding dependency error propagates unchanged with no retry or fallback", async () => {
  const expected = new Error("physical-binding-unavailable");
  const f = fixture({bindingError: expected});

  await assert.rejects(load(f), error => error === expected);
  assert.deepEqual(f.order, ["metadata", "binding"]);
  assert.equal(f.bindingCalls.length, 1);
});

test("DOC-STOEVID-NULL-001 missing exact DD-086 binding returns null with no arbitrary locator fallback", async () => {
  const f = fixture({binding: null});

  assert.equal(await load(f), null);
  assert.deepEqual(f.order, ["metadata", "binding"]);
  assert.equal(f.bindingCalls.length, 1);
  assert.deepEqual(
    Object.keys(f.bindingCalls[0]).sort(),
    ["documentId", "requestContext", "storageObjectId"],
  );
});

test("DOC-STOEVID-EVID-001 success is frozen and preserves exact binding reference plus immutable candidate", async () => {
  const exactBinding = binding();
  const f = fixture({binding: exactBinding});

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.candidate), true);
  assert.equal(result.binding, exactBinding);
  assert.equal(result.candidate.documentId, ids.document);
  assert.equal(result.candidate.storageObjectId, exactBinding.storageObjectId);
});

test("DOC-STOEVID-EVID-002 private locator and integrity facts remain exact raw evidence", async () => {
  const exactBinding = binding();
  const before = JSON.stringify(exactBinding);
  const f = fixture({binding: exactBinding});

  const result = await load(f);
  assert.ok(result);
  assert.equal(result.binding.providerRefEncrypted, "ciphertext-provider-ref");
  assert.equal(result.binding.bucketClass, "PRIVATE_DOCUMENT");
  assert.equal(result.binding.objectKey, "tenant/private/evidence.pdf");
  assert.equal(result.binding.objectVersion, "v-3");
  assert.equal(result.binding.sizeBytes, "64");
  assert.equal(result.binding.checksumSha256, "checksum-exact");
  assert.equal(result.binding.encryptionKeyRef, "kms:key:document");
  assert.equal(JSON.stringify(exactBinding), before);
});

test("DOC-STOEVID-BOUND-001 evidence grants no authorization signing provider selection route dispatch or mutation authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "authorized",
    "denied",
    "aclEffective",
    "permissionAllowed",
    "entitlementAllowed",
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

  assert.deepEqual(Object.keys(result).sort(), ["binding", "candidate"]);
});
