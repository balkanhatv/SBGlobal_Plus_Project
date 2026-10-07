import test from "node:test";
import assert from "node:assert/strict";

import {
  loadDocumentAIGeneratedMediaRequestCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  document: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  request: "44444444-4444-4444-8444-444444444444",
  otherRequest: "45454545-4545-4454-8454-454545454545",
  provider: "55555555-5555-4555-8555-555555555555",
  model: "66666666-6666-4666-8666-666666666666",
  principal: "77777777-7777-4777-8777-777777777777",
  membership: "88888888-8888-4888-8888-888888888888",
  correlation: "99999999-9999-4999-8999-999999999999",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-docai-media",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-docai-media",
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

function document(overrides = {}) {
  return Object.freeze({
    id: ids.document,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    sensitivityClass: "CONFIDENTIAL",
    residencyRegion: "IN-CENTRAL",
    aiGenerated: true,
    aiMediaRequestId: ids.request,
    aiProviderId: ids.provider,
    aiModelId: ids.model,
    aiProvenance: Object.freeze({raw: "provenance"}),
    aiModerationResult: Object.freeze({decision: "RAW"}),
    aiLicensingUsage: Object.freeze({license: "RAW"}),
    ...overrides,
  });
}

function mediaRequest(overrides = {}) {
  return Object.freeze({
    id: ids.request,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    principalId: ids.principal,
    capabilityCode: "media.generate",
    mediaType: "IMAGE",
    promptTemplateId: undefined,
    promptVersion: undefined,
    brandConfigVersion: "12",
    localizationProfileRef: "profile:raw",
    inputDocumentRefs: Object.freeze([]),
    sensitivityClass: "INTERNAL",
    residencyRequirement: "IN-CENTRAL",
    moderationPolicyRef: "moderation:raw",
    status: "RAW_STATUS",
    createdAt: "2026-10-07T00:00:00.000Z",
    completedAt: "2026-10-07T00:00:01.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const documentCalls = [];
  const requestCalls = [];
  const values = {
    document: Object.hasOwn(overrides, "document")
      ? overrides.document
      : document(),
    mediaRequest: Object.hasOwn(overrides, "mediaRequest")
      ? overrides.mediaRequest
      : mediaRequest(),
  };

  return {
    order,
    documentCalls,
    requestCalls,
    values,
    documentReader: {
      async loadForContext(input) {
        order.push("document");
        documentCalls.push(input);
        if (overrides.documentError) throw overrides.documentError;
        return values.document;
      },
    },
    mediaRequestReader: {
      async loadForContext(input) {
        order.push("mediaRequest");
        requestCalls.push(input);
        if (overrides.mediaRequestError) throw overrides.mediaRequestError;
        return values.mediaRequest;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadDocumentAIGeneratedMediaRequestCurrentEvidence(
    {
      requestContext: context(),
      documentId: ids.document,
      ...inputOverrides,
    },
    f.documentReader,
    f.mediaRequestReader,
  );
}

test("DOCAI-MEDIAREAD-BASE-001 exact Document provenance evidence is loaded first with unchanged context/id", async () => {
  const f = fixture();
  const current = context();
  const result = await load(f, {requestContext: current});

  assert.ok(result);
  assert.equal(f.order[0], "document");
  assert.equal(f.documentCalls.length, 1);
  assert.equal(f.documentCalls[0].requestContext, current);
  assert.equal(f.documentCalls[0].documentId, ids.document);
  assert.equal(result.document, f.values.document);
});

test("DOCAI-MEDIAREAD-BASE-002 document null/errors precede every MediaRequest read", async () => {
  const hidden = fixture({document: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["document"]);
  assert.equal(hidden.requestCalls.length, 0);

  const expected = new Error("document-provenance-unavailable");
  const broken = fixture({documentError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["document"]);
  assert.equal(broken.requestCalls.length, 0);
});

test("DOCAI-MEDIAREAD-BRANCH-001 non-AI Document performs zero MediaRequest reads and returns frozen document-only evidence", async () => {
  const plain = document({
    aiGenerated: false,
    aiMediaRequestId: undefined,
    aiProviderId: undefined,
    aiModelId: undefined,
    aiProvenance: undefined,
    aiModerationResult: undefined,
    aiLicensingUsage: undefined,
  });
  const f = fixture({document: plain});
  const result = await load(f);

  assert.ok(result);
  assert.deepEqual(f.order, ["document"]);
  assert.equal(f.requestCalls.length, 0);
  assert.equal(result.document, plain);
  assert.equal("mediaRequest" in result, false);
  assert.equal(Object.isFrozen(result), true);
});

test("DOCAI-MEDIAREAD-READ-001 AI-generated Document reads exact persisted MediaRequest id once in same context", async () => {
  const f = fixture();
  const current = context();
  const result = await load(f, {requestContext: current});

  assert.ok(result);
  assert.deepEqual(f.order, ["document", "mediaRequest"]);
  assert.equal(f.requestCalls.length, 1);
  assert.equal(f.requestCalls[0].requestContext, current);
  assert.equal(f.requestCalls[0].mediaRequestId, ids.request);
});

test("DOCAI-MEDIAREAD-READ-002 missing MediaRequest returns null and errors propagate without retry search or fallback", async () => {
  const missing = fixture({mediaRequest: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["document", "mediaRequest"]);
  assert.equal(missing.requestCalls.length, 1);

  const expected = new Error("media-request-unavailable");
  const broken = fixture({mediaRequestError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["document", "mediaRequest"]);
  assert.equal(broken.requestCalls.length, 1);

  const malformed = fixture({
    document: document({aiMediaRequestId: undefined}),
  });
  assert.equal(await load(malformed), null);
  assert.deepEqual(malformed.order, ["document"]);
  assert.equal(malformed.requestCalls.length, 0);
});

test("DOCAI-MEDIAREAD-FLOOR-001 exact completed DD-191 same-scope residency sensitivity relationship passes", async () => {
  const f = fixture();
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.document, f.values.document);
  assert.equal(result.mediaRequest, f.values.mediaRequest);
});

test("DOCAI-MEDIAREAD-FLOOR-002 wrong incomplete cross-scope residency or sensitivity evidence fails closed", async () => {
  const cases = [
    fixture({mediaRequest: mediaRequest({id: ids.otherRequest})}),
    fixture({mediaRequest: mediaRequest({completedAt: undefined})}),
    fixture({mediaRequest: mediaRequest({tenantId: ids.otherRequest})}),
    fixture({mediaRequest: mediaRequest({industryContextId: undefined})}),
    fixture({mediaRequest: mediaRequest({residencyRequirement: "US"})}),
    fixture({
      document: document({sensitivityClass: "INTERNAL"}),
      mediaRequest: mediaRequest({sensitivityClass: "CONFIDENTIAL"}),
    }),
  ];

  for (const f of cases) {
    assert.equal(await load(f), null);
    assert.equal(f.requestCalls.length, 1);
  }
});

test("DOCAI-MEDIAREAD-EVID-001 success is frozen and preserves exact raw Document MediaRequest and provenance references", async () => {
  const doc = document();
  const req = mediaRequest({
    principalId: ids.otherRequest,
    capabilityCode: "",
    mediaType: "VIDEO",
    moderationPolicyRef: "",
    status: "FAILED",
  });
  const f = fixture({document: doc, mediaRequest: req});
  const before = JSON.stringify([doc, req]);

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.document, doc);
  assert.equal(result.mediaRequest, req);
  assert.equal(result.document.aiProvenance, doc.aiProvenance);
  assert.equal(result.document.aiModerationResult, doc.aiModerationResult);
  assert.equal(result.document.aiLicensingUsage, doc.aiLicensingUsage);
  assert.equal(JSON.stringify([doc, req]), before);
});

test("DOCAI-MEDIAREAD-BOUND-001 evidence grants no provider model moderation licensing principal access storage execution publication mutation or event authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "providerEligible",
    "modelEligible",
    "route",
    "moderationApproved",
    "licensingApproved",
    "principalCurrent",
    "principalAuthorized",
    "aclEntries",
    "documentAuthorized",
    "storageBinding",
    "signedUrl",
    "promptAuthorized",
    "capabilityEligible",
    "entitlementAllowed",
    "budgetAllowed",
    "executionAuthorized",
    "publicationAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
