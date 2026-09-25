import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIRAGChunkEmbeddingModelEligibilityFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  chunk: "11111111-1111-4111-8111-111111111111",
  source: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  model: "55555555-5555-4555-8555-555555555555",
  otherModel: "66666666-6666-4666-8666-666666666666",
  provider: "77777777-7777-4777-8777-777777777777",
});

const baseChunk = Object.freeze({
  id: ids.chunk,
  sourceId: ids.source,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  scopeClass: "TENANT_INDUSTRY",
  chunkOrdinal: 0,
  textRefOrEncryptedText: "opaque",
  contentHash: "hash",
  tokenCount: 12,
  aclProjection: Object.freeze({raw: true}),
  sensitivityClass: "CONFIDENTIAL",
  residencyRegion: "IN-CENTRAL",
  retentionClass: "STANDARD",
  embeddingModelId: ids.model,
  embeddingVersion: "v1",
  metadata: Object.freeze({raw: true}),
  createdAt: "2026-09-25T00:00:00.000Z",
});

const baseModel = Object.freeze({
  id: ids.model,
  providerId: ids.provider,
  modelCode: "embed-v1",
  displayName: "Embedding model",
  capabilities: Object.freeze(["EMBEDDING"]),
  contextWindowClass: "STANDARD",
  inputModalities: Object.freeze(["TEXT"]),
  outputModalities: Object.freeze(["EMBEDDING"]),
  residencyRegions: Object.freeze(["IN-CENTRAL"]),
  sensitivityCeiling: "REGULATED",
  costClass: "STANDARD",
  latencyClass: "STANDARD",
  status: "ACTIVE",
  version: 1,
  metadata: Object.freeze({raw: true}),
});

function chunk(overrides = {}) {
  return Object.freeze({...baseChunk, ...overrides});
}

function model(overrides = {}) {
  return Object.freeze({...baseModel, ...overrides});
}

test("RAGCHUNK-MODEL-CUR-001 exact ACTIVE model id with sufficient ceiling passes", () => {
  assert.equal(
    matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk(), model()),
    true,
  );
});

test("RAGCHUNK-MODEL-CUR-002 missing model evidence or wrong model id fails closed", () => {
  assert.equal(matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk()), false);
  assert.equal(
    matchesAIRAGChunkEmbeddingModelEligibilityFloors(
      chunk(),
      model({id: ids.otherModel}),
    ),
    false,
  );
});

test("RAGCHUNK-MODEL-CUR-003 raw status must equal ACTIVE exactly", () => {
  for (const status of ["INACTIVE", "RETIRED", "active", "ACTIVE ", " ACTIVE"]) {
    assert.equal(
      matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk(), model({status})),
      false,
      status,
    );
  }
  assert.equal(
    matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk(), model({status: "ACTIVE"})),
    true,
  );
});

test("RAGCHUNK-MODEL-CUR-004 all known sensitivity pairs follow ceiling-rank >= chunk-rank", () => {
  const classes = ["PUBLIC","INTERNAL","CONFIDENTIAL","SENSITIVE_PERSONAL","REGULATED"];
  for (let chunkIndex = 0; chunkIndex < classes.length; chunkIndex += 1) {
    for (let modelIndex = 0; modelIndex < classes.length; modelIndex += 1) {
      assert.equal(
        matchesAIRAGChunkEmbeddingModelEligibilityFloors(
          chunk({sensitivityClass: classes[chunkIndex]}),
          model({sensitivityCeiling: classes[modelIndex]}),
        ),
        modelIndex >= chunkIndex,
        classes[modelIndex] + " >= " + classes[chunkIndex],
      );
    }
  }
});

test("RAGCHUNK-MODEL-CUR-005 unknown chunk or model sensitivity fails closed", () => {
  assert.equal(
    matchesAIRAGChunkEmbeddingModelEligibilityFloors(
      chunk({sensitivityClass: "UNKNOWN"}),
      model(),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGChunkEmbeddingModelEligibilityFloors(
      chunk(),
      model({sensitivityCeiling: "UNKNOWN"}),
    ),
    false,
  );
});

test("RAGCHUNK-MODEL-CUR-006 malformed relevant chunk/model identity/status shape fails closed", () => {
  for (const candidate of [
    chunk({id: "bad"}),
    chunk({embeddingModelId: "bad"}),
  ]) {
    assert.equal(
      matchesAIRAGChunkEmbeddingModelEligibilityFloors(candidate, model()),
      false,
    );
  }

  for (const candidateModel of [
    model({id: "bad"}),
    model({status: null}),
  ]) {
    assert.equal(
      matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk(), candidateModel),
      false,
    );
  }
});

test("RAGCHUNK-MODEL-CUR-007 provider/capability/modality/residency/cost/latency/version metadata are not inputs", () => {
  const rawModel = model({
    providerId: "not-interpreted",
    modelCode: "",
    displayName: "",
    capabilities: Object.freeze([null, "UNRELATED"]),
    contextWindowClass: "",
    inputModalities: Object.freeze([null]),
    outputModalities: Object.freeze(["UNRELATED"]),
    residencyRegions: Object.freeze([""]),
    costClass: "",
    latencyClass: "",
    version: -999,
    metadata: Object.freeze({routing: "not-interpreted"}),
  });
  assert.equal(
    matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk(), rawModel),
    true,
  );
});

test("RAGCHUNK-MODEL-CUR-008 unrelated chunk fields stay uninterpreted and inputs remain unchanged", () => {
  const rawChunk = Object.freeze({
    ...chunk(),
    sourceId: "not-interpreted",
    tenantId: "not-interpreted",
    industryContextId: "not-interpreted",
    scopeClass: "UNKNOWN",
    chunkOrdinal: -999,
    textRefOrEncryptedText: "",
    contentHash: "",
    tokenCount: -1,
    aclProjection: Object.freeze({deny: true}),
    residencyRegion: "",
    retentionClass: "",
    embeddingVersion: "",
    metadata: Object.freeze({raw: Object.freeze(["x"])}),
    createdAt: "not-interpreted",
  });
  const rawModel = model();
  const beforeChunk = JSON.stringify(rawChunk);
  const beforeModel = JSON.stringify(rawModel);

  assert.equal(
    matchesAIRAGChunkEmbeddingModelEligibilityFloors(rawChunk, rawModel),
    true,
  );
  assert.equal(JSON.stringify(rawChunk), beforeChunk);
  assert.equal(JSON.stringify(rawModel), beforeModel);
});
