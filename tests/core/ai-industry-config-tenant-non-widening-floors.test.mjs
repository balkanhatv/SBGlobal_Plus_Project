import test from "node:test";
import assert from "node:assert/strict";

import {
  matchesAIIndustryConfigTenantNonWideningFloors,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  industryConfig: "11111111-1111-4111-8111-111111111111",
  tenantConfig: "22222222-2222-4222-8222-222222222222",
  tenant: "33333333-3333-4333-8333-333333333333",
  otherTenant: "44444444-4444-4444-8444-444444444444",
  industry: "55555555-5555-4555-8555-555555555555",
  providerA: "66666666-6666-4666-8666-666666666666",
  providerB: "77777777-7777-4777-8777-777777777777",
  providerOther: "88888888-8888-4888-8888-888888888888",
  modelA: "99999999-9999-4999-8999-999999999999",
  modelB: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  modelOther: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
});

const baseIndustryConfig = Object.freeze({
  id: ids.industryConfig,
  tenantId: ids.tenant,
  industryContextId: ids.industry,
  enabled: true,
  allowedCapabilities: Object.freeze(["CHAT"]),
  allowedProviderIds: Object.freeze([ids.providerA]),
  allowedModelIds: Object.freeze([ids.modelA]),
  domainPromptSetId: undefined,
  countryPackRefs: Object.freeze([]),
  localizationProfileRef: undefined,
  version: 7,
  updatedAt: "2026-09-28T00:00:00.000Z",
});

const baseTenantConfig = Object.freeze({
  id: ids.tenantConfig,
  tenantId: ids.tenant,
  enabled: true,
  allowedCapabilities: Object.freeze(["CHAT", "EMBEDDING"]),
  allowedProviderIds: Object.freeze([ids.providerA, ids.providerB]),
  allowedModelIds: Object.freeze([ids.modelA, ids.modelB]),
  maxSensitivityClass: "CONFIDENTIAL",
  residencyPolicyId: "residency:raw",
  monthlyBudgetPolicyRef: "budget:raw",
  retentionPolicyId: "retention:raw",
  promptOverridePolicyId: "prompt:raw",
  version: 11,
  updatedAt: "2026-09-28T00:00:00.000Z",
});

function industry(overrides = {}) {
  return Object.freeze({...baseIndustryConfig, ...overrides});
}

function tenant(overrides = {}) {
  return Object.freeze({...baseTenantConfig, ...overrides});
}

test("AIINDCFG-TENANT-CUR-001 exact same-Tenant enabled subsets pass", () => {
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(industry(), tenant()),
    true,
  );
});

test("AIINDCFG-TENANT-CUR-002 enabled Industry cannot widen disabled Tenant enablement", () => {
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      industry({enabled: true}),
      tenant({enabled: false}),
    ),
    false,
  );
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      industry({enabled: false}),
      tenant({enabled: false}),
    ),
    true,
  );
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      industry({enabled: false}),
      tenant({enabled: true}),
    ),
    true,
  );
});

test("AIINDCFG-TENANT-CUR-003 foreign Tenant or malformed identity/boolean evidence fails closed", () => {
  for (const candidateIndustry of [
    industry({id: "bad"}),
    industry({tenantId: "bad"}),
    industry({industryContextId: "bad"}),
    industry({enabled: "true"}),
  ]) {
    assert.equal(
      matchesAIIndustryConfigTenantNonWideningFloors(candidateIndustry, tenant()),
      false,
    );
  }

  for (const candidateTenant of [
    tenant({id: "bad"}),
    tenant({tenantId: "bad"}),
    tenant({enabled: 1}),
    tenant({tenantId: ids.otherTenant}),
  ]) {
    assert.equal(
      matchesAIIndustryConfigTenantNonWideningFloors(industry(), candidateTenant),
      false,
    );
  }
});

test("AIINDCFG-TENANT-CUR-004 Industry capability subset uses exact raw-string membership", () => {
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      industry({allowedCapabilities: Object.freeze(["VISION"])}),
      tenant(),
    ),
    false,
  );
  for (const capability of ["chat", "CHAT ", " Chat"]) {
    assert.equal(
      matchesAIIndustryConfigTenantNonWideningFloors(
        industry({allowedCapabilities: Object.freeze([capability])}),
        tenant(),
      ),
      false,
      capability,
    );
  }
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      industry({allowedCapabilities: Object.freeze([""])}),
      tenant({allowedCapabilities: Object.freeze([""])}),
    ),
    true,
  );
});

