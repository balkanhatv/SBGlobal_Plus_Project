import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAITenantConfigConstrainedPreRoutingSet,
  filterAITenantConfigProviderModelPreCandidates,
  matchesAIRequestTenantConfigCapabilityFloor,
  matchesAIRequestTenantConfigPrerequisiteFloors,
  matchesAIRequestTenantConfigSensitivityFloor,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  snapshot: "11111111-1111-4111-8111-111111111111",
  tenant: "22222222-2222-4222-8222-222222222222",
  config: "33333333-3333-4333-8333-333333333333",
  providerA: "44444444-4444-4444-8444-444444444444",
  providerB: "55555555-5555-4555-8555-555555555555",
  providerC: "66666666-6666-4666-8666-666666666666",
  modelA: "77777777-7777-4777-8777-777777777777",
  modelB: "88888888-8888-4888-8888-888888888888",
  modelC: "99999999-9999-4999-8999-999999999999",
});

const operation = Object.freeze({
  operationId: "ai.chat.generate",
  module: "AI",
  scopeClass: "TENANT_CORE",
  kind: "QUERY",
  permissionCode: "ai.chat.use",
  entitlementRequirement: "ai.chat",
  inputSchemaVersion: 3,
  outputSchemaVersion: 2,
  idempotencyPolicy: "NONE",
  rateClass: "AI_COSTED",
  auditClass: "AI_STANDARD",
  domainService: "AIGateway.generate",
  emittedEvents: Object.freeze([]),
  errorCodes: Object.freeze(["PERMISSION_DENIED", "POLICY_DENIED"]),
});

const declaration = Object.freeze({
  operation,
  ai: Object.freeze({
    apiAccessClass: "TENANT_API",
    capabilityCode: "AI.CHAT",
    streamingMode: "OPTIONAL",
    dataClassCeiling: "CONFIDENTIAL",
    residencyPolicyRef: "tenant.residency",
  }),
});

const request = Object.freeze({
  requestId: "request-1",
  capabilityCode: "AI.CHAT",
  requestContextRef: "ctx-1",
  inputSchemaVersion: 3,
  input: Object.freeze({prompt: "hello"}),
  sensitivityClass: "CONFIDENTIAL",
  residencyRequirement: "tenant-policy",
  groundingMode: "OPTIONAL",
  correlationId: "corr-1",
});

const snapshot = Object.freeze({
  id: ids.snapshot,
  tenantId: ids.tenant,
  version: "31",
  subscriptionVersion: "41",
  entitlementSnapshotVersion: "51",
  msPackVersions: Object.freeze({}),
  countryPackVersions: Object.freeze({}),
  tenantAiConfigVersion: "7",
  allowedCapabilityIds: Object.freeze([]),
  allowedApiClasses: Object.freeze(["TENANT_API"]),
  allowedProviderIds: Object.freeze([ids.providerA, ids.providerB]),
  allowedModelClasses: Object.freeze([]),
  status: "ACTIVE",
  compiledAt: "2026-09-20T00:00:00.000Z",
});

const tenantConfig = Object.freeze({
  id: ids.config,
  tenantId: ids.tenant,
  enabled: true,
  allowedCapabilities: Object.freeze(["AI.CHAT", "AI.EMBED"]),
  allowedProviderIds: Object.freeze([ids.providerA, ids.providerB]),
  allowedModelIds: Object.freeze([ids.modelA, ids.modelB]),
  maxSensitivityClass: "CONFIDENTIAL",
  residencyPolicyId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  monthlyBudgetPolicyRef: "budget.standard",
  retentionPolicyId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  promptOverridePolicyId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  version: 7,
  updatedAt: "2026-09-20T00:00:00.000Z",
});

const candidates = Object.freeze([
  Object.freeze({providerId: ids.providerB, modelId: ids.modelB}),
  Object.freeze({providerId: ids.providerA, modelId: ids.modelA}),
]);

test("AITENREQ-CAP-001 exact request capability membership passes", () => {
  assert.equal(matchesAIRequestTenantConfigCapabilityFloor(request, tenantConfig), true);
});

test("AITENREQ-CAP-002 missing duplicate or malformed Tenant capability evidence fails closed", () => {
  for (const config of [
    {...tenantConfig, allowedCapabilities: ["AI.EMBED"]},
    {...tenantConfig, allowedCapabilities: ["AI.CHAT", "AI.CHAT"]},
    {...tenantConfig, allowedCapabilities: ["AI.CHAT", 7]},
  ]) {
    assert.equal(matchesAIRequestTenantConfigCapabilityFloor(request, config), false);
  }
});

test("AITENREQ-SENS-001 every known sensitivity pair follows config ceiling >= request sensitivity", () => {
  const classes = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE_PERSONAL", "REGULATED"];
  for (let ceiling = 0; ceiling < classes.length; ceiling += 1) {
    for (let asked = 0; asked < classes.length; asked += 1) {
      assert.equal(
        matchesAIRequestTenantConfigSensitivityFloor(
          {...request, sensitivityClass: classes[asked]},
          {...tenantConfig, maxSensitivityClass: classes[ceiling]},
        ),
        ceiling >= asked,
      );
    }
  }
});

