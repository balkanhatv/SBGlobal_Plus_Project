import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIMediaRequestCapabilityCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  request: "11111111-1111-4111-8111-111111111111",
  capability: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  industry: "44444444-4444-4444-8444-444444444444",
  principal: "55555555-5555-4555-8555-555555555555",
  membership: "66666666-6666-4666-8666-666666666666",
});

function context(overrides = {}) {
  return Object.freeze({
    requestId: "request-1",
    correlationId: "correlation-1",
    tenantId: ids.tenant,
    industryContextId: ids.industry,
    dataHomeId: "home-1",
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

function request(overrides = {}) {
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
    localizationProfileRef: "en-IN",
    inputDocumentRefs: Object.freeze([]),
    sensitivityClass: "INTERNAL",
    residencyRequirement: "IN",
    moderationPolicyRef: "default",
    status: "QUEUED",
    createdAt: "2026-10-06T00:00:00.000Z",
    ...overrides,
  });
}

function capability(overrides = {}) {
  return Object.freeze({
    id: ids.capability,
    code: "media.generate",
    category: "IMAGE",
    requiredEntitlement: "ai.media",
    defaultPolicyClass: "media-default",
    schemaVersion: 3,
    status: "RETIRED",
    ...overrides,
  });
}

function fixture(overrides = {}) {
  const order = [];
  const requestCalls = [];
  const capabilityCalls = [];
  const values = {
    request: Object.hasOwn(overrides, "request")
      ? overrides.request
      : request(),
    capability: Object.hasOwn(overrides, "capability")
      ? overrides.capability
      : capability(),
  };

  return {
    order,
    requestCalls,
    capabilityCalls,
    values,
    requestReader: {
      async loadForContext(input) {
        order.push("request");
        requestCalls.push(input);
        if (overrides.requestError) throw overrides.requestError;
        return values.request;
      },
    },
    capabilityReader: {
      async loadByCode(code) {
        order.push("capability");
        capabilityCalls.push(code);
        if (overrides.capabilityError) throw overrides.capabilityError;
        return values.capability;
      },
    },
  };
}

async function load(f, inputOverrides = {}) {
  return loadAIMediaRequestCapabilityCurrentEvidence(
    {
      requestContext: context(),
      mediaRequestId: ids.request,
      ...inputOverrides,
    },
    f.requestReader,
    f.capabilityReader,
  );
}

test("AIMEDIA-CAPREAD-BASE-001 exact AIMediaRequest read executes first and null short-circuits capability access", async () => {
  const requestContext = context();
  const f = fixture();
  const result = await load(f, {requestContext});
  assert.ok(result);
  assert.deepEqual(f.order, ["request", "capability"]);
  assert.equal(f.requestCalls.length, 1);
  assert.equal(f.requestCalls[0].requestContext, requestContext);
  assert.equal(f.requestCalls[0].mediaRequestId, ids.request);

  const hidden = fixture({request: null});
  assert.equal(await load(hidden), null);
  assert.deepEqual(hidden.order, ["request"]);
  assert.equal(hidden.capabilityCalls.length, 0);
});

test("AIMEDIA-CAPREAD-BASE-002 request dependency errors propagate unchanged before capability access", async () => {
  const expected = new Error("request-unavailable");
  const f = fixture({requestError: expected});
  await assert.rejects(load(f), error => error === expected);
  assert.deepEqual(f.order, ["request"]);
  assert.equal(f.capabilityCalls.length, 0);
});

test("AIMEDIA-CAPREAD-READ-001 exactly one capability read uses exact persisted capabilityCode", async () => {
  const f = fixture();
  const result = await load(f);
  assert.ok(result);
  assert.equal(f.capabilityCalls.length, 1);
  assert.equal(f.capabilityCalls[0], "media.generate");
});

test("AIMEDIA-CAPREAD-READ-002 missing capability returns null and capability errors propagate without fallback", async () => {
  const missing = fixture({capability: null});
  assert.equal(await load(missing), null);
  assert.deepEqual(missing.order, ["request", "capability"]);
  assert.equal(missing.capabilityCalls.length, 1);

  const expected = new Error("capability-unavailable");
  const broken = fixture({capabilityError: expected});
  await assert.rejects(load(broken), error => error === expected);
  assert.deepEqual(broken.order, ["request", "capability"]);
  assert.equal(broken.capabilityCalls.length, 1);
});

test("AIMEDIA-CAPREAD-FLOOR-001 exact DD-202 binding passes with exact request and capability references", async () => {
  const requestEvidence = request();
  const capabilityEvidence = capability();
  const f = fixture({
    request: requestEvidence,
    capability: capabilityEvidence,
  });
  const result = await load(f);
  assert.ok(result);
  assert.equal(result.request, requestEvidence);
  assert.equal(result.capability, capabilityEvidence);

  const empty = fixture({
    request: request({capabilityCode: ""}),
    capability: capability({code: ""}),
  });
  assert.ok(await load(empty));
});

test("AIMEDIA-CAPREAD-FLOOR-002 mismatch or malformed relevant binding evidence fails closed without normalization", async () => {
  const cases = [
    fixture({capability: capability({code: "MEDIA.GENERATE"})}),
    fixture({request: request({capabilityCode: " media.generate "})}),
    fixture({request: request({id: "not-a-uuid"})}),
    fixture({request: request({tenantId: "not-a-uuid"})}),
    fixture({capability: capability({id: "not-a-uuid"})}),
    fixture({capability: capability({code: 7})}),
  ];

  for (const f of cases) {
    assert.equal(await load(f), null);
    assert.equal(f.capabilityCalls.length, 1);
  }
});

test("AIMEDIA-CAPREAD-EVID-001 success is frozen and leaves raw capability and request evidence unchanged", async () => {
  const requestEvidence = request({
    status: "RAW_REQUEST_STATUS",
    moderationPolicyRef: "raw-moderation",
  });
  const capabilityEvidence = capability({
    status: "RETIRED",
    category: "IMAGE",
    requiredEntitlement: "raw-entitlement",
    defaultPolicyClass: "raw-policy",
    schemaVersion: 9,
  });
  const before = JSON.stringify([requestEvidence, capabilityEvidence]);
  const f = fixture({
    request: requestEvidence,
    capability: capabilityEvidence,
  });

  const result = await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.request, requestEvidence);
  assert.equal(result.capability, capabilityEvidence);
  assert.equal(result.capability.status, "RETIRED");
  assert.equal(result.capability.requiredEntitlement, "raw-entitlement");
  assert.equal(result.capability.defaultPolicyClass, "raw-policy");
  assert.equal(JSON.stringify([requestEvidence, capabilityEvidence]), before);
});

test("AIMEDIA-CAPREAD-BOUND-001 result exposes no eligibility entitlement policy authorization routing or execution authority", async () => {
  const result = await load(fixture());
  assert.ok(result);
  for (const forbidden of [
    "capabilityEligible",
    "capabilityCurrent",
    "entitlementAllowed",
    "policySatisfied",
    "allowedByTenantConfig",
    "promptAuthorized",
    "documentAuthorized",
    "moderationAllowed",
    "provisioningAllowed",
    "providerAuthorized",
    "modelAuthorized",
    "budgetAllowed",
    "executionAuthorized",
    "publicationAuthorized",
    "mutation",
    "eventEmitted",
  ]) {
    assert.equal(forbidden in result, false);
  }
});