test("AIINDCFG-TENANT-CUR-005 Industry Provider and Model ids must be Tenant-set members", () => {
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      industry({allowedProviderIds: Object.freeze([ids.providerOther])}),
      tenant(),
    ),
    false,
  );
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      industry({allowedModelIds: Object.freeze([ids.modelOther])}),
      tenant(),
    ),
    false,
  );
});

test("AIINDCFG-TENANT-CUR-006 duplicate malformed or sparse allowlist evidence fails closed", () => {
  const sparseCapability = new Array(1);
  const sparseProvider = new Array(1);
  const sparseModel = new Array(1);

  for (const candidateIndustry of [
    industry({allowedCapabilities: ["CHAT", "CHAT"]}),
    industry({allowedCapabilities: ["CHAT", null]}),
    industry({allowedCapabilities: sparseCapability}),
    industry({allowedProviderIds: [ids.providerA, ids.providerA]}),
    industry({allowedProviderIds: [ids.providerA, "bad"]}),
    industry({allowedProviderIds: sparseProvider}),
    industry({allowedModelIds: [ids.modelA, ids.modelA]}),
    industry({allowedModelIds: [ids.modelA, "bad"]}),
    industry({allowedModelIds: sparseModel}),
  ]) {
    assert.equal(
      matchesAIIndustryConfigTenantNonWideningFloors(candidateIndustry, tenant()),
      false,
    );
  }

  for (const candidateTenant of [
    tenant({allowedCapabilities: ["CHAT", "CHAT"]}),
    tenant({allowedCapabilities: ["CHAT", null]}),
    tenant({allowedCapabilities: new Array(1)}),
    tenant({allowedProviderIds: [ids.providerA, ids.providerA]}),
    tenant({allowedProviderIds: [ids.providerA, "bad"]}),
    tenant({allowedProviderIds: new Array(1)}),
    tenant({allowedModelIds: [ids.modelA, ids.modelA]}),
    tenant({allowedModelIds: [ids.modelA, "bad"]}),
    tenant({allowedModelIds: new Array(1)}),
  ]) {
    assert.equal(
      matchesAIIndustryConfigTenantNonWideningFloors(industry(), candidateTenant),
      false,
    );
  }
});

test("AIINDCFG-TENANT-CUR-007 empty Industry subsets pass and wider Tenant sets remain valid", () => {
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      industry({
        allowedCapabilities: Object.freeze([]),
        allowedProviderIds: Object.freeze([]),
        allowedModelIds: Object.freeze([]),
      }),
      tenant(),
    ),
    true,
  );
  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      industry({
        allowedCapabilities: Object.freeze(["CHAT"]),
        allowedProviderIds: Object.freeze([ids.providerA]),
        allowedModelIds: Object.freeze([ids.modelA]),
      }),
      tenant({
        allowedCapabilities: Object.freeze(["EMBEDDING", "CHAT", "AUDIO"]),
        allowedProviderIds: Object.freeze([ids.providerB, ids.providerA]),
        allowedModelIds: Object.freeze([ids.modelB, ids.modelA]),
      }),
    ),
    true,
  );
});

test("AIINDCFG-TENANT-CUR-008 unrelated evidence stays uninterpreted and inputs remain unchanged", () => {
  const candidateIndustry = industry({
    domainPromptSetId: "not-interpreted",
    countryPackRefs: Object.freeze([null, "not-interpreted"]),
    localizationProfileRef: "",
    version: -999,
    updatedAt: "not-interpreted",
  });
  const candidateTenant = tenant({
    maxSensitivityClass: "not-interpreted",
    residencyPolicyId: "",
    monthlyBudgetPolicyRef: undefined,
    retentionPolicyId: "",
    promptOverridePolicyId: "",
    version: -999,
    updatedAt: "not-interpreted",
  });

  const beforeIndustry = JSON.stringify(candidateIndustry);
  const beforeTenant = JSON.stringify(candidateTenant);

  assert.equal(
    matchesAIIndustryConfigTenantNonWideningFloors(
      candidateIndustry,
      candidateTenant,
    ),
    true,
  );
  assert.equal(JSON.stringify(candidateIndustry), beforeIndustry);
  assert.equal(JSON.stringify(candidateTenant), beforeTenant);
});
