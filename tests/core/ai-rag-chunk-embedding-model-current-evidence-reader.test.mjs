import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIRAGChunkEmbeddingModelCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  chunk: "11111111-1111-4111-8111-111111111111",
  source: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  model: "55555555-5555-4555-8555-555555555555",
  otherModel: "66666666-6666-4666-8666-666666666666",
  provider: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
  membership: "99999999-9999-4999-8999-999999999999",
  correlation: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-rag-chunk-model",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-rag-chunk-model",
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
    chunkOrdinal: 7,
    textRefOrEncryptedText: "opaque://chunk",
    contentHash: "raw-hash",
    tokenCount: 256,
    aclProjection: Object.freeze({deny: true}),
    sensitivityClass: "CONFIDENTIAL",
    residencyRegion: "IN-CENTRAL",
    retentionClass: "STANDARD",
    embeddingModelId: ids.model,
    embeddingVersion: "embed-v99",
    metadata: Object.freeze({raw: Object.freeze(["x"])}),
    createdAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  });
}

function model(overrides = {}) {
  return Object.freeze({
    id: ids.model,
    providerId: ids.provider,
    modelCode: "embedding.raw",
    displayName: "Raw Embedding Model",
    capabilities: Object.freeze(["EMBEDDING", null]),
    contextWindowClass: "RAW",
    inputModalities: Object.freeze(["TEXT"]),
    outputModalities: Object.freeze(["EMBEDDING"]),
    residencyRegions: Object.freeze(["OTHER"]),
    sensitivityCeiling: "REGULATED",
    costClass: "RAW-COST",
    latencyClass: "RAW-LATENCY",
    status: "ACTIVE",
    version: 99,
    metadata: Object.freeze({raw: true}),
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const chunkCalls = [];
  const modelCalls = [];
  const chunkValue = Object.hasOwn(overrides, "chunk")
    ? overrides.chunk
    : chunk();
  const modelValue = Object.hasOwn(overrides, "model")
    ? overrides.model
    : model();

  return {
    order,
    chunkCalls,
    modelCalls,
    chunkValue,
    modelValue,
    chunkReader: {
      async loadForContext(input) {
        order.push("chunk");
        chunkCalls.push(input);
        if (overrides.chunkError) throw overrides.chunkError;
        return chunkValue;
      },
    },
    modelReader: {
      async loadById(id) {
        order.push("model");
        modelCalls.push(id);
        if (overrides.modelError) throw overrides.modelError;
        return modelValue;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadAIRAGChunkEmbeddingModelCurrentEvidence(
    {
      requestContext: context(),
      ragChunkId: ids.chunk,
      ...inputOverrides,
    },
    f.chunkReader,
    f.modelReader,
  );
}

test("RAGCHUNK-MODELREAD-BASE-001 exact RAGChunk is loaded first with unchanged context/id", async () => {
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

test("RAGCHUNK-MODELREAD-BASE-002 chunk null/errors precede every AIModel read", async () => {
  const missing = fixture({chunk: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["chunk"]);
  assert.equal(missing.modelCalls.length, 0);

  const expected = new Error("rag-chunk-unavailable");
  const broken = fixture({chunkError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["chunk"]);
  assert.equal(broken.modelCalls.length, 0);
});

test("RAGCHUNK-MODELREAD-READ-001 exactly one model read uses persisted embeddingModelId", async () => {
  const f = fixture();
  const result = await load(f);

  assert.ok(result);
  assert.deepEqual(f.order, ["chunk", "model"]);
  assert.deepEqual(f.modelCalls, [ids.model]);
  assert.equal(result.model, f.modelValue);
});

test("RAGCHUNK-MODELREAD-READ-002 missing/error model evidence fails closed without search provider or fallback", async () => {
  const missing = fixture({model: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["chunk", "model"]);
  assert.deepEqual(missing.modelCalls, [ids.model]);

  const expected = new Error("model-catalog-unavailable");
  const broken = fixture({modelError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["chunk", "model"]);
  assert.deepEqual(broken.modelCalls, [ids.model]);
});

test("RAGCHUNK-MODELREAD-FLOOR-001 exact ACTIVE model id with sufficient ceiling passes", async () => {
  const f = fixture({
    chunk: chunk({sensitivityClass: "SENSITIVE_PERSONAL"}),
    model: model({sensitivityCeiling: "REGULATED"}),
  });
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.chunk, f.chunkValue);
  assert.equal(result.model, f.modelValue);
  assert.equal(result.model.status, "ACTIVE");
});

test("RAGCHUNK-MODELREAD-FLOOR-002 wrong id status sensitivity or malformed relevant evidence fails closed", async () => {
  const cases = [
    {model: model({id: ids.otherModel})},
    {model: model({status: "active"})},
    {model: model({status: "ACTIVE "})},
    {chunk: chunk({sensitivityClass: "REGULATED"}), model: model({sensitivityCeiling: "INTERNAL"})},
    {chunk: chunk({sensitivityClass: "UNKNOWN"})},
    {model: model({sensitivityCeiling: "UNKNOWN"})},
    {chunk: chunk({embeddingModelId: "not-a-uuid"})},
    {model: model({id: "not-a-uuid"})},
  ];

  for (const candidate of cases) {
    const f = fixture(candidate);
    assert.equal(await load(f), null);
    assert.equal(f.modelCalls.length, 1);
  }
});

test("RAGCHUNK-MODELREAD-EVID-001 success is frozen and preserves exact chunk/model raw evidence references", async () => {
  const f = fixture();
  const before = JSON.stringify([f.chunkValue, f.modelValue]);

  const result = await load(f);
  assert.ok(result);
  assert.deepEqual(f.order, ["chunk", "model"]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.chunk, f.chunkValue);
  assert.equal(result.model, f.modelValue);
  assert.equal(result.chunk.sourceId, ids.source);
  assert.equal(result.chunk.aclProjection.deny, true);
  assert.equal(result.chunk.embeddingVersion, "embed-v99");
  assert.equal(result.model.providerId, ids.provider);
  assert.equal(result.model.residencyRegions[0], "OTHER");
  assert.equal(result.model.version, 99);
  assert.equal(JSON.stringify([f.chunkValue, f.modelValue]), before);
});

test("RAGCHUNK-MODELREAD-BOUND-001 evidence grants no source document ACL provider compatibility retrieval grounding routing execution mutation or event authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "source",
    "sourceCurrent",
    "document",
    "documentCurrent",
    "aclEntries",
    "aclEffect",
    "authorized",
    "accessAllowed",
    "provider",
    "providerCurrent",
    "providerCompatible",
    "capabilityCompatible",
    "modalityCompatible",
    "residencyCompatible",
    "embeddingVersionCompatible",
    "route",
    "selectedModel",
    "vector",
    "search",
    "retrievalAuthorized",
    "ranked",
    "grounded",
    "executionAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
