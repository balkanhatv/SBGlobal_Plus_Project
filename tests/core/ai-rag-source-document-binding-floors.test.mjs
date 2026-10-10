import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIRAGSourceDocumentBindingFloors,
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
  owner: "99999999-9999-4999-8999-999999999999",
});

const baseSource = Object.freeze({
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
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:01.000Z",
});

const baseDocument = Object.freeze({
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
  ownerPrincipalId: ids.owner,
  sensitivityClass: "INTERNAL",
  residencyRegion: "IN-CENTRAL",
  status: "ACTIVE",
  virusScanStatus: "CLEAN",
  versionNo: 7,
});

function source(overrides = {}) {
  return Object.freeze({...baseSource, ...overrides});
}

function document(overrides = {}) {
  return Object.freeze({...baseDocument, ...overrides});
}

test("RAGSRC-DOC-CUR-001 unbound source requires absent version and no Document evidence", () => {
  const unbound = source({documentId: undefined, documentVersion: undefined});
  assert.equal(matchesAIRAGSourceDocumentBindingFloors(unbound), true);
  assert.equal(matchesAIRAGSourceDocumentBindingFloors(unbound, document()), false);
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source({documentId: undefined, documentVersion: 7}),
    ),
    false,
  );
});

test("RAGSRC-DOC-CUR-002 exact Tenant-Industry and Tenant-Core bindings pass", () => {
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(source(), document()),
    true,
  );

  const coreSource = source({
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
  const coreDocument = document({
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(coreSource, coreDocument),
    true,
  );
});

test("RAGSRC-DOC-CUR-003 missing evidence, wrong Document id or wrong version fails", () => {
  assert.equal(matchesAIRAGSourceDocumentBindingFloors(source()), false);
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({id: ids.otherDocument}),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({versionNo: 8}),
    ),
    false,
  );
});

test("RAGSRC-DOC-CUR-004 Tenant, null-safe Industry and scope mismatches fail closed", () => {
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({tenantId: ids.otherTenant}),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({industryContextId: ids.otherIndustry}),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({industryContextId: undefined, scopeClass: "TENANT_CORE"}),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source({industryContextId: undefined, scopeClass: "TENANT_CORE"}),
      document(),
    ),
    false,
  );
});

test("RAGSRC-DOC-CUR-005 referenced Document must remain raw ACTIVE and CLEAN", () => {
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({status: "QUARANTINED"}),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({virusScanStatus: "INFECTED"}),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(source(), document()),
    true,
  );
});

test("RAGSRC-DOC-CUR-006 residency equality is exact without normalization", () => {
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({residencyRegion: "IN-CENTRAL"}),
    ),
    true,
  );
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({residencyRegion: "in-central"}),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({residencyRegion: "IN-CENTRAL "}),
    ),
    false,
  );
});

test("RAGSRC-DOC-CUR-007 all known sensitivity pairs follow source-rank >= document-rank", () => {
  const classes = [
    "PUBLIC",
    "INTERNAL",
    "CONFIDENTIAL",
    "SENSITIVE_PERSONAL",
    "REGULATED",
  ];
  for (let sourceRank = 0; sourceRank < classes.length; sourceRank += 1) {
    for (let documentRank = 0; documentRank < classes.length; documentRank += 1) {
      assert.equal(
        matchesAIRAGSourceDocumentBindingFloors(
          source({sensitivityClass: classes[sourceRank]}),
          document({sensitivityClass: classes[documentRank]}),
        ),
        sourceRank >= documentRank,
        `${classes[sourceRank]} source vs ${classes[documentRank]} document`,
      );
    }
  }

  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source({sensitivityClass: "UNKNOWN"}),
      document(),
    ),
    false,
  );
  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(
      source(),
      document({sensitivityClass: "UNKNOWN"}),
    ),
    false,
  );
});

test("RAGSRC-DOC-CUR-008 malformed relevant shape fails; unrelated semantics stay uninterpreted without mutation", () => {
  for (const candidateSource of [
    source({id: "bad"}),
    source({tenantId: "bad"}),
    source({industryContextId: "bad"}),
    source({scopeClass: "UNKNOWN"}),
    source({documentId: "bad"}),
    source({documentVersion: 0}),
    source({documentVersion: Number.NaN}),
  ]) {
    assert.equal(
      matchesAIRAGSourceDocumentBindingFloors(candidateSource, document()),
      false,
    );
  }

  for (const candidateDocument of [
    document({id: "bad"}),
    document({tenantId: "bad"}),
    document({industryContextId: "bad"}),
    document({scopeClass: "UNKNOWN"}),
    document({versionNo: 0}),
  ]) {
    assert.equal(
      matchesAIRAGSourceDocumentBindingFloors(source(), candidateDocument),
      false,
    );
  }

  const rawSource = source({
    sourceModule: "",
    managementSystemId: "",
    resourceType: "",
    resourceId: "",
    retentionClass: "",
    aclPolicyRef: "",
    status: "RETIRED",
    sourceVersion: "not-interpreted",
    chunkingPolicyVersion: "",
    createdAt: "not-interpreted",
    updatedAt: "also-not-interpreted",
  });
  const rawDocument = document({
    sourceModule: "",
    sourceResourceType: "",
    sourceResourceId: "",
    filenameDisplay: "",
    mediaType: "",
    storageObjectId: "not-interpreted",
    ownerPrincipalId: "not-interpreted",
  });
  const beforeSource = JSON.stringify(rawSource);
  const beforeDocument = JSON.stringify(rawDocument);

  assert.equal(
    matchesAIRAGSourceDocumentBindingFloors(rawSource, rawDocument),
    true,
  );
  assert.equal(JSON.stringify(rawSource), beforeSource);
  assert.equal(JSON.stringify(rawDocument), beforeDocument);
});
