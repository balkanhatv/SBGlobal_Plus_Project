import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIRAGChunkSourceBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  chunk: "11111111-1111-4111-8111-111111111111",
  source: "22222222-2222-4222-8222-222222222222",
  otherSource: "33333333-3333-4333-8333-333333333333",
  tenant: "44444444-4444-4444-8444-444444444444",
  otherTenant: "55555555-5555-4555-8555-555555555555",
  industry: "66666666-6666-4666-8666-666666666666",
  otherIndustry: "77777777-7777-4777-8777-777777777777",
  embeddingModel: "88888888-8888-4888-8888-888888888888",
});

const baseChunk = Object.freeze({
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
  embeddingModelId: ids.embeddingModel,
  embeddingVersion: "v1",
  metadata: Object.freeze({raw: true}),
  createdAt: "2026-09-25T00:00:00.000Z",
});

const baseSource = Object.freeze({
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
  aclPolicyRef: "acl:raw",
  status: "ACTIVE",
  sourceVersion: "9",
  chunkingPolicyVersion: "raw-v1",
  createdAt: "2026-09-24T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
});

function chunk(overrides = {}) {
  return Object.freeze({...baseChunk, ...overrides});
}

function source(overrides = {}) {
  return Object.freeze({...baseSource, ...overrides});
}

test("RAGCHUNK-SRC-CUR-001 exact Tenant-Industry and Tenant-Core bindings pass", () => {
  assert.equal(matchesAIRAGChunkSourceBindingFloors(chunk(), source()), true);

  const coreChunk = chunk({industryContextId: undefined, scopeClass: "TENANT_CORE"});
  const coreSource = source({industryContextId: undefined, scopeClass: "TENANT_CORE"});
  assert.equal(matchesAIRAGChunkSourceBindingFloors(coreChunk, coreSource), true);
});

test("RAGCHUNK-SRC-CUR-002 missing source evidence or wrong parent id fails closed", () => {
  assert.equal(matchesAIRAGChunkSourceBindingFloors(chunk()), false);
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(chunk(), source({id: ids.otherSource})),
    false,
  );
});

test("RAGCHUNK-SRC-CUR-003 Tenant, null-safe Industry and scope mismatches fail closed", () => {
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(chunk(), source({tenantId: ids.otherTenant})),
    false,
  );
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(chunk(), source({industryContextId: ids.otherIndustry})),
    false,
  );
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(
      chunk(),
      source({industryContextId: undefined, scopeClass: "TENANT_CORE"}),
    ),
    false,
  );
});

test("RAGCHUNK-SRC-CUR-004 residency equality is exact without normalization", () => {
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(chunk(), source({residencyRegion: "in-central"})),
    false,
  );
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(chunk(), source({residencyRegion: "IN-CENTRAL "})),
    false,
  );
});

test("RAGCHUNK-SRC-CUR-005 retention equality is exact without normalization", () => {
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(chunk(), source({retentionClass: "standard"})),
    false,
  );
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(chunk(), source({retentionClass: "STANDARD "})),
    false,
  );
});

test("RAGCHUNK-SRC-CUR-006 all known sensitivity pairs follow chunk-rank >= source-rank", () => {
  const classes = ["PUBLIC","INTERNAL","CONFIDENTIAL","SENSITIVE_PERSONAL","REGULATED"];
  for (let ci = 0; ci < classes.length; ci += 1) {
    for (let si = 0; si < classes.length; si += 1) {
      assert.equal(
        matchesAIRAGChunkSourceBindingFloors(
          chunk({sensitivityClass: classes[ci]}),
          source({sensitivityClass: classes[si]}),
        ),
        ci >= si,
        classes[ci] + " >= " + classes[si],
      );
    }
  }
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(
      chunk({sensitivityClass: "UNKNOWN"}),
      source(),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(
      chunk(),
      source({sensitivityClass: "UNKNOWN"}),
    ),
    false,
  );
});

test("RAGCHUNK-SRC-CUR-007 malformed relevant chunk/source shape fails closed", () => {
  for (const candidate of [
    chunk({id: "bad"}),
    chunk({sourceId: "bad"}),
    chunk({tenantId: "bad"}),
    chunk({industryContextId: "bad"}),
    chunk({scopeClass: "TENANT_CORE"}),
    chunk({residencyRegion: 7}),
    chunk({retentionClass: 7}),
  ]) {
    assert.equal(matchesAIRAGChunkSourceBindingFloors(candidate, source()), false);
  }

  for (const candidate of [
    source({id: "bad"}),
    source({tenantId: "bad"}),
    source({industryContextId: "bad"}),
    source({scopeClass: "TENANT_CORE"}),
    source({residencyRegion: 7}),
    source({retentionClass: 7}),
  ]) {
    assert.equal(matchesAIRAGChunkSourceBindingFloors(chunk(), candidate), false);
  }
});

test("RAGCHUNK-SRC-CUR-008 unrelated chunk/source semantics stay uninterpreted and inputs remain unchanged", () => {
  const candidateChunk = Object.freeze({
    ...chunk(),
    chunkOrdinal: -999,
    textRefOrEncryptedText: "",
    contentHash: "",
    tokenCount: -1,
    aclProjection: Object.freeze({deny: true}),
    embeddingModelId: "not-interpreted",
    embeddingVersion: "",
    metadata: Object.freeze({raw: Object.freeze(["x"])}),
    createdAt: "not-interpreted",
  });
  const candidateSource = Object.freeze({
    ...source(),
    sourceModule: "",
    managementSystemId: "",
    resourceType: "",
    resourceId: "",
    documentId: "not-interpreted",
    documentVersion: -999,
    aclPolicyRef: "",
    status: "RETIRED",
    sourceVersion: "",
    chunkingPolicyVersion: "",
    createdAt: "not-interpreted",
    updatedAt: "not-interpreted",
  });
  const beforeChunk = JSON.stringify(candidateChunk);
  const beforeSource = JSON.stringify(candidateSource);

  assert.equal(
    matchesAIRAGChunkSourceBindingFloors(candidateChunk, candidateSource),
    true,
  );
  assert.equal(JSON.stringify(candidateChunk), beforeChunk);
  assert.equal(JSON.stringify(candidateSource), beforeSource);
});
