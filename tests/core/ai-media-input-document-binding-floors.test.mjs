import test from "node:test";
import assert from "node:assert/strict";
import { matchesAIMediaRequestInputDocumentBindingFloors as matches } from "../../dist/core/index.js";

const ids = Object.freeze({
  request: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  document: "44444444-4444-4444-8444-444444444444",
  second: "55555555-5555-4555-8555-555555555555",
  foreign: "66666666-6666-4666-8666-666666666666",
});
const request = (overrides = {}) => Object.freeze({
  id: ids.request, tenantId: ids.tenant, industryContextId: ids.industry,
  principalId: ids.foreign, capabilityCode: "media.generate", mediaType: "IMAGE",
  inputDocumentRefs: Object.freeze([ids.document]), sensitivityClass: "CONFIDENTIAL",
  residencyRequirement: "IN", moderationPolicyRef: "opaque", status: "QUEUED",
  createdAt: "2026-09-25T10:00:00.000Z", ...overrides,
});
const doc = (overrides = {}) => Object.freeze({
  id: ids.document, tenantId: ids.tenant, industryContextId: ids.industry,
  scopeClass: "TENANT_INDUSTRY", status: "ACTIVE", virusScanStatus: "CLEAN",
  sensitivityClass: "INTERNAL", residencyRegion: "IN", sourceModule: "Document",
  sourceResourceType: "test", sourceResourceId: ids.request, filenameDisplay: "test.png",
  mediaType: "image/png", storageObjectId: ids.foreign, versionNo: 1, ...overrides,
});

test("AIMEDIA-DOC-CUR-001 empty input requires empty document evidence", () => {
  const r = request({inputDocumentRefs: Object.freeze([])});
  assert.equal(matches(r, []), true);
  assert.equal(matches(r, [doc()]), false);
});

test("AIMEDIA-DOC-CUR-002 complete same-scope inputs match independently of evidence order", () => {
  const refs = Object.freeze([ids.document, ids.second]);
  const documents = Object.freeze([doc({id: ids.second}), doc()]);
  assert.equal(matches(request({inputDocumentRefs: refs}), documents), true);
  assert.equal(matches(request({inputDocumentRefs: refs, industryContextId: undefined}),
    documents.map(d => doc({...d, industryContextId: undefined, scopeClass: "TENANT_CORE"}))), true);
});

test("AIMEDIA-DOC-CUR-003 foreign Tenant, sibling Industry and absent Industry cannot cross scope", () => {
  for (const change of [{tenantId: ids.foreign}, {industryContextId: ids.foreign}, {industryContextId: undefined}]) {
    assert.equal(matches(request(), [doc(change)]), false);
  }
  assert.equal(matches(request({industryContextId: undefined}), [doc()]), false);
  assert.equal(matches(request({inputDocumentRefs: [ids.document, ids.second]}),
    [doc(), doc({id: ids.second, tenantId: ids.foreign})]), false);
});

test("AIMEDIA-DOC-CUR-004 every document must remain ACTIVE and CLEAN", () => {
  for (const status of ["UPLOADING", "SCANNING", "QUARANTINED", "REJECTED", "DELETED", "PURGED", "unknown"]) {
    assert.equal(matches(request(), [doc({status})]), false);
  }
  for (const virusScanStatus of ["PENDING", "INFECTED", "ERROR", "unknown"]) {
    assert.equal(matches(request(), [doc({virusScanStatus})]), false);
  }
  assert.equal(matches(request({inputDocumentRefs: [ids.document, ids.second]}),
    [doc(), doc({id: ids.second, virusScanStatus: "INFECTED"})]), false);
});

test("AIMEDIA-DOC-CUR-005 all sensitivity pairs obey the migration-owned ceiling", () => {
  const classes = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE_PERSONAL", "REGULATED"];
  for (let ceiling = 0; ceiling < classes.length; ceiling++) {
    for (let rank = 0; rank < classes.length; rank++) {
      assert.equal(matches(request({sensitivityClass: classes[ceiling]}),
        [doc({sensitivityClass: classes[rank]})]), rank <= ceiling);
    }
  }
  assert.equal(matches(request({sensitivityClass: "unknown"}), [doc()]), false);
  assert.equal(matches(request(), [doc({sensitivityClass: "unknown"})]), false);
});

test("AIMEDIA-DOC-CUR-006 residency is exact per document without normalization or fallback", () => {
  for (const residencyRegion of ["US", "in", " IN ", "", null, undefined]) {
    assert.equal(matches(request(), [doc({residencyRegion})]), false);
  }
  assert.equal(matches(request({inputDocumentRefs: [ids.document, ids.second]}),
    [doc(), doc({id: ids.second, residencyRegion: "US"})]), false);
});

test("AIMEDIA-DOC-CUR-007 malformed or incomplete evidence sets fail closed", () => {
  for (const r of [null, request({id: "bad"}), request({tenantId: "bad"}),
    request({industryContextId: "bad"}), request({inputDocumentRefs: null}),
    request({inputDocumentRefs: [null]}), request({inputDocumentRefs: ["bad"]}),
    request({inputDocumentRefs: [ids.document, ids.document]}), request({residencyRequirement: null})]) {
    assert.equal(matches(r, [doc()]), false);
  }
  for (const evidence of [null, [], [null], [doc({id: "bad"})], [doc({tenantId: "bad"})],
    [doc({industryContextId: "bad"})], [doc({id: ids.foreign})], [doc(), doc()]]) {
    assert.equal(matches(request(), evidence), false);
  }
  const pair = request({inputDocumentRefs: [ids.document, ids.second]});
  assert.equal(matches(pair, [doc(), doc()]), false);
  assert.equal(matches(pair, [doc(), doc({id: ids.foreign})]), false);
});

test("AIMEDIA-DOC-CUR-008 unrelated execution and access policy stay uninterpreted without mutation", () => {
  const r = request({principalId: "opaque", promptTemplateId: "opaque", promptVersion: -1,
    capabilityCode: "", brandConfigVersion: "opaque", moderationPolicyRef: "opaque",
    status: "FAILED", createdAt: "opaque", completedAt: "opaque"});
  const d = doc({ownerPrincipalId: "opaque", storageObjectId: "opaque", versionNo: -1,
    filenameDisplay: "", sourceModule: "", sourceResourceType: "", sourceResourceId: ""});
  const evidence = Object.freeze([d]);
  const before = JSON.stringify([r, evidence]);
  assert.equal(matches(r, evidence), true);
  assert.equal(JSON.stringify([r, evidence]), before);
});
