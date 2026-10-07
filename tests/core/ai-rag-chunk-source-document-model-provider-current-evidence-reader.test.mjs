import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIRAGChunkSourceDocumentModelProviderCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  chunk: "33333333-3333-4333-8333-333333333333",
  source: "44444444-4444-4444-8444-444444444444",
  document: "55555555-5555-4555-8555-555555555555",
  model: "66666666-6666-4666-8666-666666666666",
  provider: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
  membership: "99999999-9999-4999-8999-999999999999",
  correlation: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

function requestContext(overrides = {}) {
  return Object.freeze({
    requestId: "request-1",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "data-home",
    regionCode: "IN-CENTRAL",
    principalId: ids.principal,
    principalType: "HUMAN",
    membershipId: ids.membership,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    permissionVersion: 7,
    entitlementSnapshotVersion: 11,
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function chunk(overrides = {}) {
  return Object.freeze({
    id: ids.chunk,
    sourceId: ids.source,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    chunkOrdinal: 1,
    textRefOrEncryptedText: "opaque-text",
    contentHash: "hash-1",
    tokenCount: 100,
    aclProjection: Object.freeze({raw: true}),
    sensitivityClass: "CONFIDENTIAL",
    residencyRegion: "IN-CENTRAL",
    retentionClass: "RET-A",
    embeddingModelId: ids.model,
    embeddingVersion: "embed-v1",
    metadata: Object.freeze({raw: true}),
    createdAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  });
}

function model(overrides = {}) {
  return Object.freeze({
    id: ids.model,
    providerId: ids.provider,
    modelCode: "embed-model",
    displayName: "Embedding Model",
    capabilities: Object.freeze(["EMBEDDING"]),
    contextWindowClass: "raw-context",
    inputModalities: Object.freeze(["TEXT"]),
    outputModalities: Object.freeze(["VECTOR"]),
    residencyRegions: Object.freeze(["IN-CENTRAL"]),
    sensitivityCeiling: "REGULATED",
    costClass: "raw-cost",
    latencyClass: "raw-latency",
    status: "ACTIVE",
    version: 1,
    metadata: Object.freeze({raw: true}),
    ...overrides,
  });
}

function provider(overrides = {}) {
  return Object.freeze({
    id: ids.provider,
    code: "provider.raw",
    status: "DEGRADED",
    adapterType: "raw-adapter",
    supportedRegions: Object.freeze(["IN-CENTRAL"]),
    supportedCapabilities: Object.freeze(["EMBEDDING"]),
    securityClass: "raw-security",
    residencyMetadata: Object.freeze({raw: true}),
    healthState: "UNKNOWN",
    version: 1,
    createdAt: "2026-10-07T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  });
}

function source(overrides = {}) {
  return Object.freeze({
    id: ids.source,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    sourceModule: "DMS",
    managementSystemId: undefined,
    resourceType: "DOCUMENT",
    resourceId: "resource-1",
    documentId: ids.document,
    documentVersion: 2,
    sensitivityClass: "INTERNAL",
    residencyRegion: "IN-CENTRAL",
    retentionClass: "RET-A",
    aclPolicyRef: "acl-policy-raw",
    status: "SUPERSEDED",
    sourceVersion: "source-v1",
    chunkingPolicyVersion: "chunk-v1",
    createdAt: "2026-10-07T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  });
}

function document(overrides = {}) {
  return Object.freeze({
    id: ids.document,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    sourceModule: "DMS",
    sourceResourceType: "DOCUMENT",
    sourceResourceId: "resource-1",
    filenameDisplay: "safe.pdf",
    mediaType: "application/pdf",
    storageObjectId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    ownerPrincipalId: ids.principal,
    sensitivityClass: "PUBLIC",
    residencyRegion: "IN-CENTRAL",
    status: "ACTIVE",
    virusScanStatus: "CLEAN",
    versionNo: 2,
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {chunk: [], model: [], provider: [], source: [], document: []};
  const values = {
    chunk: Object.hasOwn(overrides, "chunk") ? overrides.chunk : chunk(),
    model: Object.hasOwn(overrides, "model") ? overrides.model : model(),
    provider: Object.hasOwn(overrides, "provider") ? overrides.provider : provider(),
    source: Object.hasOwn(overrides, "source") ? overrides.source : source(),
    document: Object.hasOwn(overrides, "document") ? overrides.document : document(),
  };
  const readers = {
    chunkReader: {
      async loadForContext(input) {
        order.push("chunk"); calls.chunk.push(input);
        if (overrides.chunkError) throw overrides.chunkError;
        return values.chunk;
      },
    },
    modelReader: {
      async loadById(id) {
        order.push("model"); calls.model.push(id);
        if (overrides.modelError) throw overrides.modelError;
        return values.model;
      },
    },
    providerReader: {
      async loadById(id) {
        order.push("provider"); calls.provider.push(id);
        if (overrides.providerError) throw overrides.providerError;
        return values.provider;
      },
    },
    sourceReader: {
      async loadForContext(input) {
        order.push("source"); calls.source.push(input);
        if (overrides.sourceError) throw overrides.sourceError;
        return values.source;
      },
    },
    documentReader: {
      async loadForContext(input) {
        order.push("document"); calls.document.push(input);
        if (overrides.documentError) throw overrides.documentError;
        return values.document;
      },
    },
  };
  return {order, calls, values, readers};
}

async function load(f, inputOverrides = {}) {
  return loadAIRAGChunkSourceDocumentModelProviderCurrentEvidence(
    {
      requestContext: requestContext(),
      ragChunkId: ids.chunk,
      ...inputOverrides,
    },
    f.readers.chunkReader,
    f.readers.modelReader,
    f.readers.providerReader,
    f.readers.sourceReader,
    f.readers.documentReader,
  );
}

test("RAGCHUNK-LINEAGE-BASE-001 exact DD-642 parent evidence is established first with unchanged inputs/dependencies", async () => {
  const f = fixture();
  const ctx = requestContext();
  const result = await load(f, {requestContext: ctx});

  assert.ok(result);
  assert.deepEqual(f.order, ["chunk", "model", "provider", "source", "document"]);
  assert.equal(f.calls.chunk[0].requestContext, ctx);
  assert.equal(f.calls.chunk[0].ragChunkId, ids.chunk);
  assert.equal(f.calls.model[0], ids.model);
  assert.equal(f.calls.provider[0], ids.provider);
  assert.equal(result.parent.parent.chunk, f.values.chunk);
  assert.equal(result.parent.parent.model, f.values.model);
  assert.equal(result.parent.provider, f.values.provider);
});

test("RAGCHUNK-LINEAGE-BASE-002 DD-642 null/error short-circuits or propagates before Source/Document access", async () => {
  const hidden = fixture({chunk: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["chunk"]);
  assert.equal(hidden.calls.source.length, 0);
  assert.equal(hidden.calls.document.length, 0);

  const expected = new Error("provider-failed");
  const broken = fixture({providerError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["chunk", "model", "provider"]);
  assert.equal(broken.calls.source.length, 0);
  assert.equal(broken.calls.document.length, 0);
});

test("RAGCHUNK-LINEAGE-SRC-001 exactly one Source read uses exact RequestContext and preserved chunk.sourceId", async () => {
  const f = fixture();
  const ctx = requestContext();
  const result = await load(f, {requestContext: ctx});

  assert.ok(result);
  assert.equal(f.calls.source.length, 1);
  assert.equal(f.calls.source[0].requestContext, ctx);
  assert.equal(f.calls.source[0].ragSourceId, ids.source);
});

test("RAGCHUNK-LINEAGE-SRC-002 missing/error Source evidence has no re-read search fallback or Document access", async () => {
  const missing = fixture({source: null});
  assert.equal(await load(missing), null);
  assert.equal(missing.calls.source.length, 1);
  assert.equal(missing.calls.document.length, 0);

  const expected = new Error("source-failed");
  const broken = fixture({sourceError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.equal(broken.calls.source.length, 1);
  assert.equal(broken.calls.document.length, 0);
});

test("RAGCHUNK-LINEAGE-SRC-003 exact DD-194 relationship passes while mismatched Source evidence fails closed", async () => {
  assert.ok(await load(fixture()));

  for (const badSource of [
    source({id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc"}),
    source({tenantId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd"}),
    source({industryContextId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"}),
    source({residencyRegion: "EU-WEST"}),
    source({retentionClass: "RET-B"}),
    source({sensitivityClass: "REGULATED"}),
  ]) {
    const f = fixture({source: badSource});
    assert.equal(await load(f), null);
    assert.equal(f.calls.source.length, 1);
    assert.equal(f.calls.document.length, 0);
  }
});

test("RAGCHUNK-LINEAGE-DOC-001 unbound Source performs zero Document reads and returns frozen source-only lineage", async () => {
  const unbound = source({documentId: undefined, documentVersion: undefined});
  const f = fixture({source: unbound});
  const result = await load(f);

  assert.ok(result);
  assert.equal(f.calls.document.length, 0);
  assert.equal(result.source, unbound);
  assert.equal("document" in result, false);
  assert.equal(Object.isFrozen(result), true);
});

test("RAGCHUNK-LINEAGE-DOC-002 bound Source performs exactly one exact Document read; missing/errors do not fall back", async () => {
  const ctx = requestContext();
  const ok = fixture();
  const result = await load(ok, {requestContext: ctx});
  assert.ok(result);
  assert.equal(ok.calls.document.length, 1);
  assert.equal(ok.calls.document[0].requestContext, ctx);
  assert.equal(ok.calls.document[0].documentId, ids.document);

  const missing = fixture({document: null});
  assert.equal(await load(missing), null);
  assert.equal(missing.calls.document.length, 1);

  const expected = new Error("document-failed");
  const broken = fixture({documentError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.equal(broken.calls.document.length, 1);
});

test("RAGCHUNK-LINEAGE-DOC-003 exact DD-193 bound relationship passes while unsafe Document evidence fails closed", async () => {
  assert.ok(await load(fixture()));

  for (const badDocument of [
    document({id: "ffffffff-ffff-4fff-8fff-ffffffffffff"}),
    document({versionNo: 3}),
    document({status: "DELETED"}),
    document({virusScanStatus: "INFECTED"}),
    document({residencyRegion: "EU-WEST"}),
    document({sensitivityClass: "REGULATED"}),
  ]) {
    const f = fixture({document: badDocument});
    assert.equal(await load(f), null);
    assert.equal(f.calls.document.length, 1);
  }
});

test("RAGCHUNK-LINEAGE-EVID-001 success preserves exact parent Model Provider Source Document references and raw evidence", async () => {
  const f = fixture();
  const before = JSON.stringify([
    f.values.chunk,
    f.values.model,
    f.values.provider,
    f.values.source,
    f.values.document,
  ]);

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.parent.chunk, f.values.chunk);
  assert.equal(result.parent.parent.model, f.values.model);
  assert.equal(result.parent.provider, f.values.provider);
  assert.equal(result.source, f.values.source);
  assert.equal(result.document, f.values.document);
  assert.equal(result.parent.provider.status, "DEGRADED");
  assert.equal(result.source.status, "SUPERSEDED");
  assert.equal(result.source.aclPolicyRef, "acl-policy-raw");
  assert.equal(
    JSON.stringify([
      f.values.chunk,
      f.values.model,
      f.values.provider,
      f.values.source,
      f.values.document,
    ]),
    before,
  );
});

test("RAGCHUNK-LINEAGE-BOUND-001 output exposes no ACL storage provider routing retrieval grounding execution mutation or event authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "aclAuthorized",
    "accessAllowed",
    "storageAuthorized",
    "signedUrlAuthorized",
    "providerUsable",
    "providerCurrent",
    "routeDecision",
    "routingAuthorized",
    "retrievalAuthorized",
    "rankedChunks",
    "groundingSatisfied",
    "citationAuthorized",
    "executionAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
