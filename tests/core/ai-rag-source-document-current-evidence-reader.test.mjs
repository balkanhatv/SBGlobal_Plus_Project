import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIRAGSourceDocumentCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  source: "11111111-1111-4111-8111-111111111111",
  document: "22222222-2222-4222-8222-222222222222",
  otherDocument: "33333333-3333-4333-8333-333333333333",
  tenant: "44444444-4444-4444-8444-444444444444",
  otherTenant: "55555555-5555-4555-8555-555555555555",
  industry: "66666666-6666-4666-8666-666666666666",
  otherIndustry: "77777777-7777-4777-8777-777777777777",
  storage: "88888888-8888-4888-8888-888888888888",
  principal: "99999999-9999-4999-8999-999999999999",
  membership: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  correlation: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-rag-document",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-rag-document",
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

function source(overrides = {}) {
  return Object.freeze({
    id: ids.source,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    sourceModule: "Retail",
    managementSystemId: "RTL-OMS",
    resourceType: "ORDER",
    resourceId: "order-001",
    documentId: ids.document,
    documentVersion: 7,
    sensitivityClass: "CONFIDENTIAL",
    residencyRegion: "IN-CENTRAL",
    retentionClass: "RAG_STANDARD",
    aclPolicyRef: "acl://raw",
    status: "REGISTERED",
    sourceVersion: "11",
    chunkingPolicyVersion: "chunk-v2",
    createdAt: "2026-10-07T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:01.000Z",
    ...overrides,
  });
}

