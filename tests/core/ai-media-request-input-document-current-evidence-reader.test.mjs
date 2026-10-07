import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIMediaRequestInputDocumentCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  industry: "22222222-2222-4222-8222-222222222222",
  request: "33333333-3333-4333-8333-333333333333",
  documentA: "44444444-4444-4444-8444-444444444444",
  documentB: "55555555-5555-4555-8555-555555555555",
  storageA: "66666666-6666-4666-8666-666666666666",
  storageB: "77777777-7777-4777-8777-777777777777",
  principal: "88888888-8888-4888-8888-888888888888",
  membership: "99999999-9999-4999-8999-999999999999",
  correlation: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-media-doc",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-media-doc",
    regionCode: "IN-MEDIA-DOC",
    principalId: ids.principal,
    principalType: "HUMAN",
    membershipId: ids.membership,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
    ...overrides,
  });
}

function request(overrides = {}) {
  return Object.freeze({
    id: ids.request,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    principalId: ids.principal,
    capabilityCode: "media.generate",
    mediaType: "IMAGE",
    inputDocumentRefs: Object.freeze([ids.documentA, ids.documentB]),
    sensitivityClass: "CONFIDENTIAL",
    residencyRequirement: "IN-MEDIA-DOC",
    moderationPolicyRef: "moderation:raw",
    status: "QUEUED",
    createdAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  });
}

