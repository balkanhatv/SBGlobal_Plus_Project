import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAITenantResidencyPolicyContextEvidence,
  matchesAIPolicyIdentityOwnerShapeFloor,
  matchesAIPolicyRequestContextScopeFloor,
  matchesAITenantConfigResidencyPolicyBindingFloor,
  matchesAITenantResidencyPolicyContextBindingFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  tenant: "11111111-1111-4111-8111-111111111111",
  otherTenant: "22222222-2222-4222-8222-222222222222",
  industry: "33333333-3333-4333-8333-333333333333",
  siblingIndustry: "44444444-4444-4444-8444-444444444444",
  tenantConfig: "55555555-5555-4555-8555-555555555555",
  policy: "66666666-6666-4666-8666-666666666666",
  otherPolicy: "77777777-7777-4777-8777-777777777777",
});

const tenantContext = Object.freeze({
  requestId: "request-tenant",
  correlationId: "corr-tenant",
  tenantId: ids.tenant,
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_CORE",
});

const industryContext = Object.freeze({
  requestId: "request-industry",
  correlationId: "corr-industry",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  orgUnitPath: Object.freeze([]),
  roleIds: Object.freeze([]),
  scopeClass: "TENANT_INDUSTRY",
});

const tenantConfig = Object.freeze({
  id: ids.tenantConfig,
  tenantId: ids.tenant,
  enabled: true,
  allowedCapabilities: Object.freeze(["AI.CHAT"]),
  allowedProviderIds: Object.freeze([]),
  allowedModelIds: Object.freeze([]),
  maxSensitivityClass: "CONFIDENTIAL",
  residencyPolicyId: ids.policy,
  retentionPolicyId: "88888888-8888-4888-8888-888888888888",
  promptOverridePolicyId: "99999999-9999-4999-8999-999999999999",
  version: 7,
  updatedAt: "2026-09-29T00:00:00.000Z",
});

const platformPolicy = Object.freeze({
  id: ids.policy,
  ownerScope: "PLATFORM",
  code: "RESIDENCY.DEFAULT",
  priority: 100,
  effect: "RESTRICT",
  conditionAst: Object.freeze({opaque: true}),
  constraint: Object.freeze({regions: Object.freeze(["IN-CENTRAL"])}),
  version: 3,
  status: "CUSTOM_UNINTERPRETED_STATUS",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
});

const tenantPolicy = Object.freeze({
  ...platformPolicy,
  ownerScope: "TENANT",
  tenantId: ids.tenant,
});

const industryPolicy = Object.freeze({
  ...platformPolicy,
  ownerScope: "INDUSTRY",
  tenantId: ids.tenant,
  industryContextId: ids.industry,
});

test("AIRESPOL-SHAPE-001 valid PLATFORM TENANT and INDUSTRY identity-owner shapes pass", () => {
  for (const policy of [platformPolicy, tenantPolicy, industryPolicy]) {
    assert.equal(matchesAIPolicyIdentityOwnerShapeFloor(policy), true);
  }
});

test("AIRESPOL-SHAPE-002 malformed identity owner effect version or status evidence fails closed", () => {
  for (const policy of [
    {...platformPolicy, id: "bad"},
    {...platformPolicy, tenantId: ids.tenant},
    {...tenantPolicy, tenantId: undefined},
    {...industryPolicy, industryContextId: undefined},
    {...platformPolicy, effect: "BLOCK"},
    {...platformPolicy, version: 0},
    {...platformPolicy, priority: 1.5},
    {...platformPolicy, status: ""},
  ]) {
    assert.equal(matchesAIPolicyIdentityOwnerShapeFloor(policy), false);
  }
});

test("AIRESPOL-SCOPE-001 PLATFORM same-Tenant TENANT and exact INDUSTRY applicability follows migration-0048 semantics", () => {
  assert.equal(matchesAIPolicyRequestContextScopeFloor(platformPolicy, tenantContext), true);
  assert.equal(matchesAIPolicyRequestContextScopeFloor(platformPolicy, industryContext), true);
  assert.equal(matchesAIPolicyRequestContextScopeFloor(tenantPolicy, tenantContext), true);
  assert.equal(matchesAIPolicyRequestContextScopeFloor(tenantPolicy, industryContext), true);
  assert.equal(matchesAIPolicyRequestContextScopeFloor(industryPolicy, industryContext), true);
});