function document(overrides = {}) {
  return Object.freeze({
    id: ids.document,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    sourceModule: "Documents",
    sourceResourceType: "CaseFile",
    sourceResourceId: "case-001",
    filenameDisplay: "case.pdf",
    mediaType: "application/pdf",
    storageObjectId: ids.storage,
    ownerPrincipalId: ids.principal,
    sensitivityClass: "INTERNAL",
    residencyRegion: "IN-CENTRAL",
    status: "ACTIVE",
    virusScanStatus: "CLEAN",
    versionNo: 7,
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const sourceCalls = [];
  const documentCalls = [];
  const sourceValue = Object.hasOwn(overrides, "source")
    ? overrides.source
    : source();
  const documentValue = Object.hasOwn(overrides, "document")
    ? overrides.document
    : document();

  return {
    order,
    sourceCalls,
    documentCalls,
    sourceValue,
    documentValue,
    sourceReader: {
      async loadForContext(input) {
        order.push("source");
        sourceCalls.push(input);
        if (overrides.sourceError) throw overrides.sourceError;
        return sourceValue;
      },
    },
    documentReader: {
      async loadForContext(input) {
        order.push("document");
        documentCalls.push(input);
        if (overrides.documentError) throw overrides.documentError;
        return documentValue;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadAIRAGSourceDocumentCurrentEvidence(
    {
      requestContext: context(),
      ragSourceId: ids.source,
      ...inputOverrides,
    },
    f.sourceReader,
    f.documentReader,
  );
}

test("RAGSRC-DOCREAD-BASE-001 exact RAGSource is loaded first with unchanged context/id", async () => {
  const f = fixture();
  const current = context();
  const result = await load(f, {requestContext: current});

  assert.ok(result);
  assert.equal(f.order[0], "source");
  assert.equal(f.sourceCalls.length, 1);
  assert.equal(f.sourceCalls[0].requestContext, current);
  assert.equal(f.sourceCalls[0].ragSourceId, ids.source);
  assert.equal(result.source, f.sourceValue);
});

test("RAGSRC-DOCREAD-BASE-002 source null/errors precede every Document metadata read", async () => {
  const hidden = fixture({source: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["source"]);
  assert.equal(hidden.documentCalls.length, 0);

  const expected = new Error("rag-source-unavailable");
  const broken = fixture({sourceError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["source"]);
  assert.equal(broken.documentCalls.length, 0);
});

test("RAGSRC-DOCREAD-BRANCH-001 unbound source performs zero Document reads and returns frozen source-only evidence", async () => {
  const f = fixture({
    source: source({documentId: undefined, documentVersion: undefined}),
  });
  const result = await load(f);

  assert.ok(result);
  assert.deepEqual(f.order, ["source"]);
  assert.equal(f.documentCalls.length, 0);
  assert.equal(result.source, f.sourceValue);
  assert.equal("document" in result, false);
  assert.equal(Object.isFrozen(result), true);
});

test("RAGSRC-DOCREAD-READ-001 bound source performs one exact same-context Document read", async () => {
  const f = fixture();
  const current = context();
  const result = await load(f, {requestContext: current});

  assert.ok(result);
  assert.deepEqual(f.order, ["source", "document"]);
  assert.equal(f.documentCalls.length, 1);
  assert.equal(f.documentCalls[0].requestContext, current);
  assert.equal(f.documentCalls[0].documentId, ids.document);
});

test("RAGSRC-DOCREAD-READ-002 missing/error Document evidence fails closed without retry search or fallback", async () => {
  const missing = fixture({document: null});
  assert.equal(await load(missing), null);
  assert.equal(missing.documentCalls.length, 1);
  assert.equal(missing.documentCalls[0].documentId, ids.document);

  const expected = new Error("document-metadata-unavailable");
  const broken = fixture({documentError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.equal(broken.documentCalls.length, 1);
  assert.equal(broken.documentCalls[0].documentId, ids.document);
});

test("RAGSRC-DOCREAD-FLOOR-001 exact DD-193 Tenant-Industry and Tenant-Core relationship evidence passes", async () => {
  const industry = fixture();
  const industryResult = await load(industry);
  assert.ok(industryResult);
  assert.equal(industryResult.source, industry.sourceValue);
  assert.equal(industryResult.document, industry.documentValue);

  const core = fixture({
    source: source({industryContextId: undefined, scopeClass: "TENANT_CORE"}),
    document: document({industryContextId: undefined, scopeClass: "TENANT_CORE"}),
  });
  const coreResult = await load(core, {
    requestContext: context({
      industryContextId: undefined,
      scopeClass: "TENANT_CORE",
    }),
  });
  assert.ok(coreResult);
  assert.equal(coreResult.source, core.sourceValue);
  assert.equal(coreResult.document, core.documentValue);
});

test("RAGSRC-DOCREAD-FLOOR-002 wrong malformed mismatched or unsafe DD-193 evidence fails closed", async () => {
  const cases = [
    {document: document({id: ids.otherDocument})},
    {document: document({versionNo: 8})},
    {document: document({tenantId: ids.otherTenant})},
    {document: document({industryContextId: ids.otherIndustry})},
    {document: document({status: "QUARANTINED"})},
    {document: document({virusScanStatus: "INFECTED"})},
    {document: document({residencyRegion: "US"})},
    {document: document({sensitivityClass: "REGULATED"})},
    {source: source({documentVersion: 0})},
  ];

  for (const candidate of cases) {
    const f = fixture(candidate);
    assert.equal(await load(f), null);
    assert.equal(f.documentCalls.length, 1);
    assert.equal(f.documentCalls[0].documentId, ids.document);
  }
});

test("RAGSRC-DOCREAD-EVID-001 success is frozen and preserves exact source/document/raw metadata references", async () => {
  const f = fixture();
  const before = JSON.stringify([f.sourceValue, f.documentValue]);

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.source, f.sourceValue);
  assert.equal(result.document, f.documentValue);
  assert.equal(result.source.aclPolicyRef, "acl://raw");
  assert.equal(result.source.status, "REGISTERED");
  assert.equal(result.source.chunkingPolicyVersion, "chunk-v2");
  assert.equal(result.document.sourceResourceId, "case-001");
  assert.equal(JSON.stringify([f.sourceValue, f.documentValue]), before);
});

test("RAGSRC-DOCREAD-BOUND-001 evidence grants no ACL storage retrieval grounding routing execution mutation or event authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "aclEntries",
    "aclEffect",
    "authorized",
    "accessAllowed",
    "storageBinding",
    "objectKey",
    "signedUrl",
    "sourceResourceAuthorized",
    "sourceCurrent",
    "chunks",
    "chunkingAuthorized",
    "embeddingEligible",
    "retrievalAuthorized",
    "ranked",
    "grounded",
    "provider",
    "model",
    "route",
    "executionAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