test("AITENREQ-SENS-002 unknown or malformed sensitivity/config evidence fails closed", () => {
  assert.equal(matchesAIRequestTenantConfigSensitivityFloor(
    {...request, sensitivityClass: "SECRET"},
    tenantConfig,
  ), false);
  assert.equal(matchesAIRequestTenantConfigSensitivityFloor(
    request,
    {...tenantConfig, maxSensitivityClass: "SECRET"},
  ), false);
  assert.equal(matchesAIRequestTenantConfigSensitivityFloor(
    request,
    {...tenantConfig, id: "bad"},
  ), false);
});

test("AITENREQ-BIND-001 request plus exact snapshot-bound Tenant config prerequisites pass", () => {
  assert.equal(
    matchesAIRequestTenantConfigPrerequisiteFloors(
      request,
      declaration,
      snapshot,
      tenantConfig,
    ),
    true,
  );
});

test("AITENREQ-BIND-002 version Tenant enablement capability or sensitivity failure denies", () => {
  for (const [candidateRequest, candidateSnapshot, candidateConfig] of [
    [request, {...snapshot, tenantAiConfigVersion: "8"}, tenantConfig],
    [request, {...snapshot, tenantId: ids.providerC}, tenantConfig],
    [request, snapshot, {...tenantConfig, enabled: false}],
    [{...request, capabilityCode: "AI.EMBED"}, snapshot, tenantConfig],
    [{...request, sensitivityClass: "REGULATED"}, snapshot, tenantConfig],
  ]) {
    assert.equal(
      matchesAIRequestTenantConfigPrerequisiteFloors(
        candidateRequest,
        declaration,
        candidateSnapshot,
        candidateConfig,
      ),
      false,
    );
  }
});

test("AITENROUTE-ALLOW-001 exact Provider and Model allowlist candidates return immutable canonical refs", () => {
  const result = filterAITenantConfigProviderModelPreCandidates(candidates, tenantConfig);
  assert.ok(result);
  assert.deepEqual(result, [
    {providerId: ids.providerA, modelId: ids.modelA},
    {providerId: ids.providerB, modelId: ids.modelB},
  ]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.every((entry) => Object.isFrozen(entry)), true);
});

test("AITENROUTE-ALLOW-002 valid partial candidate evidence returns only exact allowlisted pairs", () => {
  const result = filterAITenantConfigProviderModelPreCandidates([
    {providerId: ids.providerA, modelId: ids.modelA},
    {providerId: ids.providerC, modelId: ids.modelC},
    {providerId: ids.providerA, modelId: ids.modelC},
  ], tenantConfig);
  assert.deepEqual(result, [{providerId: ids.providerA, modelId: ids.modelA}]);
});

test("AITENROUTE-ALLOW-003 malformed duplicate sparse candidate or config allowlist evidence returns null", () => {
  const sparse = [{providerId: ids.providerA, modelId: ids.modelA}];
  sparse.length = 2;

  for (const [candidateEvidence, config] of [
    [[...candidates, candidates[0]], tenantConfig],
    [[{providerId: "bad", modelId: ids.modelA}], tenantConfig],
    [sparse, tenantConfig],
    [candidates, {...tenantConfig, allowedProviderIds: [ids.providerA, ids.providerA]}],
    [candidates, {...tenantConfig, allowedModelIds: [ids.modelA, "bad"]}],
  ]) {
    assert.equal(filterAITenantConfigProviderModelPreCandidates(candidateEvidence, config), null);
  }
});

test("AITENROUTE-ALLOW-004 valid empty or zero-match evidence returns immutable empty array", () => {
  const empty = filterAITenantConfigProviderModelPreCandidates([], tenantConfig);
  assert.deepEqual(empty, []);
  assert.equal(Object.isFrozen(empty), true);

  const zero = filterAITenantConfigProviderModelPreCandidates([
    {providerId: ids.providerC, modelId: ids.modelC},
  ], tenantConfig);
  assert.deepEqual(zero, []);
  assert.equal(Object.isFrozen(zero), true);
});

test("AITENROUTE-PRE-001 combined request/config prerequisite plus candidate filter returns expected set", () => {
  assert.deepEqual(buildAITenantConfigConstrainedPreRoutingSet({
    request,
    declaration,
    snapshot,
    tenantConfig,
    candidates,
  }), [
    {providerId: ids.providerA, modelId: ids.modelA},
    {providerId: ids.providerB, modelId: ids.modelB},
  ]);
});

test("AITENROUTE-PRE-002 request/config prerequisite failure returns null rather than empty success", () => {
  assert.equal(buildAITenantConfigConstrainedPreRoutingSet({
    request: {...request, sensitivityClass: "REGULATED"},
    declaration,
    snapshot,
    tenantConfig,
    candidates,
  }), null);
});

test("AITENROUTE-PRE-003 inputs remain unchanged and output grants no route authority", () => {
  const input = {request, declaration, snapshot, tenantConfig, candidates};
  const before = JSON.stringify(input);
  const result = buildAITenantConfigConstrainedPreRoutingSet(input);
  assert.ok(result);
  assert.equal(JSON.stringify(input), before);
  for (const candidate of result) {
    for (const forbidden of ["score", "fallback", "credentialRef", "routeDecisionId", "authorized"]) {
      assert.equal(forbidden in candidate, false);
    }
  }
});
