import test from "node:test";
import assert from "node:assert/strict";

import {
  loadDocumentAIGeneratedModelProviderRowCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  document: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  request: "44444444-4444-4444-8444-444444444444",
  provider: "55555555-5555-4555-8555-555555555555",
  otherProvider: "56565656-5656-4656-8656-565656565656",
  model: "66666666-6666-4666-8666-666666666666",
  otherModel: "67676767-6767-4767-8767-676767676767",
  principal: "77777777-7777-4777-8777-777777777777",
  membership: "88888888-8888-4888-8888-888888888888",
  correlation: "99999999-9999-4999-8999-999999999999",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-docai-provider",
    correlationId: ids.correlation,
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-docai-provider",
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

function model(overrides = {}) {
  return Object.freeze({
    id: ids.model,
    providerId: ids.provider,
    modelCode: "media-image-v1",
    displayName: "Media image model",
    capabilities: Object.freeze(["IMAGE"]),
    contextWindowClass: "MEDIA",
    inputModalities: Object.freeze(["TEXT"]),
    outputModalities: Object.freeze(["IMAGE"]),
    residencyRegions: Object.freeze(["IN-CENTRAL"]),
    sensitivityCeiling: "REGULATED",
    costClass: "STANDARD",
    latencyClass: "STANDARD",
    status: "ACTIVE",
    version: 7,
    metadata: Object.freeze({raw: true}),
    ...overrides,
  });
}

function provider(overrides = {}) {
  return Object.freeze({
    id: ids.provider,
    code: "provider.raw",
    status: "ACTIVE",
    adapterType: "RAW_ADAPTER",
    supportedRegions: Object.freeze(["IN-CENTRAL"]),
    supportedCapabilities: Object.freeze(["IMAGE"]),
    securityClass: "REGULATED",
    residencyMetadata: Object.freeze({raw: true}),
    healthState: "HEALTHY",
    version: 9,
    createdAt: "2026-10-07T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:01.000Z",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const documentCalls = [];
  const requestCalls = [];
  const modelCalls = [];
  const providerCalls = [];
  const values = {
    document: Object.hasOwn(overrides, "document") ? overrides.document : document(),
    mediaRequest: Object.hasOwn(overrides, "mediaRequest") ? overrides.mediaRequest : mediaRequest(),
    model: Object.hasOwn(overrides, "model") ? overrides.model : model(),
    provider: Object.hasOwn(overrides, "provider") ? overrides.provider : provider(),
  };

  return {
    order,
    documentCalls,
    requestCalls,
    modelCalls,
    providerCalls,
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
    modelReader: {
      async loadById(id) {
        order.push("model");
        modelCalls.push(id);
        if (overrides.modelError) throw overrides.modelError;
        return values.model;
      },
    },
    providerReader: {
      async loadById(id) {
        order.push("provider");
        providerCalls.push(id);
        if (overrides.providerError) throw overrides.providerError;
        return values.provider;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadDocumentAIGeneratedModelProviderRowCurrentEvidence(
    {
      requestContext: context(),
      documentId: ids.document,
      ...inputOverrides,
    },
    f.documentReader,
    f.mediaRequestReader,
    f.modelReader,
    f.providerReader,
  );
}

test("DOCAI-PROVREAD-BASE-001 exact DD-617 parent evidence is established first with unchanged input and dependencies", async () => {
  const f = fixture();
  const current = context();
  const result = await load(f, {requestContext: current});

  assert.ok(result);
  assert.deepEqual(f.order, ["document", "mediaRequest", "model", "provider"]);
  assert.equal(f.documentCalls[0].requestContext, current);
  assert.equal(f.documentCalls[0].documentId, ids.document);
  assert.equal(result.parent.parent.document, f.values.document);
  assert.equal(result.parent.model, f.values.model);
});

test("DOCAI-PROVREAD-BASE-002 DD-617 null or error precedes every AIProvider read", async () => {
  const hidden = fixture({document: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["document"]);
  assert.equal(hidden.providerCalls.length, 0);

  const expected = new Error("model-catalog-unavailable");
  const broken = fixture({modelError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["document", "mediaRequest", "model"]);
  assert.equal(broken.providerCalls.length, 0);
});

test("DOCAI-PROVREAD-BRANCH-001 non-AI model-absent parent performs zero Provider reads and returns frozen exact parent-only evidence", async () => {
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
  assert.equal(f.modelCalls.length, 0);
  assert.equal(f.providerCalls.length, 0);
  assert.equal(result.parent.parent.document, plain);
  assert.equal("provider" in result, false);
  assert.equal(Object.isFrozen(result), true);
});

test("DOCAI-PROVREAD-READ-001 model-bound parent reads exact preserved model.providerId once", async () => {
  const f = fixture();
  const result = await load(f);

  assert.ok(result);
  assert.deepEqual(f.order, ["document", "mediaRequest", "model", "provider"]);
  assert.deepEqual(f.providerCalls, [ids.provider]);
});

test("DOCAI-PROVREAD-READ-002 missing Provider returns null and Provider errors propagate without code current latest fallback or credential lookup", async () => {
  const missing = fixture({provider: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.providerCalls, [ids.provider]);

  const expected = new Error("provider-catalog-unavailable");
  const broken = fixture({providerError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.providerCalls, [ids.provider]);
});

test("DOCAI-PROVREAD-FLOOR-001 exact DD-200 Model.providerId to Provider.id binding passes", async () => {
  const f = fixture();
  const result = await load(f);

  assert.ok(result);
  assert.equal(result.parent.model, f.values.model);
  assert.equal(result.provider, f.values.provider);
});

test("DOCAI-PROVREAD-FLOOR-002 wrong or malformed Provider id or Model providerId fails closed through DD-200", async () => {
  const cases = [
    fixture({provider: provider({id: ids.otherProvider})}),
    fixture({provider: provider({id: "bad"})}),
    fixture({model: model({providerId: "bad"})}),
    fixture({model: model({id: "bad"})}),
  ];

  for (const f of cases) {
    assert.equal(await load(f), null);
    if (f.values.model.providerId === "bad") {
      assert.equal(f.providerCalls.length, 1);
      assert.deepEqual(f.providerCalls, ["bad"]);
    } else if (f.values.model.id === "bad") {
      assert.equal(f.providerCalls.length, 0);
    } else {
      assert.equal(f.providerCalls.length, 1);
    }
  }
});

test("DOCAI-PROVREAD-EVID-001 success preserves exact DD-617 parent Provider and raw model provider request provenance metadata references", async () => {
  const doc = document();
  const req = mediaRequest({status: "FAILED", capabilityCode: ""});
  const rawModel = model({
    status: "RETIRED",
    version: -7,
    capabilities: Object.freeze([null, "", "UNRELATED"]),
    residencyRegions: Object.freeze([""]),
    metadata: Object.freeze({rawModel: true}),
  });
  const rawProvider = provider({
    code: "",
    status: "DISABLED",
    adapterType: "",
    supportedRegions: Object.freeze([null, ""]),
    supportedCapabilities: Object.freeze([null, "UNRELATED"]),
    securityClass: "",
    residencyMetadata: Object.freeze({rawProvider: true}),
    healthState: "DOWN",
    version: -11,
  });
  const f = fixture({document: doc, mediaRequest: req, model: rawModel, provider: rawProvider});
  const before = JSON.stringify([doc, req, rawModel, rawProvider]);

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.parent.parent.document, doc);
  assert.equal(result.parent.parent.mediaRequest, req);
  assert.equal(result.parent.model, rawModel);
  assert.equal(result.provider, rawProvider);
  assert.equal(result.provider.residencyMetadata, rawProvider.residencyMetadata);
  assert.equal(result.parent.model.metadata, rawModel.metadata);
  assert.equal(JSON.stringify([doc, req, rawModel, rawProvider]), before);
});

test("DOCAI-PROVREAD-BOUND-001 evidence grants no Provider Model currentness health credential eligibility routing moderation licensing access publication or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);

  for (const forbidden of [
    "providerCurrent",
    "providerHealthy",
    "credentialRef",
    "credential",
    "modelCurrent",
    "modelEligible",
    "route",
    "moderationApproved",
    "licensingApproved",
    "principalAuthorized",
    "documentAuthorized",
    "storageBinding",
    "signedUrl",
    "providerAllowed",
    "modelAllowed",
    "provisioningValid",
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
