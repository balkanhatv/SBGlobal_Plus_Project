import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAccessAclCurrentEffectEvidenceError,
  loadAIRAGChunkBoundDocumentAclCurrentEffectEvidence,
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
  storage: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  acl1: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  acl2: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
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
    storageObjectId: ids.storage,
    ownerPrincipalId: ids.principal,
    sensitivityClass: "PUBLIC",
    residencyRegion: "IN-CENTRAL",
    status: "ACTIVE",
    virusScanStatus: "CLEAN",
    versionNo: 2,
    ...overrides,
  });
}

function acl(overrides = {}) {
  return Object.freeze({
    id: ids.acl1,
    documentId: ids.document,
    subjectType: "PRINCIPAL",
    subjectId: ids.principal,
    permission: "VIEW",
    effect: "ALLOW",
    createdAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const calls = {
    chunk: [], model: [], provider: [], source: [], document: [], acl: [],
  };

  const lineageDocument = Object.hasOwn(overrides, "lineageDocument")
    ? overrides.lineageDocument
    : document();
  const aclDocument = Object.hasOwn(overrides, "aclDocument")
    ? overrides.aclDocument
    : lineageDocument;

  const values = {
    chunk: Object.hasOwn(overrides, "chunk") ? overrides.chunk : chunk(),
    model: Object.hasOwn(overrides, "model") ? overrides.model : model(),
    provider: Object.hasOwn(overrides, "provider") ? overrides.provider : provider(),
    source: Object.hasOwn(overrides, "source") ? overrides.source : source(),
    lineageDocument,
    aclDocument,
    aclEntries: Object.hasOwn(overrides, "aclEntries")
      ? overrides.aclEntries
      : Object.freeze([acl()]),
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
        order.push("document");
        calls.document.push(input);
        if (overrides.documentErrorAt === calls.document.length) {
          throw overrides.documentError ?? new Error("document-failed");
        }
        return calls.document.length === 1
          ? values.lineageDocument
          : values.aclDocument;
      },
    },
    aclReader: {
      async loadForDocument(input) {
        order.push("acl"); calls.acl.push(input);
        if (overrides.aclError) throw overrides.aclError;
        return values.aclEntries;
      },
    },
  };

  return {order, calls, values, readers};
}

async function load(f, inputOverrides = {}) {
  return loadAIRAGChunkBoundDocumentAclCurrentEffectEvidence(
    {
      requestContext: requestContext(),
      ragChunkId: ids.chunk,
      documentAclPermission: "VIEW",
      currentTimeIso: "2026-10-07T12:00:00.000Z",
      ...inputOverrides,
    },
    f.readers.chunkReader,
    f.readers.modelReader,
    f.readers.providerReader,
    f.readers.sourceReader,
    f.readers.documentReader,
    f.readers.aclReader,
  );
}

test("RAGCHUNK-DOCACL-BASE-001 exact DD-647 parent executes first with exact inputs/dependencies", async () => {
  const f = fixture();
  const ctx = requestContext();
  const result = await load(f, {requestContext: ctx});

  assert.ok(result);
  assert.deepEqual(f.order, [
    "chunk", "model", "provider", "source", "document", "document", "acl",
  ]);
  assert.equal(f.calls.chunk[0].requestContext, ctx);
  assert.equal(f.calls.source[0].requestContext, ctx);
  assert.equal(f.calls.document[0].requestContext, ctx);
  assert.equal(result.parent.parent.parent.chunk, f.values.chunk);
  assert.equal(result.parent.source, f.values.source);
  assert.equal(result.parent.document, f.values.lineageDocument);
});