test("AIRESPOL-SCOPE-002 non-Tenant targets foreign Tenant or sibling Industry fail closed", () => {
  for (const context of [
    {...tenantContext, scopeClass: "PLATFORM_GLOBAL", tenantId: undefined},
    {...tenantContext, scopeClass: "PUBLIC", tenantId: undefined},
    {...industryContext, scopeClass: "EXPLICIT_CROSS_CONTEXT"},
  ]) {
    assert.equal(matchesAIPolicyRequestContextScopeFloor(platformPolicy, context), false);
  }
  assert.equal(
    matchesAIPolicyRequestContextScopeFloor(
      {...tenantPolicy, tenantId: ids.otherTenant},
      tenantContext,
    ),
    false,
  );
  assert.equal(
    matchesAIPolicyRequestContextScopeFloor(
      {...industryPolicy, industryContextId: ids.siblingIndustry},
      industryContext,
    ),
    false,
  );
});

test("AIRESPOL-BIND-001 exact TenantAIConfig residencyPolicyId to AIPolicy id binding passes", () => {
  assert.equal(
    matchesAITenantConfigResidencyPolicyBindingFloor(tenantConfig, platformPolicy),
    true,
  );
});

test("AIRESPOL-BIND-002 malformed or mismatched config-policy identity fails", () => {
  for (const [config, policy] of [
    [{...tenantConfig, id: "bad"}, platformPolicy],
    [{...tenantConfig, tenantId: "bad"}, platformPolicy],
    [{...tenantConfig, residencyPolicyId: "bad"}, platformPolicy],
    [tenantConfig, {...platformPolicy, id: ids.otherPolicy}],
    [tenantConfig, {...platformPolicy, ownerScope: "TENANT", tenantId: undefined}],
  ]) {
    assert.equal(matchesAITenantConfigResidencyPolicyBindingFloor(config, policy), false);
  }
});

test("AIRESPOL-CTX-001 exact RequestContext Tenant applicable policy and config binding passes", () => {
  assert.equal(
    matchesAITenantResidencyPolicyContextBindingFloors(
      tenantContext,
      tenantConfig,
      platformPolicy,
    ),
    true,
  );
  assert.equal(
    matchesAITenantResidencyPolicyContextBindingFloors(
      industryContext,
      tenantConfig,
      {...industryPolicy, id: ids.policy},
    ),
    true,
  );
});

test("AIRESPOL-CTX-002 foreign Tenant inapplicable owner scope or id mismatch fails", () => {
  assert.equal(
    matchesAITenantResidencyPolicyContextBindingFloors(
      tenantContext,
      {...tenantConfig, tenantId: ids.otherTenant},
      platformPolicy,
    ),
    false,
  );
  assert.equal(
    matchesAITenantResidencyPolicyContextBindingFloors(
      tenantContext,
      tenantConfig,
      {...industryPolicy, id: ids.policy},
    ),
    false,
  );
  assert.equal(
    matchesAITenantResidencyPolicyContextBindingFloors(
      tenantContext,
      tenantConfig,
      {...platformPolicy, id: ids.otherPolicy},
    ),
    false,
  );
});

test("AIRESPOL-LOAD-001 loader receives exact RequestContext and policy id once and returns exact loaded identity", async () => {
  const calls = [];
  const port = {
    async loadForContext(input) {
      calls.push(input);
      return platformPolicy;
    },
  };
  const result = await loadAITenantResidencyPolicyContextEvidence(
    port,
    tenantContext,
    tenantConfig,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestContext, tenantContext);
  assert.equal(calls[0].policyId, tenantConfig.residencyPolicyId);
  assert.equal(result, platformPolicy);
});

test("AIRESPOL-LOAD-002 missing or mismatched evidence returns null errors propagate and policy semantics remain uninterpreted", async () => {
  assert.equal(
    await loadAITenantResidencyPolicyContextEvidence(
      {async loadForContext() { return null; }},
      tenantContext,
      tenantConfig,
    ),
    null,
  );

  assert.equal(
    await loadAITenantResidencyPolicyContextEvidence(
      {async loadForContext() { return {...platformPolicy, id: ids.otherPolicy}; }},
      tenantContext,
      tenantConfig,
    ),
    null,
  );

  const opaquePolicy = Object.freeze({
    ...platformPolicy,
    status: "RETIRED_BUT_NOT_INTERPRETED_HERE",
    conditionAst: Object.freeze({unknownGrammar: Object.freeze(["x", 1, true])}),
    constraint: Object.freeze({unknownConstraint: "opaque"}),
  });
  assert.equal(
    await loadAITenantResidencyPolicyContextEvidence(
      {async loadForContext() { return opaquePolicy; }},
      tenantContext,
      tenantConfig,
    ),
    opaquePolicy,
  );

  const dependencyError = new Error("policy-read-failed");
  await assert.rejects(
    loadAITenantResidencyPolicyContextEvidence(
      {async loadForContext() { throw dependencyError; }},
      tenantContext,
      tenantConfig,
    ),
    (error) => error === dependencyError,
  );
});
