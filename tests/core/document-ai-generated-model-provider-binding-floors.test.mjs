import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesDocumentAIGeneratedModelProviderBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  document: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  model: "44444444-4444-4444-8444-444444444444",
  otherModel: "55555555-5555-4555-8555-555555555555",
  provider: "66666666-6666-4666-8666-666666666666",
  otherProvider: "77777777-7777-4777-8777-777777777777",
  mediaRequest: "88888888-8888-4888-8888-888888888888",
});

const baseDocument = Object.freeze({
  id: ids.document,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  sensitivityClass: "CONFIDENTIAL",
  residencyRegion: "IN-CENTRAL",
  aiGenerated: true,
  aiMediaRequestId: ids.mediaRequest,
  aiProviderId: ids.provider,
  aiModelId: ids.model,
  aiProvenance: Object.freeze({raw: "provenance"}),
  aiModerationResult: Object.freeze({raw: "moderation"}),
  aiLicensingUsage: Object.freeze({raw: "licensing"}),
});

const baseModel = Object.freeze({
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
});

function document(overrides = {}) {
  return Object.freeze({...baseDocument, ...overrides});
}

function model(overrides = {}) {
  return Object.freeze({...baseModel, ...overrides});
}

test("DOCAI-MODEL-CUR-001 non-AI Document requires absent Model/Provider ids and no model evidence", () => {
  const plain = document({
    aiGenerated: false,
    aiModelId: undefined,
    aiProviderId: undefined,
  });

  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(plain),
    true,
  );
  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(plain, model()),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(
      document({aiGenerated: false, aiModelId: ids.model, aiProviderId: undefined}),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(
      document({aiGenerated: false, aiModelId: undefined, aiProviderId: ids.provider}),
    ),
    false,
  );
});

test("DOCAI-MODEL-CUR-002 exact generated Document Model/Provider pair passes", () => {
  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(document(), model()),
    true,
  );
});

test("DOCAI-MODEL-CUR-003 missing model evidence or wrong Model id fails closed", () => {
  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(document()),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(
      document(),
      model({id: ids.otherModel}),
    ),
    false,
  );
});

test("DOCAI-MODEL-CUR-004 Model provider id must exactly match Document provider id", () => {
  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(
      document(),
      model({providerId: ids.otherProvider}),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(
      document({aiProviderId: ids.otherProvider}),
      model(),
    ),
    false,
  );
});

test("DOCAI-MODEL-CUR-005 malformed relevant identity/generated/pair shape fails closed", () => {
  for (const candidate of [
    document({id: "bad"}),
    document({tenantId: "bad"}),
    document({industryContextId: "bad"}),
    document({aiGenerated: "true"}),
    document({aiModelId: "bad"}),
    document({aiProviderId: "bad"}),
  ]) {
    assert.equal(
      matchesDocumentAIGeneratedModelProviderBindingFloors(candidate, model()),
      false,
    );
  }

  for (const candidateModel of [
    model({id: "bad"}),
    model({providerId: "bad"}),
  ]) {
    assert.equal(
      matchesDocumentAIGeneratedModelProviderBindingFloors(document(), candidateModel),
      false,
    );
  }

  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(
      document({aiGenerated: true, aiModelId: undefined}),
      model(),
    ),
    false,
  );
  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(
      document({aiGenerated: true, aiProviderId: undefined}),
      model(),
    ),
    false,
  );
});

test("DOCAI-MODEL-CUR-006 Model runtime/catalog semantics are uninterpreted and no Provider evidence is required", () => {
  const rawModel = model({
    modelCode: "",
    displayName: "",
    capabilities: Object.freeze([null, "", "UNRELATED"]),
    contextWindowClass: "",
    inputModalities: Object.freeze([null]),
    outputModalities: Object.freeze(["UNRELATED"]),
    residencyRegions: Object.freeze([""]),
    sensitivityCeiling: "PUBLIC",
    costClass: "",
    latencyClass: "",
    status: "RETIRED",
    version: -999,
    metadata: Object.freeze({providerCurrent: false}),
  });

  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(document(), rawModel),
    true,
  );
});

test("DOCAI-MODEL-CUR-007 unrelated Document provenance evidence is uninterpreted and inputs remain unchanged", () => {
  const candidateDocument = Object.freeze({
    ...document(),
    aiMediaRequestId: "not-interpreted",
    sensitivityClass: "UNKNOWN",
    residencyRegion: "",
    aiProvenance: Object.freeze({nested: Object.freeze(["raw"])}),
    aiModerationResult: Object.freeze({decision: "DENY"}),
    aiLicensingUsage: Object.freeze({license: "UNREVIEWED"}),
  });
  const candidateModel = model();
  const beforeDocument = JSON.stringify(candidateDocument);
  const beforeModel = JSON.stringify(candidateModel);

  assert.equal(
    matchesDocumentAIGeneratedModelProviderBindingFloors(
      candidateDocument,
      candidateModel,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateDocument), beforeDocument);
  assert.equal(JSON.stringify(candidateModel), beforeModel);
});
