import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesDocumentAIGeneratedMediaRequestProvenanceFloors,
} from "../../dist/core/index.js";

const ids = {
  document: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  tenantOther: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  industryOther: "55555555-5555-4555-8555-555555555555",
  request: "66666666-6666-4666-8666-666666666666",
  requestOther: "77777777-7777-4777-8777-777777777777",
  provider: "88888888-8888-4888-8888-888888888888",
  model: "99999999-9999-4999-8999-999999999999",
};

function document(overrides = {}) {
  return {
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
    aiModerationResult: Object.freeze({raw: "moderation"}),
    aiLicensingUsage: Object.freeze({raw: "licensing"}),
    ...overrides,
  };
}

function mediaRequest(overrides = {}) {
  return {
    id: ids.request,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    principalId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    capabilityCode: "MEDIA.IMAGE",
    mediaType: "IMAGE",
    promptTemplateId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    promptVersion: 7,
    brandConfigVersion: "12",
    localizationProfileRef: "profile:raw",
    inputDocumentRefs: Object.freeze([]),
    sensitivityClass: "INTERNAL",
    residencyRequirement: "IN-CENTRAL",
    moderationPolicyRef: "moderation:raw",
    status: "RAW_STATUS",
    createdAt: "2026-09-25T00:00:00.000Z",
    completedAt: "2026-09-25T00:00:01.000Z",
    ...overrides,
  };
}

test("DOCAI-MEDIA-CUR-001 non-AI Document is valid only without request binding/evidence", () => {
  const plain = document({
    aiGenerated: false,
    aiMediaRequestId: undefined,
    aiProviderId: undefined,
    aiModelId: undefined,
    aiProvenance: undefined,
    aiModerationResult: undefined,
    aiLicensingUsage: undefined,
  });
  assert.equal(matchesDocumentAIGeneratedMediaRequestProvenanceFloors(plain), true);
  assert.equal(matchesDocumentAIGeneratedMediaRequestProvenanceFloors(plain, mediaRequest()), false);
  assert.equal(matchesDocumentAIGeneratedMediaRequestProvenanceFloors({
    ...plain,
    aiMediaRequestId: ids.request,
  }), false);
});

test("DOCAI-MEDIA-CUR-002 exact completed Industry and Tenant-Core bindings pass", () => {
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(document(), mediaRequest()),
    true,
  );

  const coreDocument = document({industryContextId: undefined});
  const coreRequest = mediaRequest({industryContextId: undefined});
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(coreDocument, coreRequest),
    true,
  );
});

test("DOCAI-MEDIA-CUR-003 missing, wrong or incomplete MediaRequest evidence fails", () => {
  assert.equal(matchesDocumentAIGeneratedMediaRequestProvenanceFloors(document()), false);
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({id: ids.requestOther}),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({completedAt: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({completedAt: "not-a-timestamp"}),
    ),
    false,
  );
});

test("DOCAI-MEDIA-CUR-004 Tenant and null-safe Industry mismatches fail closed", () => {
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({tenantId: ids.tenantOther}),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({industryContextId: ids.industryOther}),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({industryContextId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document({industryContextId: undefined}),
      mediaRequest(),
    ),
    false,
  );
});

test("DOCAI-MEDIA-CUR-005 residency requires exact string equality", () => {
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({residencyRequirement: "IN-CENTRAL"}),
    ),
    true,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({residencyRequirement: "in-central"}),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({residencyRequirement: "IN-CENTRAL "}),
    ),
    false,
  );
});

test("DOCAI-MEDIA-CUR-006 all known sensitivity pairs follow document-rank >= request-rank", () => {
  const classes = [
    "PUBLIC",
    "INTERNAL",
    "CONFIDENTIAL",
    "SENSITIVE_PERSONAL",
    "REGULATED",
  ];
  for (let documentRank = 0; documentRank < classes.length; documentRank += 1) {
    for (let requestRank = 0; requestRank < classes.length; requestRank += 1) {
      assert.equal(
        matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
          document({sensitivityClass: classes[documentRank]}),
          mediaRequest({sensitivityClass: classes[requestRank]}),
        ),
        documentRank >= requestRank,
        `${classes[documentRank]} document vs ${classes[requestRank]} request`,
      );
    }
  }

  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document({sensitivityClass: "UNKNOWN"}),
      mediaRequest(),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document(),
      mediaRequest({sensitivityClass: "UNKNOWN"}),
    ),
    false,
  );
});

test("DOCAI-MEDIA-CUR-007 malformed relevant identity/scope/generated shape fails closed", () => {
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document({id: "bad"}),
      mediaRequest(),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document({tenantId: "bad"}),
      mediaRequest(),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document({industryContextId: "bad"}),
      mediaRequest(),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document({aiGenerated: "true"}),
      mediaRequest(),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
      document({aiMediaRequestId: "bad"}),
      mediaRequest(),
    ),
    false,
  );
});

test("DOCAI-MEDIA-CUR-008 unrelated provenance/provider/request evidence is uninterpreted and inputs stay unchanged", () => {
  const doc = Object.freeze({
    ...document(),
    aiProviderId: ids.requestOther,
    aiModelId: ids.tenantOther,
    aiProvenance: Object.freeze({anything: Object.freeze(["raw"])}),
    aiModerationResult: Object.freeze({decision: "DENY"}),
    aiLicensingUsage: Object.freeze({license: "UNREVIEWED"}),
  });
  const request = Object.freeze({
    ...mediaRequest(),
    principalId: ids.tenantOther,
    capabilityCode: "",
    mediaType: "VIDEO",
    promptTemplateId: undefined,
    promptVersion: undefined,
    brandConfigVersion: "-999",
    localizationProfileRef: "",
    moderationPolicyRef: "",
    status: "FAILED",
    createdAt: "1900-01-01T00:00:00.000Z",
  });
  const beforeDoc = JSON.stringify(doc);
  const beforeRequest = JSON.stringify(request);

  assert.equal(
    matchesDocumentAIGeneratedMediaRequestProvenanceFloors(doc, request),
    true,
  );
  assert.equal(JSON.stringify(doc), beforeDoc);
  assert.equal(JSON.stringify(request), beforeRequest);
});
