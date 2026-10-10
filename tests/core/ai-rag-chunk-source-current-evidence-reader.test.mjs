import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIRAGChunkSourceCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  chunk: "11111111-1111-4111-8111-111111111111",
  source: "22222222-2222-4222-8222-222222222222",
  otherSource: "33333333-3333-4333-8333-333333333333",
  tenant: "44444444-4444-4444-8444-444444444444",
  otherTenant: "55555555-5555-4555-8555-555555555555",
  industry: "66666666-6666-4666-8666-666666666666",
  otherIndustry: "77777777-7777-4777-8777-777777777777",
  model: "88888888-8888-4888-8888-888888888888",
  principal: "99999999-9999-4999-8999-999999999999",
  membership: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  correlation: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-rag-chunk-source",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-rag-chunk-source",
    regionCode: "IN-CENTRAL",
    principalId: ids.principal,
    principalType: "HUMAN",
    membershipId: ids.membership,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
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
    chunkOrdinal: 3,
    textRefOrEncryptedText: "opaque://chunk",
    contentHash: "hash",
    tokenCount: 120,
    aclProjection: Object.freeze({raw: true}),
    sensitivityClass: "CONFIDENTIAL",
    residencyRegion: "IN-CENTRAL",
    retentionClass: "STANDARD",
    embeddingModelId: ids.model,
    embeddingVersion: "embed-v1",
    metadata: Object.freeze({raw: Object.freeze(["x"])}),
    createdAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  });
}

