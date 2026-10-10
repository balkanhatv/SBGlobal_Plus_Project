import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIMediaRequestCapabilityBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  request: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  principal: "44444444-4444-4444-8444-444444444444",
  prompt: "55555555-5555-4555-8555-555555555555",
  capability: "66666666-6666-4666-8666-666666666666",
  document: "77777777-7777-4777-8777-777777777777",
});

const baseRequest = Object.freeze({
  id: ids.request,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  principalId: ids.principal,
  capabilityCode: "IMAGE",
  mediaType: "IMAGE",
  promptTemplateId: ids.prompt,
  promptVersion: 7,
  brandConfigVersion: "brand-v3",
  localizationProfileRef: "loc:en-IN",
  inputDocumentRefs: Object.freeze([ids.document]),
  sensitivityClass: "CONFIDENTIAL",
  residencyRequirement: "IN-CENTRAL",
  moderationPolicyRef: "moderation:default",
  status: "COMPLETE",
  createdAt: "2026-09-26T00:00:00.000Z",
  completedAt: "2026-09-26T00:00:05.000Z",
});

const baseCapability = Object.freeze({
  id: ids.capability,
  code: "IMAGE",
  category: "IMAGE",
  requiredEntitlement: "ai.image",
  defaultPolicyClass: "STANDARD",
  schemaVersion: 1,
  status: "ACTIVE",
});

function request(overrides = {}) {
  return Object.freeze({...baseRequest, ...overrides});
}

function capability(overrides = {}) {
  return Object.freeze({...baseCapability, ...overrides});
}

test("AIMEDIA-CAP-CUR-001 exact MediaRequest and capability code binding passes", () => {
  assert.equal(
    matchesAIMediaRequestCapabilityBindingFloors(request(), capability()),
    true,
  );
});

test("AIMEDIA-CAP-CUR-002 missing capability evidence or mismatched code fails closed", () => {
  assert.equal(matchesAIMediaRequestCapabilityBindingFloors(request()), false);
  assert.equal(
    matchesAIMediaRequestCapabilityBindingFloors(
      request(),
      capability({code: "VIDEO"}),
    ),
    false,
  );
});

test("AIMEDIA-CAP-CUR-003 code equality is exact without normalization and empty raw equality is preserved", () => {
  for (const code of ["image", "IMAGE ", " IMAGE"]) {
    assert.equal(
      matchesAIMediaRequestCapabilityBindingFloors(
        request(),
        capability({code}),
      ),
      false,
      code,
    );
  }

  assert.equal(
    matchesAIMediaRequestCapabilityBindingFloors(
      request({capabilityCode: ""}),
      capability({code: ""}),
    ),
    true,
  );
});

test("AIMEDIA-CAP-CUR-004 malformed MediaRequest id/Tenant/optional Industry/code fails closed", () => {
  for (const candidate of [
    request({id: "bad"}),
    request({tenantId: "bad"}),
    request({industryContextId: "bad"}),
    request({capabilityCode: null}),
  ]) {
    assert.equal(
      matchesAIMediaRequestCapabilityBindingFloors(candidate, capability()),
      false,
    );
  }
});

test("AIMEDIA-CAP-CUR-005 malformed capability id/code evidence fails closed", () => {
  for (const candidate of [
    capability({id: "bad"}),
    capability({code: null}),
  ]) {
    assert.equal(
      matchesAIMediaRequestCapabilityBindingFloors(request(), candidate),
      false,
    );
  }
});

test("AIMEDIA-CAP-CUR-006 capability lifecycle/category/entitlement/policy/schema semantics are uninterpreted", () => {
  const rawCapability = capability({
    category: "UNRELATED",
    requiredEntitlement: null,
    defaultPolicyClass: "",
    schemaVersion: -999,
    status: "RETIRED",
  });

  assert.equal(
    matchesAIMediaRequestCapabilityBindingFloors(request(), rawCapability),
    true,
  );
});

test("AIMEDIA-CAP-CUR-007 unrelated MediaRequest evidence is uninterpreted and inputs remain unchanged", () => {
  const rawRequest = request({
    principalId: "not-interpreted",
    mediaType: "UNRELATED",
    promptTemplateId: "not-interpreted",
    promptVersion: -999,
    brandConfigVersion: "",
    localizationProfileRef: "",
    inputDocumentRefs: Object.freeze(["not-interpreted"]),
    sensitivityClass: "UNKNOWN",
    residencyRequirement: "",
    moderationPolicyRef: "",
    status: "FAILED",
    createdAt: "not-interpreted",
    completedAt: "not-interpreted",
  });
  const rawCapability = capability();
  const beforeRequest = JSON.stringify(rawRequest);
  const beforeCapability = JSON.stringify(rawCapability);

  assert.equal(
    matchesAIMediaRequestCapabilityBindingFloors(rawRequest, rawCapability),
    true,
  );
  assert.equal(JSON.stringify(rawRequest), beforeRequest);
  assert.equal(JSON.stringify(rawCapability), beforeCapability);
  assert.equal("authorized" in rawRequest, false);
  assert.equal("routable" in rawCapability, false);
  assert.equal("executable" in rawCapability, false);
});