test("RAGCHUNK-DOCACL-BASE-002 DD-647 null/error short-circuits or propagates before ACL-layer access", async () => {
  const hidden = fixture({chunk: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["chunk"]);
  assert.equal(hidden.calls.acl.length, 0);

  const expected = new Error("provider-failed");
  const broken = fixture({providerError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["chunk", "model", "provider"]);
  assert.equal(broken.calls.acl.length, 0);
});

test("RAGCHUNK-DOCACL-BRANCH-001 unbound source performs zero DD-562 metadata/ACL reads and preserves parent-only evidence", async () => {
  const unbound = source({documentId: undefined, documentVersion: undefined});
  const f = fixture({source: unbound, lineageDocument: null, aclDocument: null});
  const result = await load(f);

  assert.ok(result);
  assert.deepEqual(f.order, ["chunk", "model", "provider", "source"]);
  assert.equal(f.calls.document.length, 0);
  assert.equal(f.calls.acl.length, 0);
  assert.equal("documentAcl" in result, false);
  assert.equal(result.parent.source, unbound);
  assert.equal(Object.isFrozen(result), true);
});

test("RAGCHUNK-DOCACL-READ-001 bound source invokes DD-562 once with exact context document permission and current instant", async () => {
  const f = fixture();
  const ctx = requestContext();
  const result = await load(f, {
    requestContext: ctx,
    documentAclPermission: "VIEW",
    currentTimeIso: "2026-10-07T12:34:56.000Z",
  });

  assert.ok(result);
  assert.equal(f.calls.document.length, 2);
  assert.equal(f.calls.document[1].requestContext, ctx);
  assert.equal(f.calls.document[1].documentId, ids.document);
  assert.equal(f.calls.acl.length, 1);
  assert.equal(f.calls.acl[0].requestContext, ctx);
  assert.equal(f.calls.acl[0].documentId, ids.document);
  assert.equal(result.documentAcl.parent.permission, "VIEW");
  assert.equal(result.documentAcl.currentTimeIso, "2026-10-07T12:34:56.000Z");
});

test("RAGCHUNK-DOCACL-READ-002 DD-562 errors propagate unchanged with no permission inference retry lookup or fallback", async () => {
  const expected = new Error("acl-failed");
  const dependency = fixture({aclError: expected});
  await assert.rejects(load(dependency), error => error === expected);
  assert.equal(dependency.calls.document.length, 2);
  assert.equal(dependency.calls.acl.length, 1);

  const invalidTime = fixture();
  await assert.rejects(
    load(invalidTime, {currentTimeIso: "not-a-time"}),
    error => error instanceof DocumentAccessAclCurrentEffectEvidenceError
      && error.code === "ACL_EFFECT_TIME_INVALID",
  );
  assert.equal(invalidTime.calls.acl.length, 1);
});

test("RAGCHUNK-DOCACL-BIND-001 exact re-read Document identity version and security continuity passes", async () => {
  const f = fixture();
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.documentAcl.parent.candidate.documentId, f.values.lineageDocument.id);
  assert.equal(result.documentAcl.parent.candidate.versionNo, f.values.lineageDocument.versionNo);
  assert.equal(result.documentAcl.parent.candidate.tenantId, f.values.lineageDocument.tenantId);
  assert.equal(result.documentAcl.parent.candidate.industryContextId, f.values.lineageDocument.industryContextId);
  assert.equal(result.documentAcl.parent.candidate.scopeClass, f.values.lineageDocument.scopeClass);
  assert.equal(result.documentAcl.parent.candidate.sensitivityClass, f.values.lineageDocument.sensitivityClass);
  assert.equal(result.documentAcl.parent.candidate.residencyRegion, f.values.lineageDocument.residencyRegion);
});

test("RAGCHUNK-DOCACL-BIND-002 relevant re-read Document continuity mismatch fails closed", async () => {
  for (const aclDocument of [
    document({versionNo: 3}),
    document({sensitivityClass: "INTERNAL"}),
    document({residencyRegion: "IN-SOUTH"}),
  ]) {
    const f = fixture({aclDocument});
    assert.equal(await load(f), null);
    assert.equal(f.calls.document.length, 2);
    assert.equal(f.calls.acl.length, 1);
  }
});

test("RAGCHUNK-DOCACL-EFFECT-001 preserves DD-562 effect evidence without converting ALLOW into retrieval authority", async () => {
  const entries = Object.freeze([
    acl({id: ids.acl1, effect: "ALLOW"}),
    acl({
      id: ids.acl2,
      effect: "DENY",
      validUntil: "2026-10-08T00:00:00.000Z",
    }),
  ]);
  const f = fixture({aclEntries: entries});
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.documentAcl.effectEvidence, "DENY");
  assert.equal(result.documentAcl.currentEntries.length, 2);
  assert.equal(result.documentAcl.expiredEntries.length, 0);
  assert.equal("retrievalAuthorized" in result, false);
  assert.equal("accessAllowed" in result, false);
});

test("RAGCHUNK-DOCACL-EVID-001 success preserves exact DD-647 parent and exact DD-562 envelope references without mutation", async () => {
  const f = fixture();
  const before = JSON.stringify([
    f.values.chunk,
    f.values.model,
    f.values.provider,
    f.values.source,
    f.values.lineageDocument,
    f.values.aclEntries,
  ]);
  const result = await load(f);

  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.parent), true);
  assert.equal(Object.isFrozen(result.documentAcl), true);
  assert.equal(result.parent.parent.parent.chunk, f.values.chunk);
  assert.equal(result.parent.parent.provider, f.values.provider);
  assert.equal(result.parent.source, f.values.source);
  assert.equal(result.parent.document, f.values.lineageDocument);
  assert.equal(
    JSON.stringify([
      f.values.chunk,
      f.values.model,
      f.values.provider,
      f.values.source,
      f.values.lineageDocument,
      f.values.aclEntries,
    ]),
    before,
  );
});

test("RAGCHUNK-DOCACL-BOUND-001 output exposes no inferred permission mapping source fallback full access retrieval grounding routing inference mutation or event authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "ragPermission",
    "permissionMapping",
    "sourceResourceFallback",
    "authorized",
    "authorizationDecision",
    "accessAllowed",
    "retrievalAuthorized",
    "vectorSearchAuthorized",
    "rankedChunks",
    "rerankedChunks",
    "groundingSatisfied",
    "citationAuthorized",
    "promptInjectionSafe",
    "routeDecision",
    "routingAuthorized",
    "inferenceAuthorized",
    "executionAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