function source(overrides = {}) {
  return Object.freeze({
    id: ids.source,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    sourceModule: "Documents",
    managementSystemId: "MS-RAW",
    resourceType: "Document",
    resourceId: "resource-1",
    documentId: undefined,
    documentVersion: undefined,
    sensitivityClass: "INTERNAL",
    residencyRegion: "IN-CENTRAL",
    retentionClass: "STANDARD",
    aclPolicyRef: "acl://raw",
    status: "RETIRED",
    sourceVersion: "99",
    chunkingPolicyVersion: "raw-v99",
    createdAt: "2026-10-06T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const chunkCalls = [];
  const sourceCalls = [];
  const chunkValue = Object.hasOwn(overrides, "chunk")
    ? overrides.chunk
    : chunk();
  const sourceValue = Object.hasOwn(overrides, "source")
    ? overrides.source
    : source();

  return {
    order,
    chunkCalls,
    sourceCalls,
    chunkValue,
    sourceValue,
    chunkReader: {
      async loadForContext(input) {
        order.push("chunk");
        chunkCalls.push(input);
        if (overrides.chunkError) throw overrides.chunkError;
        return chunkValue;
      },
    },
    sourceReader: {
      async loadForContext(input) {
        order.push("source");
        sourceCalls.push(input);
        if (overrides.sourceError) throw overrides.sourceError;
        return sourceValue;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadAIRAGChunkSourceCurrentEvidence(
    {
      requestContext: context(),
      ragChunkId: ids.chunk,
      ...inputOverrides,
    },
    f.chunkReader,
    f.sourceReader,
  );
}

test("RAGCHUNK-SRCREAD-BASE-001 exact RAGChunk is loaded first with unchanged context/id", async () => {
  const f = fixture();
  const current = context();
  const result = await load(f, {requestContext: current});

  assert.ok(result);
  assert.equal(f.order[0], "chunk");
  assert.equal(f.chunkCalls.length, 1);
  assert.equal(f.chunkCalls[0].requestContext, current);
  assert.equal(f.chunkCalls[0].ragChunkId, ids.chunk);
  assert.equal(result.chunk, f.chunkValue);
});

test("RAGCHUNK-SRCREAD-BASE-002 chunk null/errors precede every RAGSource read", async () => {
  const hidden = fixture({chunk: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["chunk"]);
  assert.equal(hidden.sourceCalls.length, 0);

  const expected = new Error("rag-chunk-unavailable");
  const broken = fixture({chunkError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["chunk"]);
  assert.equal(broken.sourceCalls.length, 0);
});

test("RAGCHUNK-SRCREAD-READ-001 exactly one source read uses same context and persisted sourceId", async () => {
  const f = fixture();
  const current = context();
  const result = await load(f, {requestContext: current});

  assert.ok(result);
  assert.deepEqual(f.order, ["chunk", "source"]);
  assert.equal(f.sourceCalls.length, 1);
  assert.equal(f.sourceCalls[0].requestContext, current);
  assert.equal(f.sourceCalls[0].ragSourceId, ids.source);
});

test("RAGCHUNK-SRCREAD-READ-002 missing/error source evidence fails closed without retry search or fallback", async () => {
  const missing = fixture({source: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["chunk", "source"]);
  assert.equal(missing.sourceCalls.length, 1);
  assert.equal(missing.sourceCalls[0].ragSourceId, ids.source);

  const expected = new Error("rag-source-unavailable");
  const broken = fixture({sourceError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["chunk", "source"]);
  assert.equal(broken.sourceCalls.length, 1);
  assert.equal(broken.sourceCalls[0].ragSourceId, ids.source);
});

test("RAGCHUNK-SRCREAD-FLOOR-001 exact DD-194 Tenant-Industry and Tenant-Core relationship evidence passes", async () => {
  const industry = fixture();
  const industryResult = await load(industry);
  assert.ok(industryResult);
  assert.equal(industryResult.chunk, industry.chunkValue);
  assert.equal(industryResult.source, industry.sourceValue);

  const core = fixture({
    chunk: chunk({industryContextId: undefined, scopeClass: "TENANT_CORE"}),
    source: source({industryContextId: undefined, scopeClass: "TENANT_CORE"}),
  });
  const coreResult = await load(core, {
    requestContext: context({
      industryContextId: undefined,
      scopeClass: "TENANT_CORE",
    }),
  });
  assert.ok(coreResult);
  assert.equal(coreResult.chunk, core.chunkValue);
  assert.equal(coreResult.source, core.sourceValue);
});

test("RAGCHUNK-SRCREAD-FLOOR-002 wrong malformed or mismatched DD-194 relationship evidence fails closed", async () => {
  const cases = [
    {source: source({id: ids.otherSource})},
    {source: source({tenantId: ids.otherTenant})},
    {source: source({industryContextId: ids.otherIndustry})},
    {source: source({industryContextId: undefined, scopeClass: "TENANT_CORE"})},
    {source: source({residencyRegion: "US"})},
    {source: source({retentionClass: "OTHER"})},
    {source: source({sensitivityClass: "REGULATED"})},
    {chunk: chunk({sourceId: "not-a-uuid"})},
    {source: source({id: "not-a-uuid"})},
  ];

  for (const candidate of cases) {
    const f = fixture(candidate);
    assert.equal(await load(f), null);
    assert.equal(f.sourceCalls.length, 1);
  }
});

test("RAGCHUNK-SRCREAD-EVID-001 success is frozen and preserves exact chunk/source raw evidence references", async () => {
  const f = fixture();
  const before = JSON.stringify([f.chunkValue, f.sourceValue]);

  const result = await load(f);
  assert.ok(result);
  assert.deepEqual(f.order, ["chunk", "source"]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.chunk, f.chunkValue);
  assert.equal(result.source, f.sourceValue);
  assert.equal(result.chunk.aclProjection.raw, true);
  assert.equal(result.chunk.embeddingModelId, ids.model);
  assert.equal(result.chunk.embeddingVersion, "embed-v1");
  assert.equal(result.source.status, "RETIRED");
  assert.equal(result.source.sourceVersion, "99");
  assert.equal(result.source.aclPolicyRef, "acl://raw");
  assert.equal(JSON.stringify([f.chunkValue, f.sourceValue]), before);
});

test("RAGCHUNK-SRCREAD-BOUND-001 evidence grants no source-status document ACL model retrieval grounding routing execution mutation or event authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "sourceCurrent",
    "sourceActive",
    "document",
    "documentCurrent",
    "aclEntries",
    "aclEffect",
    "authorized",
    "accessAllowed",
    "storageBinding",
    "sourceResourceAuthorized",
    "embeddingModel",
    "embeddingEligible",
    "provider",
    "model",
    "vector",
    "search",
    "retrievalAuthorized",
    "ranked",
    "grounded",
    "route",
    "executionAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