function document(id, storageObjectId, overrides = {}) {
  return Object.freeze({
    id,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    scopeClass: "TENANT_INDUSTRY",
    sourceModule: "Document",
    sourceResourceType: "media-input",
    sourceResourceId: ids.request,
    filenameDisplay: id === ids.documentA ? "a.png" : "b.png",
    mediaType: "image/png",
    storageObjectId,
    ownerPrincipalId: ids.principal,
    sensitivityClass: "INTERNAL",
    residencyRegion: "IN-MEDIA-DOC",
    status: "ACTIVE",
    virusScanStatus: "CLEAN",
    versionNo: 1,
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const requestCalls = [];
  const documentCalls = [];
  const requestValue = Object.hasOwn(overrides, "request")
    ? overrides.request
    : request();

  const defaultDocuments = new Map([
    [ids.documentA, document(ids.documentA, ids.storageA)],
    [ids.documentB, document(ids.documentB, ids.storageB)],
  ]);
  const documents = overrides.documents ?? defaultDocuments;

  return {
    order,
    requestCalls,
    documentCalls,
    requestValue,
    documents,
    mediaRequestReader: {
      async loadForContext(input) {
        order.push("request");
        requestCalls.push(input);
        if (overrides.requestError) throw overrides.requestError;
        return requestValue;
      },
    },
    documentReader: {
      async loadForContext(input) {
        order.push("document:" + input.documentId);
        documentCalls.push(input);
        if (
          overrides.documentError
          && (
            overrides.documentErrorId === undefined
            || overrides.documentErrorId === input.documentId
          )
        ) {
          throw overrides.documentError;
        }
        return documents.get(input.documentId) ?? null;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadAIMediaRequestInputDocumentCurrentEvidence(
    {
      requestContext: context(),
      mediaRequestId: ids.request,
      ...inputOverrides,
    },
    f.mediaRequestReader,
    f.documentReader,
  );
}

test("AIMEDIA-DOCREAD-BASE-001 exact AIMediaRequest is loaded first with unchanged context/id", async () => {
  const f = fixture();
  const current = context();
  const result = await load(f, {requestContext: current});

  assert.ok(result);
  assert.equal(f.order[0], "request");
  assert.equal(f.requestCalls.length, 1);
  assert.equal(f.requestCalls[0].requestContext, current);
  assert.equal(f.requestCalls[0].mediaRequestId, ids.request);
  assert.equal(result.request, f.requestValue);
});

test("AIMEDIA-DOCREAD-BASE-002 request null/errors precede every Document metadata read", async () => {
  const hidden = fixture({request: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["request"]);
  assert.equal(hidden.documentCalls.length, 0);

  const expected = new Error("media-request-unavailable");
  const broken = fixture({requestError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["request"]);
  assert.equal(broken.documentCalls.length, 0);
});

test("AIMEDIA-DOCREAD-BRANCH-001 empty refs perform zero Document reads and return frozen empty evidence", async () => {
  const f = fixture({
    request: request({inputDocumentRefs: Object.freeze([])}),
  });
  const result = await load(f);

  assert.ok(result);
  assert.deepEqual(f.order, ["request"]);
  assert.equal(f.documentCalls.length, 0);
  assert.deepEqual(result.documents, []);
  assert.equal(Object.isFrozen(result.documents), true);
  assert.equal(Object.isFrozen(result), true);
});

test("AIMEDIA-DOCREAD-READ-001 non-empty refs read exactly once each in persisted order with exact context/id", async () => {
  const f = fixture();
  const current = context();
  const result = await load(f, {requestContext: current});

  assert.ok(result);
  assert.deepEqual(
    f.documentCalls.map(call => call.documentId),
    [ids.documentA, ids.documentB],
  );
  assert.ok(f.documentCalls.every(call => call.requestContext === current));
  assert.deepEqual(f.order, [
    "request",
    "document:" + ids.documentA,
    "document:" + ids.documentB,
  ]);
});

test("AIMEDIA-DOCREAD-READ-002 missing/error Document evidence fails closed with no retry search or fallback", async () => {
  const missingMap = new Map([
    [ids.documentA, document(ids.documentA, ids.storageA)],
  ]);
  const missing = fixture({documents: missingMap});
  assert.equal(await load(missing), null);
  assert.deepEqual(
    missing.documentCalls.map(call => call.documentId),
    [ids.documentA, ids.documentB],
  );

  const expected = new Error("document-metadata-unavailable");
  const broken = fixture({
    documentError: expected,
    documentErrorId: ids.documentA,
  });
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(
    broken.documentCalls.map(call => call.documentId),
    [ids.documentA],
  );
});

test("AIMEDIA-DOCREAD-FLOOR-001 complete DD-189 current relationship evidence passes with exact references", async () => {
  const f = fixture();
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.request, f.requestValue);
  assert.equal(result.documents[0], f.documents.get(ids.documentA));
  assert.equal(result.documents[1], f.documents.get(ids.documentB));
});

test("AIMEDIA-DOCREAD-FLOOR-002 mismatched or unsafe DD-189 evidence fails closed", async () => {
  const cases = [
    new Map([
      [ids.documentA, document(ids.documentA, ids.storageA, {tenantId: ids.documentB})],
      [ids.documentB, document(ids.documentB, ids.storageB)],
    ]),
    new Map([
      [ids.documentA, document(ids.documentA, ids.storageA, {status: "QUARANTINED"})],
      [ids.documentB, document(ids.documentB, ids.storageB)],
    ]),
    new Map([
      [ids.documentA, document(ids.documentA, ids.storageA, {residencyRegion: "US"})],
      [ids.documentB, document(ids.documentB, ids.storageB)],
    ]),
    new Map([
      [ids.documentA, document(ids.documentA, ids.storageA)],
      [ids.documentB, document(ids.documentA, ids.storageA)],
    ]),
  ];

  for (const documents of cases) {
    const f = fixture({documents});
    assert.equal(await load(f), null);
    assert.equal(f.documentCalls.length, 2);
  }
});

test("AIMEDIA-DOCREAD-EVID-001 success is immutable and preserves exact request/document/raw metadata references", async () => {
  const f = fixture();
  const before = JSON.stringify([
    f.requestValue,
    f.documents.get(ids.documentA),
    f.documents.get(ids.documentB),
  ]);

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.documents), true);
  assert.equal(result.request, f.requestValue);
  assert.equal(result.documents[0], f.documents.get(ids.documentA));
  assert.equal(result.documents[1], f.documents.get(ids.documentB));
  assert.equal(
    JSON.stringify([
      f.requestValue,
      f.documents.get(ids.documentA),
      f.documents.get(ids.documentB),
    ]),
    before,
  );
});

test("AIMEDIA-DOCREAD-BOUND-001 evidence grants no ACL storage authorization routing execution publication mutation or event authority", async () => {
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
    "principalCurrent",
    "promptAuthorized",
    "capabilityEligible",
    "moderationAllowed",
    "provider",
    "model",
    "route",
    "budgetAllowed",
    "executionAuthorized",
    "published",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
